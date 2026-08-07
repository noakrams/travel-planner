export type SyncState = 'saving' | 'saved' | 'waiting' | 'attention'
export type TripStatus = 'upcoming' | 'active' | 'archived'
export type ContentKind =
  | 'activity'
  | 'booking'
  | 'stay'
  | 'transport'
  | 'place'
  | 'food'
  | 'note'
  | 'warning'
  | 'route'
  | 'expense'

export interface BaseRecord {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  version: number
}

export interface Trip extends BaseRecord {
  ownerId: string
  title: string
  subtitle: string
  startDate: string
  endDate: string
  timezone: string
  baseCurrency: string
  displayCurrency: string
  coverUrl: string
  coverAlt: string
  status: TripStatus
  shareEnabled: boolean
  shareToken?: string
}

export interface TripDay extends BaseRecord {
  tripId: string
  date: string
  title: string
  summary: string
  position: number
}

export interface ContentItem extends BaseRecord {
  tripId: string
  dayId?: string
  kind: ContentKind
  title: string
  description: string
  startTime?: string
  endTime?: string
  location?: string
  mapsUrl?: string
  provider?: string
  confirmationCode?: string
  status?: string
  position: number
  imageUrl?: string
  imageAlt?: string
  plannedAmount?: number
  actualAmount?: number
  currency?: string
  occurredOn?: string
  paid?: boolean
}

export interface MediaRecord extends BaseRecord {
  tripId: string
  itemId?: string
  sourceType: 'upload' | 'external'
  storagePath?: string
  externalUrl?: string
  altText: string
  caption: string
  position: number
  blob?: Blob
}

export interface OutboxEntry extends BaseRecord {
  tripId: string
  entity: 'trip' | 'day' | 'item' | 'media'
  entityId: string
  operation: 'create' | 'update' | 'delete' | 'upload'
  payload: unknown
  baseVersion: number
  retryCount: number
  state: 'pending' | 'processing' | 'failed'
  error?: string
}

export interface TripBundle {
  trip: Trip
  days: TripDay[]
  items: ContentItem[]
  media: MediaRecord[]
}

export const contentKindLabels: Record<ContentKind, string> = {
  activity: 'Activity',
  booking: 'Booking',
  stay: 'Stay',
  transport: 'Transport',
  place: 'Place',
  food: 'Food & nightlife',
  note: 'Note',
  warning: 'Warning',
  route: 'Route stop',
  expense: 'Expense'
}
