import * as maptilersdk from '@maptiler/sdk'
import type { TripMapPoint } from '../domain/map'
import type { ContentItem } from '../domain/types'
import { localRepository } from './repository'
import { getNeon, hasNeonConfig } from './neon'

const apiKey = import.meta.env.VITE_MAPTILER_API_KEY as string | undefined
if (apiKey) maptilersdk.config.apiKey = apiKey

type Coordinates = { latitude: number; longitude: number }

const coordinatePair = /(-?\d{1,2}(?:\.\d+)?)[,/]\s*(-?\d{1,3}(?:\.\d+)?)/
const googleAtPair = /@(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/

function validCoordinates(latitude: number, longitude: number): Coordinates | undefined {
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180 ? { latitude, longitude } : undefined
}

export function coordinatesFromMapsUrl(rawUrl?: string): Coordinates | undefined {
  if (!rawUrl) return undefined
  try {
    const url = new URL(rawUrl)
    const query = url.searchParams.get('query') ?? url.searchParams.get('q') ?? ''
    const match = query.match(coordinatePair) ?? decodeURIComponent(url.pathname).match(googleAtPair)
    if (!match) return undefined
    return validCoordinates(Number(match[1]), Number(match[2]))
  } catch {
    const match = rawUrl.match(googleAtPair)
    return match ? validCoordinates(Number(match[1]), Number(match[2])) : undefined
  }
}

export async function resolveMapPointCoordinates(point: TripMapPoint): Promise<Coordinates | undefined> {
  const fromUrl = point.role !== 'origin' ? coordinatesFromMapsUrl(point.item.mapsUrl) : undefined
  if (fromUrl) return fromUrl
  if (!apiKey || !point.query) return undefined
  const result = await maptilersdk.geocoding.forward(point.query, { limit: 1 })
  const center = result.features[0]?.center
  return center ? validCoordinates(center[1], center[0]) : undefined
}

function localPatch(point: TripMapPoint, coordinates: Coordinates): Partial<ContentItem> {
  if (point.role === 'origin') return {
    originLatitude: coordinates.latitude,
    originLongitude: coordinates.longitude,
    originGeocodedLocation: point.query
  }
  if (point.role === 'destination') return {
    destinationLatitude: coordinates.latitude,
    destinationLongitude: coordinates.longitude,
    destinationGeocodedLocation: point.query
  }
  return {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    geocodedLocation: point.query
  }
}

const tableForKind = (kind: ContentItem['kind']) => ({
  activity: 'itinerary_items', booking: 'bookings', stay: 'stays', transport: 'transports',
  place: 'places', food: 'food_nightlife', route: 'route_stops', note: 'notes', warning: 'warnings', expense: 'expenses'
})[kind]

export async function persistMapPointCoordinates(point: TripMapPoint, coordinates: Coordinates) {
  const patch = localPatch(point, coordinates)
  if (hasNeonConfig()) {
    const neon = await getNeon()
    if (!neon) throw new Error('Map coordinates could not be saved.')
    const timestamp = new Date().toISOString()
    const table = tableForKind(point.item.kind)
    const { data: current, error: versionError } = await neon.from(table).select('version').eq('id', point.item.id).eq('trip_id', point.item.tripId).single()
    if (versionError) throw versionError
    const nextVersion = Number(current?.version ?? point.item.version) + 1
    const remotePatch = point.role === 'origin' ? {
      origin_latitude: coordinates.latitude,
      origin_longitude: coordinates.longitude,
      origin_geocoded_location: point.query,
      origin_geocoded_at: timestamp,
      updated_at: timestamp,
      version: nextVersion
    } : point.role === 'destination' ? {
      destination_latitude: coordinates.latitude,
      destination_longitude: coordinates.longitude,
      destination_geocoded_location: point.query,
      destination_geocoded_at: timestamp,
      updated_at: timestamp,
      version: nextVersion
    } : {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      geocoded_location: point.query,
      geocoded_at: timestamp,
      updated_at: timestamp,
      version: nextVersion
    }
    const { error } = await neon.from(table).update(remotePatch).eq('id', point.item.id).eq('trip_id', point.item.tripId)
    if (error) throw error
  }
  await localRepository.cacheMapCoordinates(point.item.id, patch)
  return patch
}

export function hasMapGeocoding() {
  return Boolean(apiKey)
}
