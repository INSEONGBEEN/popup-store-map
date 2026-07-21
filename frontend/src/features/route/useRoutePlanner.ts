import { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { requestPedestrianRoute, PedestrianRouteError } from '../../api/pedestrianRoutes'
import { requestRouteOptimization } from '../../api/routeOptimization'
import type { PopupStore } from '../../types/popupStore'
import { buildRoutePlan, routeOriginCoordinate, RoutePlanError, SEONGSU_STATION } from './routeOrigins'
import {
  addSelectedStore,
  moveSelectedStore,
  removeSelectedStore,
  routeStatusAfterSelectionChange,
  type AddSelectionResult,
} from './routeSelection'
import type {
  CurrentLocation,
  RouteOptimizationState,
  RouteOriginType,
  RouteState,
} from './routeTypes'

const INITIAL_ROUTE_STATE: RouteState = {
  status: 'idle',
  result: null,
  errorMessage: null,
}

const INITIAL_OPTIMIZATION_STATE: RouteOptimizationState = {
  status: 'idle', result: null, errorMessage: null,
}

export function useRoutePlanner(currentLocation: CurrentLocation | null) {
  const [selectedStores, setSelectedStores] = useState<PopupStore[]>([])
  const [originType, setOriginTypeState] = useState<RouteOriginType>('SEONGSU_STATION')
  const [routeState, setRouteState] = useState<RouteState>(INITIAL_ROUTE_STATE)
  const [selectionMessage, setSelectionMessage] = useState<string | null>(null)
  const [optimizationState, setOptimizationState] = useState<RouteOptimizationState>(INITIAL_OPTIMIZATION_STATE)
  const abortControllerRef = useRef<AbortController | null>(null)
  const optimizationAbortRef = useRef<AbortController | null>(null)
  const originalStoresRef = useRef<PopupStore[] | null>(null)

  const invalidateRoute = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setRouteState((current) => ({
      status: routeStatusAfterSelectionChange(current.status),
      result: null,
      errorMessage: null,
    }))
    optimizationAbortRef.current?.abort()
    optimizationAbortRef.current = null
    originalStoresRef.current = null
    setOptimizationState(INITIAL_OPTIMIZATION_STATE)
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
    optimizationAbortRef.current?.abort()
    optimizationAbortRef.current = null
    originalStoresRef.current = null
    setOptimizationState(INITIAL_OPTIMIZATION_STATE)
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

  const recommendOrder = useCallback(async () => {
    optimizationAbortRef.current?.abort()
    const controller = new AbortController()
    optimizationAbortRef.current = controller
    setOptimizationState({ status: 'loading', result: null, errorMessage: null })
    try {
      if (originType === 'FIRST_SELECTED_STORE') {
        throw new RoutePlanError('최적 순서 추천은 성수역 또는 현재 위치 출발에서 사용할 수 있습니다.')
      }
      const origin = routeOriginCoordinate(originType, selectedStores, currentLocation)
      const departureName = originType === 'SEONGSU_STATION' ? SEONGSU_STATION.name : '현재 위치'
      const result = await requestRouteOptimization(
        origin, selectedStores, departureName, controller.signal,
      )
      if (optimizationAbortRef.current !== controller) return
      originalStoresRef.current = [...selectedStores]
      setOptimizationState({ status: 'success', result, errorMessage: null })
    } catch (error) {
      if (axios.isCancel(error) || optimizationAbortRef.current !== controller) return
      setOptimizationState({
        status: 'error',
        result: null,
        errorMessage: error instanceof Error ? error.message : '최적 방문 순서를 계산하지 못했습니다.',
      })
    } finally {
      if (optimizationAbortRef.current === controller) optimizationAbortRef.current = null
    }
  }, [currentLocation, originType, selectedStores])

  const applyRecommendation = useCallback(() => {
    const result = optimizationState.result
    if (!result) return
    const ordered = result.orderedStoreIds.map((id) => selectedStores.find((store) => store.id === id))
    if (ordered.some((store) => !store)) return
    setSelectedStores(ordered as PopupStore[])
    setRouteState({ status: 'success', result: result.route, errorMessage: null })
    setOptimizationState((current) => ({ ...current, status: 'applied' }))
  }, [optimizationState.result, selectedStores])

  const restoreOriginalOrder = useCallback(() => {
    if (!originalStoresRef.current) return
    setSelectedStores(originalStoresRef.current)
    setRouteState(INITIAL_ROUTE_STATE)
    setOptimizationState((current) => ({ ...current, status: 'success' }))
  }, [])

  useEffect(() => () => {
    abortControllerRef.current?.abort()
    optimizationAbortRef.current?.abort()
  }, [])

  return {
    selectedStores,
    originType,
    routeState,
    selectionMessage,
    optimizationState,
    addStore,
    removeStore,
    moveStore,
    clearStores,
    setOriginType,
    calculateRoute,
    recommendOrder,
    applyRecommendation,
    restoreOriginalOrder,
  }
}
