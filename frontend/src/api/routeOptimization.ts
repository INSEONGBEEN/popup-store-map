import axios from 'axios'
import { httpClient } from './httpClient'
import { parsePedestrianRouteResponse, PedestrianRouteError } from './pedestrianRoutes'
import type { PopupStore } from '../types/popupStore'
import type {
  RouteCoordinate,
  RouteMetrics,
  RouteOptimizationResult,
} from '../features/route/routeTypes'

interface OptimizationApiResponse {
  originalDestinationIds: number[]
  orderedDestinationIds: number[]
  route: {
    coordinates: Array<{ longitude: number; latitude: number }>
    distanceMeters: number
    durationSeconds: number
    legs: RouteOptimizationResult['route']['legs']
  }
  original: RouteMetrics
  optimized: RouteMetrics
  savings: RouteMetrics
  algorithm: string
}

export function toOptimizationRequest(origin: RouteCoordinate, stores: PopupStore[]) {
  for (const store of stores) {
    if (store.longitude == null || store.latitude == null ||
      !Number.isFinite(store.longitude) || !Number.isFinite(store.latitude)) {
      throw new PedestrianRouteError(`${store.name}의 좌표가 올바르지 않습니다.`)
    }
  }
  return {
    origin: { longitude: origin[0], latitude: origin[1] },
    destinations: stores.map((store) => ({
      id: store.id,
      coordinate: { longitude: store.longitude, latitude: store.latitude },
    })),
    costType: 'time',
  }
}

export async function requestRouteOptimization(
  origin: RouteCoordinate,
  stores: PopupStore[],
  departureName: string,
  signal: AbortSignal,
): Promise<RouteOptimizationResult> {
  try {
    const { data } = await httpClient.post<OptimizationApiResponse>(
      '/api/routes/pedestrian/optimize',
      toOptimizationRequest(origin, stores),
      { signal },
    )
    const parsedRoute = parsePedestrianRouteResponse(data.route)
    const destination = stores.find(({ id }) => id === data.orderedDestinationIds.at(-1))
    if (!destination || data.orderedDestinationIds.length !== stores.length) {
      throw new PedestrianRouteError('최적 방문 순서 응답이 올바르지 않습니다.')
    }
    return {
      originalStoreIds: data.originalDestinationIds,
      orderedStoreIds: data.orderedDestinationIds,
      original: data.original,
      optimized: data.optimized,
      savings: data.savings,
      algorithm: data.algorithm,
      route: {
        coordinates: parsedRoute.coordinates,
        distanceMeters: parsedRoute.distanceMeters,
        durationSeconds: parsedRoute.durationSeconds,
        legs: parsedRoute.legs,
        departureName,
        destinationName: destination.name,
        popupStoreCount: stores.length,
      },
    }
  } catch (error) {
    if (axios.isCancel(error)) throw error
    if (error instanceof PedestrianRouteError) throw error
    if (axios.isAxiosError(error) && typeof error.response?.data?.message === 'string') {
      throw new PedestrianRouteError(error.response.data.message)
    }
    throw new PedestrianRouteError('최적 방문 순서를 계산하지 못했습니다.')
  }
}
