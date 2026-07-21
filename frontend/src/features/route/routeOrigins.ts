import type { PopupStore } from '../../types/popupStore'
import type { CurrentLocation, RouteCoordinate, RouteOriginType } from './routeTypes'

// RouteCoordinate is always [longitude, latitude] in EPSG:4326.
export const SEONGSU_STATION = {
  name: '성수역',
  coordinate: [127.055961, 37.544581] as RouteCoordinate,
} as const

export class RoutePlanError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RoutePlanError'
  }
}

export interface RoutePlan {
  coordinates: RouteCoordinate[]
  departureName: string
  destinationName: string
  popupStoreCount: number
}

export function routeOriginCoordinate(
  originType: RouteOriginType,
  selectedStores: PopupStore[],
  currentLocation: CurrentLocation | null,
): RouteCoordinate {
  if (originType === 'SEONGSU_STATION') return SEONGSU_STATION.coordinate
  if (originType === 'CURRENT_LOCATION') {
    if (!currentLocation) throw new RoutePlanError('먼저 지도에서 현재 위치를 확인해 주세요.')
    assertCoordinate(currentLocation.coordinate, '현재 위치')
    return currentLocation.coordinate
  }
  if (selectedStores.length === 0) throw new RoutePlanError('팝업스토어를 먼저 선택해 주세요.')
  return toStoreCoordinate(selectedStores[0])
}

export function buildRoutePlan(
  originType: RouteOriginType,
  selectedStores: PopupStore[],
  currentLocation: CurrentLocation | null,
): RoutePlan {
  if (selectedStores.length < 2) {
    throw new RoutePlanError('도보 경로를 찾으려면 팝업스토어를 2개 이상 선택해 주세요.')
  }

  const storeCoordinates = selectedStores.map(toStoreCoordinate)
  const destinationName = selectedStores[selectedStores.length - 1].name

  if (originType === 'SEONGSU_STATION') {
    return {
      coordinates: [SEONGSU_STATION.coordinate, ...storeCoordinates],
      departureName: SEONGSU_STATION.name,
      destinationName,
      popupStoreCount: selectedStores.length,
    }
  }

  if (originType === 'CURRENT_LOCATION') {
    if (!currentLocation) {
      throw new RoutePlanError('먼저 지도에서 현재 위치를 확인해 주세요.')
    }
    assertCoordinate(currentLocation.coordinate, '현재 위치')
    return {
      coordinates: [currentLocation.coordinate, ...storeCoordinates],
      departureName: '현재 위치',
      destinationName,
      popupStoreCount: selectedStores.length,
    }
  }

  return {
    coordinates: storeCoordinates,
    departureName: selectedStores[0].name,
    destinationName,
    popupStoreCount: selectedStores.length,
  }
}

function toStoreCoordinate(popupStore: PopupStore): RouteCoordinate {
  const coordinate: RouteCoordinate = [popupStore.longitude as number, popupStore.latitude as number]
  assertCoordinate(coordinate, popupStore.name)
  return coordinate
}

function assertCoordinate([longitude, latitude]: RouteCoordinate, name: string) {
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new RoutePlanError(`${name}의 위치 정보가 올바르지 않습니다.`)
  }
}
