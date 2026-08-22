import type { ContentItem, ContentKind, TripDay } from './types'

export type MapPointRole = 'location' | 'origin' | 'destination'

export interface TripMapPoint {
  id: string
  item: ContentItem
  role: MapPointRole
  label: string
  query: string
  day?: TripDay
  dayIndex?: number
  stopNumber?: number
  latitude?: number
  longitude?: number
  color: string
}

export interface TripMapRoute {
  id: string
  kind: 'day' | 'transition' | 'trip'
  color: string
  coordinates: Array<[number, number]>
}

export const mappableKinds: ContentKind[] = ['activity', 'booking', 'stay', 'transport', 'place', 'food', 'route']

export const mapKindLabels: Partial<Record<ContentKind, string>> = {
  activity: 'Activities',
  booking: 'Bookings',
  stay: 'Stays',
  transport: 'Transport',
  place: 'Places',
  food: 'Food & nightlife',
  route: 'Route stops'
}

const dayColors = ['#d8664b', '#7e315f', '#2f7474', '#648a99', '#8b6416', '#586b4f']
const unassignedColor = '#60706a'

const hasCoordinates = (latitude?: number, longitude?: number) => Number.isFinite(latitude) && Number.isFinite(longitude)

export function buildTripMapPoints(items: ContentItem[], days: TripDay[]): TripMapPoint[] {
  const dayById = new Map(days.map((day, index) => [day.id, { day, index }]))
  const counters = new Map<string, number>()
  const points: TripMapPoint[] = []

  for (const item of items) {
    if (!mappableKinds.includes(item.kind) || item.mapHidden) continue
    const dayEntry = item.dayId ? dayById.get(item.dayId) : undefined
    const dayKey = item.dayId ?? 'unassigned'
    const color = dayEntry ? dayColors[dayEntry.index % dayColors.length] : unassignedColor
    const addPoint = (role: MapPointRole, label: string, query: string, latitude?: number, longitude?: number) => {
      if (!query.trim() && !hasCoordinates(latitude, longitude)) return
      const stopNumber = (counters.get(dayKey) ?? 0) + 1
      counters.set(dayKey, stopNumber)
      points.push({
        id: `${item.id}:${role}`,
        item,
        role,
        label,
        query: query.trim(),
        day: dayEntry?.day,
        dayIndex: dayEntry?.index,
        stopNumber: dayEntry ? stopNumber : undefined,
        latitude,
        longitude,
        color
      })
    }

    if (item.kind === 'transport') {
      addPoint('origin', item.origin ? `${item.title} — origin` : item.title, item.origin ?? '', item.originLatitude, item.originLongitude)
      addPoint('destination', item.location ? `${item.title} — destination` : item.title, item.location ?? '', item.destinationLatitude ?? item.latitude, item.destinationLongitude ?? item.longitude)
    } else {
      addPoint('location', item.title, item.location ?? item.title, item.latitude, item.longitude)
    }
  }

  return points
}

export function buildTripMapRoutes(points: TripMapPoint[], selectedDayIds: Set<string>, showAllDays: boolean): TripMapRoute[] {
  const located = points.filter((point) => hasCoordinates(point.latitude, point.longitude))
  const byDay = new Map<string, TripMapPoint[]>()
  const unassigned: TripMapPoint[] = []

  for (const point of located) {
    if (!point.day) {
      if (point.item.kind === 'route') unassigned.push(point)
      continue
    }
    if (!showAllDays && !selectedDayIds.has(point.day.id)) continue
    const bucket = byDay.get(point.day.id) ?? []
    bucket.push(point)
    byDay.set(point.day.id, bucket)
  }

  const routes: TripMapRoute[] = []
  const orderedDays = [...byDay.entries()].sort(([, a], [, b]) => (a[0].dayIndex ?? 0) - (b[0].dayIndex ?? 0))
  for (const [dayId, dayPoints] of orderedDays) {
    if (dayPoints.length > 1) routes.push({
      id: `day:${dayId}`,
      kind: 'day',
      color: dayPoints[0].color,
      coordinates: dayPoints.map((point) => [point.longitude!, point.latitude!])
    })
  }

  for (let index = 0; index < orderedDays.length - 1; index += 1) {
    const current = orderedDays[index][1]
    const next = orderedDays[index + 1][1]
    if (!current.length || !next.length || (next[0].dayIndex ?? 0) - (current[0].dayIndex ?? 0) !== 1) continue
    routes.push({
      id: `transition:${current[0].day!.id}:${next[0].day!.id}`,
      kind: 'transition',
      color: '#7e315f',
      coordinates: [[current.at(-1)!.longitude!, current.at(-1)!.latitude!], [next[0].longitude!, next[0].latitude!]]
    })
  }

  if (showAllDays && unassigned.length > 1) routes.push({
    id: 'trip:route-stops',
    kind: 'trip',
    color: '#60706a',
    coordinates: unassigned.map((point) => [point.longitude!, point.latitude!])
  })
  return routes
}

export function pointGeocodedQuery(item: ContentItem, role: MapPointRole) {
  if (role === 'origin') return item.originGeocodedLocation
  if (role === 'destination') return item.destinationGeocodedLocation ?? item.geocodedLocation
  return item.geocodedLocation
}
