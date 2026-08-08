import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/components/ui/toast'
import { localRepository } from '../data/repository'
import type { ContentItem, Trip, TripDay } from '../domain/types'

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message
  return 'The change was not stored. Check the details and try again.'
}

export function useTrips() {
  return useQuery({ queryKey: ['trips'], queryFn: () => localRepository.listTrips() })
}

export function useTrip(tripId?: string) {
  return useQuery({ queryKey: ['trip', tripId], queryFn: () => localRepository.getTrip(tripId!), enabled: Boolean(tripId) })
}

export function useTravelMutations(tripId?: string) {
  const client = useQueryClient()
  const toast = useToast()
  const refresh = () => {
    void Promise.all([
      client.invalidateQueries({ queryKey: ['trips'] }),
      client.invalidateQueries({ queryKey: ['trip', tripId] })
    ])
  }
  const saveWithFeedback = async <Result,>(savingTitle: string, savedTitle: string, operation: () => Promise<Result>) => {
    const toastId = toast.loading(savingTitle, 'Storing this change on your device…')
    try {
      const result = await operation()
      toast.success(savedTitle, 'Your change is stored on this device.', toastId)
      return result
    } catch (error) {
      toast.error('Could not save changes', errorMessage(error), toastId)
      throw error
    }
  }
  const showActionError = (error: unknown) => toast.error('Could not finish that action', errorMessage(error))
  return {
    saveTrip: useMutation({ mutationFn: (trip: Partial<Trip> & Pick<Trip, 'title' | 'startDate' | 'endDate'>) => saveWithFeedback('Saving trip…', 'Trip saved', () => localRepository.saveTrip(trip)), onSuccess: refresh }),
    saveDay: useMutation({ mutationFn: (day: Partial<TripDay> & Pick<TripDay, 'tripId' | 'date' | 'title'>) => saveWithFeedback('Saving day…', 'Day saved', () => localRepository.saveDay(day)), onSuccess: refresh }),
    duplicateDay: useMutation({ mutationFn: (day: TripDay) => localRepository.duplicateDay(day), onSuccess: refresh, onError: showActionError }),
    moveDay: useMutation({ mutationFn: ({ day, delta, siblings }: { day: TripDay; delta: -1 | 1; siblings: TripDay[] }) => localRepository.moveDay(day, delta, siblings), onSuccess: refresh, onError: showActionError }),
    saveItem: useMutation({ mutationFn: (item: Partial<ContentItem> & Pick<ContentItem, 'tripId' | 'kind' | 'title'>) => saveWithFeedback('Saving plan item…', 'Plan item saved', () => localRepository.saveItem(item)), onSuccess: refresh }),
    deleteRecord: useMutation({ mutationFn: ({ entity, id }: { entity: 'trip' | 'day' | 'item'; id: string }) => localRepository.softDelete(entity, id), onSuccess: refresh, onError: showActionError }),
    restoreRecord: useMutation({ mutationFn: ({ entity, id }: { entity: 'trip' | 'day' | 'item'; id: string }) => localRepository.restore(entity, id), onSuccess: refresh, onError: showActionError }),
    duplicateItem: useMutation({ mutationFn: (item: ContentItem) => localRepository.duplicateItem(item), onSuccess: refresh, onError: showActionError }),
    duplicateTrip: useMutation({ mutationFn: (id: string) => localRepository.duplicateTrip(id), onSuccess: refresh, onError: showActionError }),
    moveItem: useMutation({ mutationFn: ({ item, delta, siblings }: { item: ContentItem; delta: -1 | 1; siblings: ContentItem[] }) => localRepository.moveItem(item, delta, siblings), onSuccess: refresh, onError: showActionError }),
    reorderItems: useMutation({ mutationFn: ({ activeId, overId, siblings }: { activeId: string; overId: string; siblings: ContentItem[] }) => localRepository.reorderItems(activeId, overId, siblings), onSuccess: refresh, onError: showActionError })
  }
}
