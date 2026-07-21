import { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { requestOsrmRoute, RouteRequestError } from '../../api/osrm'
import type { PopupStore } from '../../types/popupStore'
import {
  addSelectedStore,
  moveSelectedStore,
  removeSelectedStore,
  routeStatusAfterSelectionChange,
  type AddSelectionResult,
} from './routeSelection'
import type { RouteState } from './routeTypes'

const INITIAL_ROUTE_STATE: RouteState = {
  status: 'idle',
  result: null,
  errorMessage: null,
}

export function useRoutePlanner() {
  const [selectedStores, setSelectedStores] = useState<PopupStore[]>([])
  const [routeState, setRouteState] = useState<RouteState>(INITIAL_ROUTE_STATE)
  const [selectionMessage, setSelectionMessage] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const invalidateRoute = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setRouteState((current) => ({
      status: routeStatusAfterSelectionChange(current.status),
      result: null,
      errorMessage: null,
    }))
  }, [])

  const addStore = useCallback((popupStore: PopupStore): AddSelectionResult => {
    const next = addSelectedStore(selectedStores, popupStore)
    if (next.result === 'added') {
      setSelectedStores(next.stores)
      invalidateRoute()
    }

    setSelectionMessage(
      next.result === 'duplicate'
        ? '이미 경로에 선택된 팝업스토어입니다.'
        : next.result === 'limit'
          ? '팝업스토어는 최대 8개까지 선택할 수 있습니다.'
          : null,
    )
    return next.result
  }, [invalidateRoute, selectedStores])

  const removeStore = useCallback((popupStoreId: number) => {
    const next = removeSelectedStore(selectedStores, popupStoreId)
    if (next === selectedStores) return
    setSelectedStores(next)
    setSelectionMessage(null)
    invalidateRoute()
  }, [invalidateRoute, selectedStores])

  const moveStore = useCallback((popupStoreId: number, direction: 'up' | 'down') => {
    const next = moveSelectedStore(selectedStores, popupStoreId, direction)
    if (next === selectedStores) return
    setSelectedStores(next)
    setSelectionMessage(null)
    invalidateRoute()
  }, [invalidateRoute, selectedStores])

  const clearStores = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setSelectedStores([])
    setSelectionMessage(null)
    setRouteState(INITIAL_ROUTE_STATE)
  }, [])

  const calculateRoute = useCallback(async () => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller
    setSelectionMessage(null)
    setRouteState({ status: 'loading', result: null, errorMessage: null })

    try {
      const result = await requestOsrmRoute(selectedStores, controller.signal)
      if (abortControllerRef.current !== controller) return
      setRouteState({ status: 'success', result, errorMessage: null })
    } catch (error) {
      if (axios.isCancel(error) || abortControllerRef.current !== controller) return
      const message =
        error instanceof RouteRequestError
          ? error.message
          : '경로를 계산하지 못했습니다. 잠시 후 다시 시도해 주세요.'
      setRouteState({ status: 'error', result: null, errorMessage: message })
    } finally {
      if (abortControllerRef.current === controller) abortControllerRef.current = null
    }
  }, [selectedStores])

  useEffect(() => () => abortControllerRef.current?.abort(), [])

  return {
    selectedStores,
    routeState,
    selectionMessage,
    addStore,
    removeStore,
    moveStore,
    clearStores,
    calculateRoute,
  }
}
