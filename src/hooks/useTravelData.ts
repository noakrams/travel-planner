import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { localRepository } from '../data/repository'
import type { ContentItem, Trip, TripDay } from '../domain/types'

export function useTrips() {
  return useQuery({ queryKey: ['trips'], queryFn: () => localRepository.listTrips() })
}

export function useTrip(tripId?: string) {
  return useQuery({ queryKey: ['trip', tripId], queryFn: () => localRepository.getTrip(tripId!), enabled: Boolean(tripId) })
}

export function useTravelMutations(tripId?: string) {
  const client = useQueryClient()
  const refresh = () => {
    void Promise.all([
      client.invalidateQueries({ queryKey: ['trips'] }),
      client.invalidateQueries({ queryKey: ['trip', tripId] })
    ])
  }
  return {
    saveTrip: useMutation({ mutationFn: (trip: Partial<Trip> & Pick<Trip, 'title' | 'startDate' | 'endDate'>) => localRepository.saveTrip(trip), onSuccess: refresh }),
    saveDay: useMutation({ mutationFn: (day: Partial<TripDay> & Pick<TripDay, 'tripId' | 'date' | 'title'>) => localRepository.saveDay(day), onSuccess: refresh }),
    duplicateDay: useMutation({ mutationFn: (day: TripDay) => localRepository.duplicateDay(day), onSuccess: refresh }),
    moveDay: useMutation({ mutationFn: ({ day, delta, siblings }: { day: TripDay; delta: -1 | 1; siblings: TripDay[] }) => localRepository.moveDay(day, delta, siblings), onSuccess: refresh }),
    saveItem: useMutation({ mutationFn: (item: Partial<ContentItem> & Pick<ContentItem, 'tripId' | 'kind' | 'title'>) => localRepository.saveItem(item), onSuccess: refresh }),
    deleteRecord: useMutation({ mutationFn: ({ entity, id }: { entity: 'trip' | 'day' | 'item'; id: string }) => localRepository.softDelete(entity, id), onSuccess: refresh }),
    restoreRecord: useMutation({ mutationFn: ({ entity, id }: { entity: 'trip' | 'day' | 'item'; id: string }) => localRepository.restore(entity, id), onSuccess: refresh }),
    duplicateItem: useMutation({ mutationFn: (item: ContentItem) => localRepository.duplicateItem(item), onSuccess: refresh }),
    duplicateTrip: useMutation({ mutationFn: (id: string) => localRepository.duplicateTrip(id), onSuccess: refresh }),
    moveItem: useMutation({ mutationFn: ({ item, delta, siblings }: { item: ContentItem; delta: -1 | 1; siblings: ContentItem[] }) => localRepository.moveItem(item, delta, siblings), onSuccess: refresh }),
    reorderItems: useMutation({ mutationFn: ({ activeId, overId, siblings }: { activeId: string; overId: string; siblings: ContentItem[] }) => localRepository.reorderItems(activeId, overId, siblings), onSuccess: refresh })
  }
}
