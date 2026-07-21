import { useEffect, useState } from 'react'
import axios from 'axios'
import { fetchPopupStores } from '../../api/popupStores'
import type { PopupStore } from '../../types/popupStore'

interface PopupStoreQueryState {
  popupStores: PopupStore[]
  isLoading: boolean
  errorMessage: string | null
}

export function usePopupStores(): PopupStoreQueryState {
  const [state, setState] = useState<PopupStoreQueryState>({
    popupStores: [],
    isLoading: true,
    errorMessage: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    async function loadPopupStores() {
      try {
        const popupStores = await fetchPopupStores(controller.signal)
        setState({ popupStores, isLoading: false, errorMessage: null })
      } catch (error) {
        if (axios.isCancel(error)) return
        setState({
          popupStores: [],
          isLoading: false,
          errorMessage: '팝업스토어 정보를 불러오지 못했습니다. 백엔드 실행 상태를 확인해 주세요.',
        })
      }
    }

    void loadPopupStores()
    return () => controller.abort()
  }, [])

  return state
}
