import { expect, test, type Locator, type Page } from '@playwright/test'

async function expectInsideViewport(dialog: Locator, page: Page) {
  await expect(dialog).toBeVisible()
  const [box, viewport, metrics] = await Promise.all([
    dialog.boundingBox(),
    Promise.resolve(page.viewportSize()),
    dialog.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      translateX: getComputedStyle(element).getPropertyValue('--tw-translate-x')
    }))
  ])
  expect(box).not.toBeNull()
  expect(viewport).not.toBeNull()
  if (!box || !viewport) return
  expect(box.x).toBeGreaterThanOrEqual(-1)
  expect(box.y).toBeGreaterThanOrEqual(-1)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1)
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth)
  if (viewport.width <= 767) expect(metrics.translateX.trim()).toBe('0')
}

test('Japan fixture includes the planned Tokyo days from September 18 to 22', async ({ page }) => {
  await page.goto('#/trip/trip-japan-2026')
  await expect(page.getByRole('button', { name: /FRI 18/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /TUE 22/i })).toBeVisible()
  await page.getByRole('button', { name: /TUE 22/i }).click()
  await expect(page.getByRole('heading', { name: 'The east loop — Asakusa, Akihabara, and an easy last night' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sensō-ji at opening' })).toBeVisible()
})

test('mobile stay grouping contains every date without overlapping the next group', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('#/trip/trip-japan-2026')

  const group = page.locator('.day-strip-group').first()
  const lastDate = page.getByRole('button', { name: /Tue 22/i })
  const [groupBox, lastDateBox] = await Promise.all([group.boundingBox(), lastDate.boundingBox()])

  expect(groupBox).not.toBeNull()
  expect(lastDateBox).not.toBeNull()
  if (!groupBox || !lastDateBox) return
  expect(lastDateBox.x).toBeGreaterThanOrEqual(groupBox.x)
  expect(lastDateBox.x + lastDateBox.width).toBeLessThanOrEqual(groupBox.x + groupBox.width + 1)
})

test('iphone-landscape stay grouping contains every date', async ({ page }) => {
  await page.goto('#/trip/trip-japan-2026')

  const group = page.locator('.day-strip-group').first()
  const lastDate = page.getByRole('button', { name: /Tue 22/i })
  const [groupBox, lastDateBox] = await Promise.all([group.boundingBox(), lastDate.boundingBox()])

  expect(groupBox).not.toBeNull()
  expect(lastDateBox).not.toBeNull()
  if (!groupBox || !lastDateBox) return
  expect(lastDateBox.x + lastDateBox.width).toBeLessThanOrEqual(groupBox.x + groupBox.width + 1)
})

test('mobile navigation stays clear of itinerary content and the page does not overflow', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('#/trip/trip-japan-2026')

  const navigation = page.locator('.bottom-nav')
  const dayStrip = page.locator('.day-strip')
  const heading = page.getByRole('heading', { name: 'Arrive — and nothing else' })
  const [navigationBox, dayStripBox, headingBox, pageWidth] = await Promise.all([
    navigation.boundingBox(),
    dayStrip.boundingBox(),
    heading.boundingBox(),
    page.evaluate(() => ({ client: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  ])

  expect(navigationBox).not.toBeNull()
  expect(dayStripBox).not.toBeNull()
  expect(headingBox).not.toBeNull()
  if (!navigationBox || !dayStripBox || !headingBox) return
  expect(navigationBox.y + navigationBox.height).toBeLessThanOrEqual(dayStripBox.y + 1)
  expect(dayStripBox.y + dayStripBox.height).toBeLessThanOrEqual(headingBox.y + 1)
  expect(pageWidth.scroll).toBe(pageWidth.client)
})

test('owner can create a mixed-direction itinerary item', async ({ page }) => {
  await page.goto('#/trip/trip-portugal-2026')
  await page.getByRole('button', { name: 'Edit trip' }).click()
  await page.getByRole('button', { name: 'Add item' }).click()
  await page.getByLabel('Title').fill('ארוחת ערב at Prado')
  await page.getByLabel('Notes').fill('להגיע בשעה 20:30 — booking under Noa')
  await page.getByRole('button', { name: 'Save changes' }).click()
  const title = page.getByRole('heading', { name: 'ארוחת ערב at Prado' })
  await expect(title).toBeVisible()
  await expect(title).toHaveAttribute('dir', 'rtl')
  const saveToast = page.getByRole('status').filter({ hasText: 'Plan item saved' })
  await expect(saveToast).toBeVisible()
  const toastBox = await saveToast.boundingBox()
  const viewport = page.viewportSize()
  expect(toastBox).not.toBeNull()
  expect(viewport).not.toBeNull()
  const navigation = page.locator('.bottom-nav')
  const navigationPosition = await navigation.evaluate((element) => getComputedStyle(element).position)
  if (toastBox && navigationPosition === 'fixed') {
    const navigationBox = await navigation.boundingBox()
    expect(navigationBox).not.toBeNull()
    if (navigationBox && navigationBox.height > navigationBox.width) expect(toastBox.x + toastBox.width).toBeLessThan(navigationBox.x)
    else if (navigationBox) expect(toastBox.y + toastBox.height).toBeLessThan(navigationBox.y)
  } else if (toastBox && viewport) {
    expect(viewport.width - (toastBox.x + toastBox.width)).toBeLessThanOrEqual(24)
    expect(viewport.height - (toastBox.y + toastBox.height)).toBeGreaterThanOrEqual(0)
    expect(viewport.height - (toastBox.y + toastBox.height)).toBeLessThanOrEqual(120)
  }
})

test('cached trip remains readable and edits queue offline', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit online CRUD is covered separately; Playwright WebKit does not reliably combine simulated offline mode with IndexedDB writes.')
  await page.goto('#/trip/trip-portugal-2026')
  await expect(page.getByRole('heading', { name: 'Portugal, slowly' })).toBeVisible()
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.addInitScript(() => Object.defineProperty(Navigator.prototype, 'onLine', { configurable: true, get: () => false }))
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Portugal, slowly' })).toBeVisible()
  await expect(page.getByRole('banner').getByText('Waiting to sync')).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Your change is safe on this device' })).toBeVisible()
  await page.getByRole('button', { name: 'Edit trip' }).click()
  await page.getByRole('button', { name: 'Add item' }).click()
  await page.getByLabel('Title').fill('Offline café note')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByRole('heading', { name: 'Offline café note' })).toBeVisible()
})

test('a saved itinerary edit survives closing and reopening the tab', async ({ page, context }) => {
  await page.goto('#/trip/trip-japan-2026')
  await page.getByRole('button', { name: 'Edit trip' }).click()
  await page.getByRole('button', { name: 'Actions for Land at Narita Airport' }).click()
  await page.getByRole('menuitem', { name: 'Edit' }).click()
  await page.getByLabel('Title').fill('Land at Narita Airport — saved')
  await page.getByRole('button', { name: 'Save changes' }).click()
  await expect(page.getByLabel('Arrive — and nothing else').getByRole('heading', { name: 'Land at Narita Airport — saved' })).toBeVisible()

  await page.close()
  const reopened = await context.newPage()
  await reopened.goto('#/trip/trip-japan-2026')
  await expect(reopened.getByLabel('Arrive — and nothing else').getByRole('heading', { name: 'Land at Narita Airport — saved' })).toBeVisible()
})

test('budget overview groups costs and can switch display currency', async ({ page }) => {
  await page.goto('#/trip/trip-portugal-2026/budget')
  await expect(page.getByRole('heading', { name: 'Know what the plan costs.' })).toBeVisible()
  const summary = page.getByRole('region', { name: 'Trip budget summary' })
  await expect(summary).toContainText('€3,500')
  await expect(summary).toContainText('€2,678')
  await expect(page.getByRole('heading', { name: 'Where the budget goes' })).toBeVisible()
  await expect(page.getByText('Accommodation', { exact: true })).toBeVisible()
  await expect(page.getByText('Transportation', { exact: true })).toBeVisible()

  await page.getByLabel('Show totals in').click()
  await page.getByRole('option', { name: 'USD' }).click()
  await expect(summary).toContainText('$4,013.33')
  await expect(summary).toContainText('$3,070.77')
})

test('total trip budget follows the sum of category budgets', async ({ page }) => {
  await page.goto('#/trip/trip-japan-2026/budget')
  await page.getByRole('button', { name: 'Edit trip' }).click()
  await page.getByRole('button', { name: 'Set budgets' }).click()

  const total = page.getByLabel('Total trip budget')
  await expect(total).toHaveValue('900000')
  await expect(total).toHaveAttribute('readonly', '')
  await page.getByLabel('Shopping').fill('60000')
  await expect(total).toHaveValue('910000')

  await page.getByRole('button', { name: 'Save budgets' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Trip saved' })).toBeVisible()
  await expect(page.getByLabel('Trip budget summary')).toContainText('¥910,000')
})

test('keyboard focus and dialog escape remain predictable', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'macOS WebKit follows the system Full Keyboard Access setting; Chromium covers deterministic keyboard traversal.')
  await page.goto('#/trip/trip-portugal-2026')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
  await page.getByRole('button', { name: 'Edit trip' }).click()
  await page.getByRole('button', { name: 'Add item' }).click()
  await expect(page.getByRole('dialog', { name: 'What belongs in the plan?' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'What belongs in the plan?' })).toBeHidden()
})

test('primary mobile controls meet the 44px target', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('#/trip/trip-portugal-2026')
  const controls = page.locator('.bottom-nav a, .hero-actions button')
  for (let index = 0; index < await controls.count(); index += 1) {
    const box = await controls.nth(index).boundingBox()
    expect(box?.height).toBeGreaterThanOrEqual(44)
    expect(box?.width).toBeGreaterThanOrEqual(44)
  }
})

for (const viewport of [
  { name: 'phone', width: 375, height: 812 },
  { name: 'desktop', width: 1440, height: 1000 }
]) {
  test(`shared editors stay fully visible on ${viewport.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)

    await page.goto('#/trip/trip-portugal-2026')
    await page.getByRole('button', { name: 'Edit trip' }).click()
    await page.getByRole('button', { name: 'Add item' }).click()
    await expectInsideViewport(page.getByRole('dialog', { name: 'What belongs in the plan?' }), page)
    if (viewport.name === 'phone') await page.screenshot({ path: testInfo.outputPath('item-editor.png') })
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Edit day details' }).click()
    await expectInsideViewport(page.getByRole('dialog', { name: 'Edit day' }), page)
    await page.keyboard.press('Escape')

    await page.goto('#/trip/trip-japan-2026/budget')
    await page.getByRole('button', { name: 'Edit trip' }).click()
    await page.getByRole('button', { name: 'Set budgets' }).click()
    await expectInsideViewport(page.getByRole('dialog', { name: 'Set the guardrails' }), page)
    if (viewport.name === 'phone') await page.screenshot({ path: testInfo.outputPath('budget-editor.png') })
    await page.keyboard.press('Escape')

    await page.goto('#/trip/trip-japan-2026/more')
    await page.getByRole('button', { name: 'Edit trip' }).click()
    await page.getByRole('button', { name: 'Trip settings' }).click()
    await expectInsideViewport(page.getByRole('dialog', { name: 'Settings' }), page)
    await page.keyboard.press('Escape')

    await page.goto('#/')
    await page.getByRole('button', { name: 'New trip' }).click()
    await expectInsideViewport(page.getByRole('dialog', { name: 'Create a trip' }), page)
  })

  test(`every app route renders without horizontal clipping on ${viewport.name}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)
    for (const [name, route, heading] of [
      ['trips', '#/', 'Where are you going next?'],
      ['plan', '#/trip/trip-portugal-2026', 'Arrival in Lisbon'],
      ['dated-plan', '#/trip/trip-portugal-2026/day/2026-10-08', 'Arrival in Lisbon'],
      ['bookings', '#/trip/trip-portugal-2026/bookings', 'Bookings'],
      ['budget', '#/trip/trip-portugal-2026/budget', 'Know what the plan costs.'],
      ['more', '#/trip/trip-portugal-2026/more', 'More to remember'],
      ['shared-invalid', '#/share/invalid-test-token', 'This share link is invalid or no longer active.'],
      ['auth-callback', '#/auth/callback', 'Where are you going next?'],
      ['unknown-route', '#/not-a-real-page', 'Where are you going next?']
    ]) {
      await page.goto(route)
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible()
      await expect(page.locator('body')).toHaveJSProperty('scrollWidth', viewport.width)
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true })
    }
  })
}

