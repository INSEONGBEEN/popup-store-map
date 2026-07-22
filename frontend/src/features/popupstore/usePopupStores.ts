import { useEffect, useState } from 'react'
import axios from 'axios'
import { fetchFeaturedPopupStores, fetchPopupStores } from '../../api/popupStores'
import type { PopupEngagement, PopupStore } from '../../types/popupStore'

interface PopupStoreQueryState {
  popupStores: PopupStore[]
  featuredStores: PopupStore[]
  isLoading: boolean
  errorMessage: string | null
}

export function usePopupStores(authIdentity: string = 'anonymous'): PopupStoreQueryState & {
  updateEngagement: (popupStoreId: number, engagement: PopupEngagement) => void
  updateReviewSummary: (popupStoreId: number, reviewSummary: PopupStore['reviewSummary']) => void
} {
  const [state, setState] = useState<PopupStoreQueryState>({
    popupStores: [],
    featuredStores: [],
    isLoading: true,
    errorMessage: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    async function loadPopupStores() {
      try {
        const [popupStores, featuredStores] = await Promise.all([
          fetchPopupStores(controller.signal),
          fetchFeaturedPopupStores(controller.signal),
        ])
        setState({ popupStores, featuredStores, isLoading: false, errorMessage: null })
      } catch (error) {
        if (axios.isCancel(error)) return
        setState({
          popupStores: [],
          featuredStores: [],
          isLoading: false,
          errorMessage: '팝업스토어 정보를 불러오지 못했습니다. 백엔드 실행 상태를 확인해 주세요.',
        })
      }
    }

    void loadPopupStores()
    return () => controller.abort()
  }, [authIdentity])

  const updateEngagement = (popupStoreId: number, engagement: PopupEngagement) => {
    setState((current) => ({
      ...current,
      popupStores: current.popupStores.map((store) =>
        store.id === popupStoreId ? { ...store, engagement } : store),
      featuredStores: current.featuredStores.map((store) =>
        store.id === popupStoreId ? { ...store, engagement } : store),
    }))
  }

  const updateReviewSummary = (popupStoreId: number, reviewSummary: PopupStore['reviewSummary']) => {
    setState((current) => ({
      ...current,
      popupStores: current.popupStores.map((store) => store.id === popupStoreId ? { ...store, reviewSummary } : store),
      featuredStores: current.featuredStores.map((store) => store.id === popupStoreId ? { ...store, reviewSummary } : store),
    }))
  }

  return { ...state, updateEngagement, updateReviewSummary }
}
