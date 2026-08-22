import { describe, expect, it } from 'vitest'
import { coordinatesFromMapsUrl } from './mapCoordinates'

describe('map coordinate parsing', () => {
  it('reads coordinates from a Google Maps query', () => {
    expect(coordinatesFromMapsUrl('https://www.google.com/maps/search/?api=1&query=38.7139,-9.1334')).toEqual({ latitude: 38.7139, longitude: -9.1334 })
  })

  it('reads coordinates from an at-style Google Maps URL', () => {
    expect(coordinatesFromMapsUrl('https://www.google.com/maps/place/Lisbon/@38.7223,-9.1393,14z')).toEqual({ latitude: 38.7223, longitude: -9.1393 })
  })

  it('rejects invalid coordinate ranges', () => {
    expect(coordinatesFromMapsUrl('https://maps.google.com/?q=190,800')).toBeUndefined()
  })
})
