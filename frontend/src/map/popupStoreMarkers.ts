import Feature, { type FeatureLike } from 'ol/Feature'
import Point from 'ol/geom/Point'
import { fromLonLat } from 'ol/proj'
import CircleStyle from 'ol/style/Circle'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import Style from 'ol/style/Style'
import Text from 'ol/style/Text'
import type { PopupStore } from '../types/popupStore'

export type LocatedPopupStore = PopupStore & {
  latitude: number
  longitude: number
}

const markerStyle = new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({ color: '#ef5b3f' }),
    stroke: new Stroke({ color: '#ffffff', width: 3 }),
  }),
})

const activeMarkerStyle = new Style({
  image: new CircleStyle({
    radius: 11,
    fill: new Fill({ color: '#ef5b3f' }),
    stroke: new Stroke({ color: '#fbbf24', width: 4 }),
  }),
  zIndex: 10,
})

export function isValidCoordinate(store: PopupStore): store is LocatedPopupStore {
  return (
    typeof store.latitude === 'number' &&
    typeof store.longitude === 'number' &&
    Number.isFinite(store.latitude) &&
    Number.isFinite(store.longitude) &&
    store.latitude >= -90 &&
    store.latitude <= 90 &&
    store.longitude >= -180 &&
    store.longitude <= 180
  )
}

export function createPopupStoreFeatures(stores: PopupStore[]): Feature<Point>[] {
  return stores.filter(isValidCoordinate).map((store) => {
    const feature = new Feature({
      geometry: new Point(fromLonLat([store.longitude, store.latitude])),
      popupStore: store,
    })
    feature.setId(store.id)
    return feature
  })
}

export function markerStyleFor(activeId: number | null, selectedStoreIds: number[] = []) {
  const selectedOrder = new Map(selectedStoreIds.map((id, index) => [id, index + 1]))
  const numberedStyles = new Map<number, Style>()

  return (feature: FeatureLike) => {
    const id = Number(feature.getId())
    const order = selectedOrder.get(id)
    if (order) {
      let style = numberedStyles.get(order)
      if (!style) {
        style = new Style({
          image: new CircleStyle({
            radius: 12,
            fill: new Fill({ color: '#172554' }),
            stroke: new Stroke({ color: id === activeId ? '#fbbf24' : '#ffffff', width: 3 }),
          }),
          text: new Text({
            text: String(order),
            fill: new Fill({ color: '#ffffff' }),
            font: '700 12px sans-serif',
          }),
          zIndex: 30,
        })
        numberedStyles.set(order, style)
      }
      return style
    }
    return id === activeId ? activeMarkerStyle : markerStyle
  }
}
