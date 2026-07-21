import Feature from 'ol/Feature'
import LineString from 'ol/geom/LineString'
import { fromLonLat } from 'ol/proj'
import Stroke from 'ol/style/Stroke'
import Style from 'ol/style/Style'
import type { RouteCoordinate } from '../features/route/routeTypes'

export const routeStyles = [
  new Style({
    stroke: new Stroke({ color: 'rgb(255 255 255 / 90%)', width: 9 }),
  }),
  new Style({
    stroke: new Stroke({ color: '#2563eb', width: 5 }),
  }),
]

export function createRouteFeature(coordinates: RouteCoordinate[]): Feature<LineString> | null {
  if (coordinates.length < 2 || coordinates.some(([longitude, latitude]) => (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ))) {
    return null
  }

  return new Feature({
    geometry: new LineString(
      coordinates.map(([longitude, latitude]) => fromLonLat([longitude, latitude])),
    ),
  })
}
