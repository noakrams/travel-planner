import { ArrowSquareOut } from '@phosphor-icons/react/ArrowSquareOut'
import { CalendarDots } from '@phosphor-icons/react/CalendarDots'
import { Clock } from '@phosphor-icons/react/Clock'
import { Funnel } from '@phosphor-icons/react/Funnel'
import { MapPin } from '@phosphor-icons/react/MapPin'
import { X } from '@phosphor-icons/react/X'
import { format } from 'date-fns'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { TripMapCanvas } from '../components/TripMapCanvas'
import { TripLayout } from '../components/TripLayout'
import { buildTripMapPoints, buildTripMapRoutes, mapKindLabels, mappableKinds, type TripMapPoint } from '../domain/map'
import type { ContentItem, ContentKind, TripDay } from '../domain/types'
import { coordinatesFromMapsUrl, hasMapGeocoding, persistMapPointCoordinates, resolveMapPointCoordinates } from '../data/mapCoordinates'

type CoordinateOverride = { latitude: number; longitude: number }

export function MapPage() {
  return <TripLayout variant="map">{({ days, items, canEdit, editMode }) => <TripMapContent days={days} items={items} canEdit={canEdit} editMode={editMode} />}</TripLayout>
}

function TripMapContent({ days, items, canEdit, editMode }: { days: TripDay[]; items: ContentItem[]; canEdit: boolean; editMode: boolean }) {
  const [selectedDayIds, setSelectedDayIds] = useState<Set<string>>(new Set())
  const [selectedKinds, setSelectedKinds] = useState<Set<ContentKind>>(new Set(mappableKinds))
  const [selectedPointId, setSelectedPointId] = useState<string>()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [missingOpen, setMissingOpen] = useState(false)
  const [coordinateOverrides, setCoordinateOverrides] = useState<Record<string, CoordinateOverride>>({})
  const [repositionPointId, setRepositionPointId] = useState<string>()
  const [locationStatus, setLocationStatus] = useState('')
  const attempted = useRef(new Set<string>())
  const showAllDays = selectedDayIds.size === 0
  // A Maps link is the explicit opt-in for a route pin. It keeps secondary
  // notes off the map and gives the geocoder a trustworthy location source.
  const coordinatesFromLinks = useMemo(() => Object.fromEntries(items.flatMap((item) => {
    const coordinates = coordinatesFromMapsUrl(item.mapsUrl)
    return coordinates ? [[item.id, coordinates]] : []
  })), [items])
  const mapItems = useMemo(() => items.filter((item) => !item.mapHidden && Boolean(item.mapsUrl)), [items])
  const allPoints = useMemo(() => buildTripMapPoints(mapItems, days).map((point) => ({ ...point, ...coordinatesFromLinks[point.item.id], ...coordinateOverrides[point.id] })), [coordinateOverrides, coordinatesFromLinks, days, mapItems])
  const visiblePoints = useMemo(() => allPoints.filter((point) => {
    if (!selectedKinds.has(point.item.kind)) return false
    if (showAllDays) return true
    return Boolean(point.day && selectedDayIds.has(point.day.id))
  }), [allPoints, selectedDayIds, selectedKinds, showAllDays])
  const routes = useMemo(() => buildTripMapRoutes(visiblePoints, selectedDayIds, showAllDays), [selectedDayIds, showAllDays, visiblePoints])
  const selectedPoint = allPoints.find((point) => point.id === selectedPointId)
  const missingPoints = visiblePoints.filter((point) => !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude))
  const missingCount = missingPoints.length

  useEffect(() => {
    let active = true
    const locate = async () => {
      const unresolved = allPoints.filter((point) => !Number.isFinite(point.latitude) && !attempted.current.has(point.id))
      if (!unresolved.length || !hasMapGeocoding()) return
      const updates: Record<string, CoordinateOverride> = {}
      for (const point of unresolved) {
        attempted.current.add(point.id)
        const coordinates = await resolveMapPointCoordinates(point).catch(() => undefined)
        if (!active || !coordinates) continue
        updates[point.id] = coordinates
      }
      if (active && Object.keys(updates).length) setCoordinateOverrides((current) => ({ ...current, ...updates }))
    }
    void locate()
    return () => { active = false }
  }, [allPoints])

  const toggleDay = (dayId: string) => setSelectedDayIds((current) => {
    const next = new Set(current)
    if (next.has(dayId)) next.delete(dayId)
    else next.add(dayId)
    return next
  })
  const toggleKind = (kind: ContentKind) => setSelectedKinds((current) => {
    const next = new Set(current)
    if (next.has(kind)) next.delete(kind)
    else next.add(kind)
    return next
  })
  const reposition = async (longitude: number, latitude: number) => {
    const point = allPoints.find((entry) => entry.id === repositionPointId)
    if (!point) return
    const coordinates = { latitude, longitude }
    setCoordinateOverrides((current) => ({ ...current, [point.id]: coordinates }))
    setRepositionPointId(undefined)
    setLocationStatus('Pin moved')
    try { await persistMapPointCoordinates(point, coordinates) }
    catch { setLocationStatus('The pin moved on this device but could not be saved to Neon.') }
  }

  return <section className="trip-map-page" aria-label="Trip map" data-visible-points={visiblePoints.length} data-missing-points={missingCount}>
    <div className="map-toolbar">
      <nav className="map-day-filters" aria-label="Filter map by day">
        <button type="button" className={showAllDays ? 'active' : ''} aria-pressed={showAllDays} onClick={() => setSelectedDayIds(new Set())}>All days</button>
        {days.map((day, index) => <button type="button" key={day.id} className={selectedDayIds.has(day.id) ? 'active' : ''} aria-pressed={selectedDayIds.has(day.id)} onClick={() => toggleDay(day.id)}>
          <span className="map-day-dot" style={{ '--day-color': allPoints.find((point) => point.day?.id === day.id)?.color ?? '#60706a' } as CSSProperties} />
          <span>Day {index + 1}</span><small>{format(new Date(`${day.date}T12:00:00`), 'MMM d')}</small>
        </button>)}
      </nav>
      <button type="button" className={`map-filter-trigger${filtersOpen ? ' active' : ''}`} aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}><Funnel aria-hidden="true" />Filters<span>{selectedKinds.size}</span></button>
      {filtersOpen ? <div className="map-filter-panel" role="dialog" aria-label="Map type filters">
        <div><strong>Show on map</strong><button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)}><X /></button></div>
        {mappableKinds.map((kind) => <label key={kind}><input type="checkbox" checked={selectedKinds.has(kind)} onChange={() => toggleKind(kind)} /><span>{mapKindLabels[kind]}</span></label>)}
      </div> : null}
    </div>
    {repositionPointId ? <div className="map-reposition-banner" role="status"><MapPin />Tap the map to place this pin.<button type="button" onClick={() => setRepositionPointId(undefined)}>Cancel</button></div> : null}
    {locationStatus ? <p className="map-location-status" role="status">{locationStatus}</p> : null}
    {editMode && missingCount > 0 && !selectedPoint ? <button type="button" className="map-missing-trigger" aria-expanded={missingOpen} onClick={() => setMissingOpen((open) => !open)}><MapPin />{missingCount} {missingCount === 1 ? 'place needs a pin' : 'places need pins'}</button> : null}
    {missingOpen ? <aside className="map-missing-panel" aria-label="Places needing map coordinates">
      <div><strong>Place pins manually</strong><button type="button" aria-label="Close places needing pins" onClick={() => setMissingOpen(false)}><X /></button></div>
      <p>Select a place, choose Move pin, then tap its exact position on the map.</p>
      <div className="map-missing-list">{missingPoints.map((point) => <button type="button" key={point.id} aria-label={`Place ${point.label}`} onClick={() => { setSelectedPointId(point.id); setMissingOpen(false) }}>
        <span className="map-day-dot" style={{ '--day-color': point.color } as CSSProperties} />
        <span><strong>{point.label}</strong><small>{point.day ? `Day ${(point.dayIndex ?? 0) + 1}` : 'Whole trip'} · {mapKindLabels[point.item.kind]}</small></span>
      </button>)}</div>
    </aside> : null}
    <TripMapCanvas points={visiblePoints} routes={routes} selectedPointId={selectedPointId} repositionPointId={repositionPointId} onSelect={setSelectedPointId} onReposition={reposition} />
    {!visiblePoints.length ? <div className="map-empty"><MapPin /><h2>No places match these filters.</h2><p>Choose another day or turn on more place types.</p></div> : null}
    {selectedPoint ? <MapDetails point={selectedPoint} editMode={editMode} onClose={() => setSelectedPointId(undefined)} onMove={() => setRepositionPointId(selectedPoint.id)} /> : null}
    <div className="sr-only" aria-label="Visible map places">{visiblePoints.map((point) => <button type="button" key={point.id} onClick={() => setSelectedPointId(point.id)}>Open {point.label}</button>)}</div>
  </section>
}

