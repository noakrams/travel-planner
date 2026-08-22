import * as maptilersdk from '@maptiler/sdk'
import '@maptiler/sdk/dist/maptiler-sdk.css'
import * as maplibregl from 'maplibre-gl'
import { useEffect, useRef } from 'react'
import type { TripMapPoint, TripMapRoute } from '../domain/map'

const apiKey = import.meta.env.VITE_MAPTILER_API_KEY as string | undefined
if (apiKey) maptilersdk.config.apiKey = apiKey
const fallbackMapStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: 'fallback-background', type: 'background', paint: { 'background-color': '#e8eee9' } }]
}

type Props = {
  points: TripMapPoint[]
  routes: TripMapRoute[]
  selectedPointId?: string
  repositionPointId?: string
  onSelect: (pointId: string) => void
  onReposition: (longitude: number, latitude: number) => void
  onReady?: () => void
}

const pointsGeoJson = (points: TripMapPoint[]) => ({
  type: 'FeatureCollection' as const,
  features: points.flatMap((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude) ? [{
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: [point.longitude!, point.latitude!] },
    properties: { pointId: point.id, color: point.color, stopLabel: point.stopNumber ? String(point.stopNumber) : '•', selected: false }
  }] : [])
})

const routesGeoJson = (routes: TripMapRoute[]) => ({
  type: 'FeatureCollection' as const,
  features: routes.map((route) => ({
    type: 'Feature' as const,
    geometry: { type: 'LineString' as const, coordinates: route.coordinates },
    properties: { routeId: route.id, kind: route.kind, color: route.color }
  }))
})

export function TripMapCanvas({ points, routes, selectedPointId, repositionPointId, onSelect, onReposition, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const callbacksRef = useRef({ onSelect, onReposition, onReady, repositionPointId })
  const initialDataRef = useRef({ points, routes, selectedPointId })

  useEffect(() => {
    callbacksRef.current = { onSelect, onReposition, onReady, repositionPointId }
  }, [onReady, onReposition, onSelect, repositionPointId])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const sharedOptions = {
      container: containerRef.current,
      center: [12, 28] as [number, number],
      zoom: 1.5,
      attributionControl: { compact: true }
    }
    const map: maplibregl.Map = apiKey
      ? new maptilersdk.Map({
          ...sharedOptions,
          style: maptilersdk.MapStyle.STREETS.PASTEL,
          navigationControl: false,
          geolocateControl: false,
          terrainControl: false,
          projectionControl: false
        })
      : new maplibregl.Map({ ...sharedOptions, style: fallbackMapStyle })
    mapRef.current = map
    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(containerRef.current)
    requestAnimationFrame(() => map.resize())
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-left')

    map.on('load', () => {
      const initial = initialDataRef.current
      map.addSource('trip-routes', { type: 'geojson', data: routesGeoJson(initial.routes) })
      map.addLayer({
        id: 'trip-route-solid', type: 'line', source: 'trip-routes', filter: ['==', ['get', 'kind'], 'day'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ['get', 'color'], 'line-width': 4, 'line-opacity': 0.9 }
      })
      map.addLayer({
        id: 'trip-route-dashed', type: 'line', source: 'trip-routes', filter: ['!=', ['get', 'kind'], 'day'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': ['get', 'color'], 'line-width': 2.5, 'line-opacity': 0.78, 'line-dasharray': [2, 2.4] }
      })
      map.addSource('trip-points', { type: 'geojson', data: pointsGeoJson(initial.points), cluster: true, clusterMaxZoom: 12, clusterRadius: 44 })
      map.addLayer({
        id: 'trip-point-clusters', type: 'circle', source: 'trip-points', filter: ['has', 'point_count'],
        paint: { 'circle-color': '#293b35', 'circle-radius': ['step', ['get', 'point_count'], 20, 10, 24, 30, 29], 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' }
      })
      map.addLayer({
        id: 'trip-point-cluster-count', type: 'symbol', source: 'trip-points', filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Bold'], 'text-size': 12 },
        paint: { 'text-color': '#fff' }
      })
      map.addLayer({
        id: 'trip-points-unclustered', type: 'circle', source: 'trip-points', filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['case', ['==', ['get', 'pointId'], initial.selectedPointId ?? ''], 18, 15],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff'
        }
      })
      map.addLayer({
        id: 'trip-point-labels', type: 'symbol', source: 'trip-points', filter: ['!', ['has', 'point_count']],
        layout: { 'text-field': ['get', 'stopLabel'], 'text-font': ['Noto Sans Bold'], 'text-size': 11, 'text-allow-overlap': true },
        paint: { 'text-color': '#fff' }
      })

      const selectPoint = (event: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
        const pointId = event.features?.[0]?.properties?.pointId
        if (typeof pointId === 'string') callbacksRef.current.onSelect(pointId)
      }
      map.on('click', 'trip-points-unclustered', selectPoint)
      map.on('click', 'trip-point-labels', selectPoint)
      map.on('click', 'trip-point-clusters', async (event) => {
        const feature = event.features?.[0]
        const clusterId = Number(feature?.properties?.cluster_id)
        if (!feature || !Number.isFinite(clusterId) || feature.geometry.type !== 'Point') return
        const source = map.getSource('trip-points') as maplibregl.GeoJSONSource
        const zoom = await source.getClusterExpansionZoom(clusterId)
        map.easeTo({ center: feature.geometry.coordinates as [number, number], zoom })
      })
      for (const layer of ['trip-points-unclustered', 'trip-point-labels', 'trip-point-clusters']) {
        map.on('mouseenter', layer, () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', layer, () => { map.getCanvas().style.cursor = '' })
      }
      callbacksRef.current.onReady?.()
    })
    map.on('click', (event) => {
      if (callbacksRef.current.repositionPointId) callbacksRef.current.onReposition(event.lngLat.lng, event.lngLat.lat)
    })
    return () => { resizeObserver.disconnect(); map.remove(); mapRef.current = null }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    ;(map.getSource('trip-points') as maplibregl.GeoJSONSource | undefined)?.setData(pointsGeoJson(points))
    ;(map.getSource('trip-routes') as maplibregl.GeoJSONSource | undefined)?.setData(routesGeoJson(routes))
    if (map.getLayer('trip-points-unclustered')) map.setPaintProperty('trip-points-unclustered', 'circle-radius', ['case', ['==', ['get', 'pointId'], selectedPointId ?? ''], 18, 15])
    const located = points.filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
    if (!located.length) return
    const bounds = new maplibregl.LngLatBounds()
    for (const point of located) bounds.extend([point.longitude!, point.latitude!])
    map.fitBounds(bounds, { padding: { top: 104, right: window.innerWidth >= 900 ? 390 : 42, bottom: window.innerWidth >= 900 ? 70 : 260, left: 42 }, maxZoom: 14, duration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650 })
  }, [points, routes, selectedPointId])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.getCanvas().style.cursor = repositionPointId ? 'crosshair' : ''
  }, [repositionPointId])

  return <div ref={containerRef} className="trip-map-canvas" role="application" aria-label="Interactive trip map. Use the day and type filters to change visible places." />
}
