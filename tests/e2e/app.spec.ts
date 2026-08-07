import { expect, test } from '@playwright/test'

test('Japan fixture includes the planned Tokyo days from September 18 to 22', async ({ page }) => {
  await page.goto('#/trip/trip-japan-2026')
  await expect(page.getByRole('button', { name: /FRI 18/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /TUE 22/i })).toBeVisible()
  await page.getByRole('button', { name: /TUE 22/i }).click()
  await expect(page.getByRole('heading', { name: 'The east loop — Asakusa, Akihabara, and an easy last night' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Sensō-ji at opening' })).toBeVisible()
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

test('budget chart has a table alternative', async ({ page }) => {
  await page.goto('#/trip/trip-portugal-2026/budget')
  await expect(page.getByRole('heading', { name: 'Planned, then lived' })).toBeVisible()
  await expect(page.getByRole('table', { name: 'Budget by category' })).toBeVisible()
  await expect(page.locator('.budget-summary strong').first()).toHaveText('EUR 1,550')
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
  await expect(page.getByRole('dialog', { name: 'Add to the trip' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Add to the trip' })).toBeHidden()
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
