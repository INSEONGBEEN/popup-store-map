import type { PopupStore } from '../../types/popupStore'
import type { RoutePlan } from '../route/routeOrigins'
import type { RouteCoordinate } from '../route/routeTypes'

export function buildReroutePlan(origin: RouteCoordinate, stores: PopupStore[]): RoutePlan {
  const coordinates: RouteCoordinate[] = [origin]
  for (const store of stores) {
    if (store.longitude == null || store.latitude == null) throw new Error('방문지 좌표가 올바르지 않습니다.')
    coordinates.push([store.longitude, store.latitude])
  }
  return {
    coordinates,
    departureName: '현재 위치',
    destinationName: stores.at(-1)?.name ?? '목적지',
    popupStoreCount: stores.length,
  }
}