function MapDetails({ point, editMode, onClose, onMove }: { point: TripMapPoint; editMode: boolean; onClose: () => void; onMove: () => void }) {
  const mapsHref = point.item.mapsUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point.query)}`
  return <aside className="map-details" aria-label={`Details for ${point.label}`}>
    <div className="map-details-handle" aria-hidden="true" />
    <button type="button" className="map-details-close" aria-label="Close place details" onClick={onClose}><X /></button>
    {point.item.imageUrl ? <img src={point.item.imageUrl} alt={point.item.imageAlt ?? ''} /> : null}
    <div className="map-details-body">
      <div className="map-details-marker" style={{ '--marker-color': point.color } as CSSProperties}>{point.stopNumber ?? <MapPin />}</div>
      <div className="map-details-title"><p>{mapKindLabels[point.item.kind]}</p><h2>{point.label}</h2></div>
      <div className="map-details-meta">
        {point.day ? <span><CalendarDots />Day {(point.dayIndex ?? 0) + 1} · {format(new Date(`${point.day.date}T12:00:00`), 'MMM d')}</span> : <span><MapPin />Whole-trip place</span>}
        {point.item.startTime ? <span><Clock />{point.item.startTime}</span> : null}
      </div>
      {point.item.description ? <p className="map-details-description">{point.item.description}</p> : null}
      <div className="map-details-actions">
        <a href={mapsHref} target="_blank" rel="noreferrer"><ArrowSquareOut />Open in Maps</a>
        {editMode ? <button type="button" onClick={onMove}><MapPin />Move pin</button> : null}
      </div>
    </div>
  </aside>
}
