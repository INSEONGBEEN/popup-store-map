import Feature from 'ol/Feature'
import CircleGeometry from 'ol/geom/Circle'
import Point from 'ol/geom/Point'
import { fromLonLat } from 'ol/proj'
import CircleStyle from 'ol/style/Circle'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import Style from 'ol/style/Style'
import type { CurrentLocation } from '../features/route/routeTypes'

export const currentLocationAccuracyStyle = new Style({
  fill: new Fill({ color: 'rgb(37 99 235 / 12%)' }),
  stroke: new Stroke({ color: 'rgb(37 99 235 / 45%)', width: 1.5 }),
})

export const currentLocationMarkerStyle = new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({ color: '#2563eb' }),
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
})

export function createCurrentLocationFeatures(location: CurrentLocation) {
  const center = fromLonLat(location.coordinate)
  const accuracyFeature = new Feature({ geometry: new CircleGeometry(center, location.accuracyMeters) })
  const markerFeature = new Feature({ geometry: new Point(center) })
  return { center, accuracyFeature, markerFeature }
}