test('reduced motion preference disables long transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('#/trip/trip-portugal-2026')
  const duration = await page.getByRole('button', { name: 'Edit trip' }).evaluate((element) => Number.parseFloat(getComputedStyle(element).transitionDuration))
  expect(duration).toBeLessThanOrEqual(0.001)
})

for (const viewport of [
  { name: '375', width: 375, height: 812 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 900 },
  { name: '1440', width: 1440, height: 1000 },
  { name: 'iphone-landscape', width: 844, height: 390 }
]) {
  test(`layout has no horizontal overflow at ${viewport.name}`, async ({ page }, testInfo) => {
    if (viewport.name === 'iphone-landscape') {
      test.skip(testInfo.project.name !== 'iphone-landscape', 'The dedicated landscape device project supplies correct iPhone safe-area insets.')
    }
    await page.setViewportSize(viewport)
    await page.goto('#/trip/trip-portugal-2026')
    await expect(page.getByRole('heading', { name: 'Portugal, slowly' })).toBeVisible()
    const firstItineraryImage = page.locator('.card-image img').first()
    await expect(firstItineraryImage).toHaveJSProperty('complete', true)
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', viewport.width)
    await page.screenshot({
      path: `test-results/visual-${testInfo.project.name}-${viewport.name}.png`,
      fullPage: viewport.name !== 'iphone-landscape'
    })
  })
}
