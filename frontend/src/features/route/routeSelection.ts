import type { PopupStore } from '../../types/popupStore'
import type { RouteStatus } from './routeTypes'

export const MIN_ROUTE_STORES = 2
export const MAX_ROUTE_STORES = 8

export type AddSelectionResult = 'added' | 'duplicate' | 'limit'

export function addSelectedStore(
  selectedStores: PopupStore[],
  popupStore: PopupStore,
): { stores: PopupStore[]; result: AddSelectionResult } {
  if (selectedStores.some((selected) => selected.id === popupStore.id)) {
    return { stores: selectedStores, result: 'duplicate' }
  }
  if (selectedStores.length >= MAX_ROUTE_STORES) {
    return { stores: selectedStores, result: 'limit' }
  }
  return { stores: [...selectedStores, popupStore], result: 'added' }
}

export function removeSelectedStore(
  selectedStores: PopupStore[],
  popupStoreId: number,
): PopupStore[] {
  if (!selectedStores.some((popupStore) => popupStore.id === popupStoreId)) {
    return selectedStores
  }
  return selectedStores.filter((popupStore) => popupStore.id !== popupStoreId)
}

export function moveSelectedStore(
  selectedStores: PopupStore[],
  popupStoreId: number,
  direction: 'up' | 'down',
): PopupStore[] {
  const currentIndex = selectedStores.findIndex((popupStore) => popupStore.id === popupStoreId)
  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= selectedStores.length) {
    return selectedStores
  }

  const reordered = [...selectedStores]
  ;[reordered[currentIndex], reordered[targetIndex]] = [
    reordered[targetIndex],
    reordered[currentIndex],
  ]
  return reordered
}

export function routeStatusAfterSelectionChange(status: RouteStatus): RouteStatus {
  return status === 'loading' || status === 'success' || status === 'stale' ? 'stale' : 'idle'
}
