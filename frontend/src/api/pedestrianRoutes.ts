import axios from 'axios'
import { httpClient } from './httpClient'
import type { RoutePlan } from '../features/route/routeOrigins'
import type { RouteCoordinate, RouteLeg, RouteResult } from '../features/route/routeTypes'

interface PedestrianRouteApiResponse {
  coordinates: Array<{ longitude: number; latitude: number }>
  distanceMeters: number
  durationSeconds: number
  legs: RouteLeg[]
}

export class PedestrianRouteError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PedestrianRouteError'
  }
}

export function toPedestrianRouteRequest(coordinates: RouteCoordinate[]) {
  return {
    coordinates: coordinates.map(([longitude, latitude]) => ({ longitude, latitude })),
  }
}

export async function requestPedestrianRoute(
  plan: RoutePlan,
  signal: AbortSignal,
): Promise<RouteResult> {
  try {
    const response = await httpClient.post<PedestrianRouteApiResponse>(
      '/api/routes/pedestrian',
      toPedestrianRouteRequest(plan.coordinates),
      { signal },
    )
    return mergeRoutePlanWithResponse(plan, response.data)
  } catch (error) {
    if (axios.isCancel(error)) throw error
    if (error instanceof PedestrianRouteError) throw error
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message
      throw new PedestrianRouteError(
        typeof message === 'string'
          ? message
          : '도보 경로를 계산하지 못했습니다. 잠시 후 다시 시도해 주세요.',
      )
    }
    throw new PedestrianRouteError('도보 경로를 계산하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }
}

export function mergeRoutePlanWithResponse(
  plan: RoutePlan,
  response: PedestrianRouteApiResponse,
): RouteResult {
  const parsed = parsePedestrianRouteResponse(response)
  const result = { ...plan, ...parsed }

  if (import.meta.env?.DEV) {
    console.debug('[pedestrian-route]', JSON.stringify({
      requestLocationCount: plan.coordinates.length,
      legCount: result.legs.length,
      routeCoordinateCount: result.coordinates.length,
    }))
  }
  return result
}

export function parsePedestrianRouteResponse(response: PedestrianRouteApiResponse) {
  if (
    !Array.isArray(response.coordinates) ||
    response.coordinates.length < 2 ||
    !Number.isFinite(response.distanceMeters) ||
    !Number.isFinite(response.durationSeconds) ||
    !Array.isArray(response.legs)
  ) {
    throw new PedestrianRouteError('도보 경로 응답 형식이 올바르지 않습니다.')
  }

  const coordinates = response.coordinates.map(({ longitude, latitude }) => {
    if (
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
      !Number.isFinite(latitude) || latitude < -90 || latitude > 90
    ) {
      throw new PedestrianRouteError('도보 경로 응답 좌표가 올바르지 않습니다.')
    }
    return [longitude, latitude] as RouteCoordinate
  })

  return {
    coordinates,
    distanceMeters: response.distanceMeters,
    durationSeconds: response.durationSeconds,
    legs: response.legs,
  }
}
