import { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { requestPedestrianRoute, PedestrianRouteError } from '../../api/pedestrianRoutes'
import type { PopupStore } from '../../types/popupStore'
import { buildRoutePlan, RoutePlanError } from './routeOrigins'
import {
  addSelectedStore,
  moveSelectedStore,
  removeSelectedStore,
  routeStatusAfterSelectionChange,
  type AddSelectionResult,
} from './routeSelection'
import type { CurrentLocation, RouteOriginType, RouteState } from './routeTypes'

const INITIAL_ROUTE_STATE: RouteState = {
  status: 'idle',
  result: null,
  errorMessage: null,
}

export function useRoutePlanner(currentLocation: CurrentLocation | null) {
  const [selectedStores, setSelectedStores] = useState<PopupStore[]>([])
  const [originType, setOriginTypeState] = useState<RouteOriginType>('SEONGSU_STATION')
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

  const setOriginType = useCallback((nextOriginType: RouteOriginType) => {
    if (nextOriginType === originType) return
    setOriginTypeState(nextOriginType)
    setSelectionMessage(null)
    invalidateRoute()
  }, [invalidateRoute, originType])

  const calculateRoute = useCallback(async () => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller
    setSelectionMessage(null)
    setRouteState({ status: 'loading', result: null, errorMessage: null })

    try {
      const plan = buildRoutePlan(originType, selectedStores, currentLocation)
      const result = await requestPedestrianRoute(plan, controller.signal)
      if (abortControllerRef.current !== controller) return
      setRouteState({ status: 'success', result, errorMessage: null })
    } catch (error) {
      if (axios.isCancel(error) || abortControllerRef.current !== controller) return
      const message =
        error instanceof PedestrianRouteError || error instanceof RoutePlanError
          ? error.message
          : '경로를 계산하지 못했습니다. 잠시 후 다시 시도해 주세요.'
      setRouteState({ status: 'error', result: null, errorMessage: message })
    } finally {
      if (abortControllerRef.current === controller) abortControllerRef.current = null
    }
  }, [currentLocation, originType, selectedStores])

  useEffect(() => {
    if (originType === 'CURRENT_LOCATION') invalidateRoute()
  }, [currentLocation, invalidateRoute, originType])

  useEffect(() => () => abortControllerRef.current?.abort(), [])

  return {
    selectedStores,
    originType,
    routeState,
    selectionMessage,
    addStore,
    removeStore,
    moveStore,
    clearStores,
    setOriginType,
    calculateRoute,
  }
}
