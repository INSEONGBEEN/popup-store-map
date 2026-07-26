import { useCallback, useEffect, useState } from 'react'
import { recordPopupView } from '../../api/popupEngagement'
import type { PopupStore } from '../../types/popupStore'

type UpdateEngagement = (popupStoreId: number, engagement: PopupStore['engagement']) => void

export function usePopupStoreDetails(
  popupStores: PopupStore[],
  updateEngagement: UpdateEngagement,
) {
  const [activeStore, setActiveStore] = useState<PopupStore | null>(null)
  const [homeDetailStore, setHomeDetailStore] = useState<PopupStore | null>(null)
  const [highlightedStore, setHighlightedStore] = useState<PopupStore | null>(null)

  useEffect(() => {
    setActiveStore((current) => current
      ? popupStores.find(({ id }) => id === current.id) ?? current
      : null)
    setHomeDetailStore((current) => current
      ? popupStores.find(({ id }) => id === current.id) ?? current
      : null)
  }, [popupStores])

  const recordDetailsView = useCallback((store: PopupStore) => {
    void recordPopupView(store.id)
      .then((engagement) => updateEngagement(store.id, engagement))
      .catch(() => undefined)
  }, [updateEngagement])

  const openMapDetails = useCallback((store: PopupStore) => {
    setActiveStore(store)
    setHomeDetailStore(null)
    recordDetailsView(store)
  }, [recordDetailsView])

  const openHomeDetails = useCallback((store: PopupStore) => {
    setHomeDetailStore(store)
    setActiveStore(null)
    recordDetailsView(store)
  }, [recordDetailsView])

  return {
    activeStore,
    homeDetailStore,
    highlightedStore,
    setActiveStore,
    setHomeDetailStore,
    setHighlightedStore,
    openMapDetails,
    openHomeDetails,
  }
}
