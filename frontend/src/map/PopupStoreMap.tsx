import { useEffect, useRef } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import { unByKey } from 'ol/Observable'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import { fromLonLat } from 'ol/proj'
import {
  createPopupStoreFeatures,
  isValidCoordinate,
  markerStyleFor,
} from './popupStoreMarkers'
import type { PopupStore } from '../types/popupStore'

interface PopupStoreMapProps {
  popupStores: PopupStore[]
  selectedId: number | null
  onSelect: (popupStore: PopupStore) => void
}

const SEONGSU_CENTER = fromLonLat([127.0508, 37.5454])

export function PopupStoreMap({ popupStores, selectedId, onSelect }: PopupStoreMapProps) {
  const targetRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const vectorSourceRef = useRef<VectorSource | null>(null)
  const vectorLayerRef = useRef<VectorLayer | null>(null)
  const onSelectRef = useRef(onSelect)
  const locatedPopupStores = popupStores.filter(isValidCoordinate)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    if (!targetRef.current || mapRef.current) return

    const vectorSource = new VectorSource()
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: markerStyleFor(null),
    })
    const map = new Map({
      target: targetRef.current,
      layers: [new TileLayer({ source: new OSM() }), vectorLayer],
      view: new View({ center: SEONGSU_CENTER, zoom: 14.4 }),
    })

    const clickKey = map.on('singleclick', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (candidate) => candidate)
      const popupStore = feature?.get('popupStore') as PopupStore | undefined
      if (popupStore) onSelectRef.current(popupStore)
    })

    vectorSourceRef.current = vectorSource
    vectorLayerRef.current = vectorLayer
    mapRef.current = map
    return () => {
      unByKey(clickKey)
      vectorSource.clear()
      map.setTarget(undefined)
      map.dispose()
      vectorSourceRef.current = null
      vectorLayerRef.current = null
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const source = vectorSourceRef.current
    if (!source) return
    source.clear()
    source.addFeatures(createPopupStoreFeatures(popupStores))
  }, [popupStores])

  useEffect(() => {
    vectorLayerRef.current?.setStyle(markerStyleFor(selectedId))
    vectorSourceRef.current?.changed()
  }, [selectedId])

  return (
    <div className="map-container">
      <div ref={targetRef} className="map" aria-label="성수동 팝업스토어 지도" />
      <div className="marker-picker">
        <label htmlFor="popup-store-marker-select">키보드로 마커 선택</label>
        <select
          id="popup-store-marker-select"
          value={selectedId ?? ''}
          onChange={(event) => {
            const selected = locatedPopupStores.find(
              (popupStore) => popupStore.id === Number(event.target.value),
            )
            if (selected) onSelect(selected)
          }}
        >
          <option value="">팝업스토어 선택</option>
          {locatedPopupStores.map((popupStore) => (
            <option key={popupStore.id} value={popupStore.id}>
              {popupStore.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
