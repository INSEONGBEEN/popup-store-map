import axios from 'axios'
import type { PopupStore } from '../types/popupStore'
import type { RouteCoordinate, RouteResult } from '../features/route/routeTypes'

const DEFAULT_OSRM_BASE_URL = 'https://router.project-osrm.org'
const osrmBaseUrl = import.meta.env?.VITE_OSRM_BASE_URL || DEFAULT_OSRM_BASE_URL

interface OsrmRoute {
  distance: number
  duration: number
  geometry?: {
    type: string
    coordinates: number[][]
  }
}

export interface OsrmRouteResponse {
  code: string
  message?: string
  routes?: OsrmRoute[]
}

export class RouteRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RouteRequestError'
  }
}

export function buildOsrmRouteUrl(
  popupStores: PopupStore[],
  baseUrl = osrmBaseUrl,
): string {
  if (popupStores.length < 2) {
    throw new RouteRequestError('경로를 찾으려면 팝업스토어를 2개 이상 선택해 주세요.')
  }
  if (popupStores.length > 8) {
    throw new RouteRequestError('경로는 팝업스토어를 최대 8개까지 선택할 수 있습니다.')
  }

  const coordinates = popupStores.map((popupStore) => {
    if (!hasValidCoordinate(popupStore)) {
      throw new RouteRequestError(`${popupStore.name}의 위치 정보가 올바르지 않습니다.`)
    }
    return `${popupStore.longitude},${popupStore.latitude}`
  })

  const normalizedBaseUrl = baseUrl.replace(/\/$/, '')
  return `${normalizedBaseUrl}/route/v1/driving/${coordinates.join(';')}?overview=full&geometries=geojson&steps=false`
}

export function parseOsrmResponse(response: OsrmRouteResponse): RouteResult {
  if (response.code !== 'Ok') {
    throw new RouteRequestError('경로를 계산하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }

  const route = response.routes?.[0]
  if (!route || !Number.isFinite(route.distance) || !Number.isFinite(route.duration)) {
    throw new RouteRequestError('경로 결과가 비어 있거나 올바르지 않습니다.')
  }
  if (
    !route.geometry ||
    route.geometry.type !== 'LineString' ||
    !Array.isArray(route.geometry.coordinates) ||
    route.geometry.coordinates.length < 2
  ) {
    throw new RouteRequestError('경로선 정보가 올바르지 않습니다.')
  }

  const coordinates = route.geometry.coordinates.map(toRouteCoordinate)
  return {
    coordinates,
    distanceMeters: route.distance,
    durationSeconds: route.duration,
  }
}

export async function requestOsrmRoute(
  popupStores: PopupStore[],
  signal: AbortSignal,
): Promise<RouteResult> {
  const url = buildOsrmRouteUrl(popupStores)
  try {
    const response = await axios.get<OsrmRouteResponse>(url, { signal, timeout: 20_000 })
    return parseOsrmResponse(response.data)
  } catch (error) {
    if (axios.isCancel(error)) throw error
    if (error instanceof RouteRequestError) throw error
    throw new RouteRequestError('경로 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.')
  }
}

function hasValidCoordinate(popupStore: PopupStore): boolean {
  return (
    typeof popupStore.latitude === 'number' &&
    typeof popupStore.longitude === 'number' &&
    Number.isFinite(popupStore.latitude) &&
    Number.isFinite(popupStore.longitude) &&
    popupStore.latitude >= -90 &&
    popupStore.latitude <= 90 &&
    popupStore.longitude >= -180 &&
    popupStore.longitude <= 180
  )
}

function toRouteCoordinate(coordinate: number[]): RouteCoordinate {
  const [longitude, latitude] = coordinate
  if (
    coordinate.length < 2 ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new RouteRequestError('경로선 좌표가 올바르지 않습니다.')
  }
  return [longitude, latitude]
}
