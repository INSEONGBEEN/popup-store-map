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
import { createRouteFeature, routeStyles } from './popupStoreRoute'
import {
  createCurrentLocationFeatures,
  currentLocationAccuracyStyle,
  currentLocationMarkerStyle,
} from './currentLocationLayer'
import type { CurrentLocation, RouteCoordinate } from '../features/route/routeTypes'
import type { PopupStore } from '../types/popupStore'

interface PopupStoreMapProps {
  popupStores: PopupStore[]
  activeStoreId: number | null
  selectedStores: PopupStore[]
  routeCoordinates: RouteCoordinate[] | null
  currentLocation: CurrentLocation | null
  geolocationStatus: 'idle' | 'loading' | 'success' | 'error'
  geolocationError: string | null
  onRequestCurrentLocation: () => void
  onSelect: (popupStore: PopupStore) => void
}

const SEONGSU_CENTER = fromLonLat([127.0508, 37.5454])

export function PopupStoreMap({
  popupStores,
  activeStoreId,
  selectedStores,
  routeCoordinates,
  currentLocation,
  geolocationStatus,
  geolocationError,
  onRequestCurrentLocation,
  onSelect,
}: PopupStoreMapProps) {
  const targetRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const vectorSourceRef = useRef<VectorSource | null>(null)
  const vectorLayerRef = useRef<VectorLayer | null>(null)
  const routeSourceRef = useRef<VectorSource | null>(null)
  const locationAccuracySourceRef = useRef<VectorSource | null>(null)
  const locationMarkerSourceRef = useRef<VectorSource | null>(null)
  const onSelectRef = useRef(onSelect)
  const locatedPopupStores = popupStores.filter(isValidCoordinate)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    if (!targetRef.current || mapRef.current) return

    const vectorSource = new VectorSource()
    const routeSource = new VectorSource()
    const locationAccuracySource = new VectorSource()
    const locationMarkerSource = new VectorSource()
    const routeLayer = new VectorLayer({ source: routeSource, style: routeStyles, zIndex: 10 })
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: markerStyleFor(null),
      zIndex: 20,
    })
    const locationAccuracyLayer = new VectorLayer({
      source: locationAccuracySource,
      style: currentLocationAccuracyStyle,
      zIndex: 30,
    })
    const locationMarkerLayer = new VectorLayer({
      source: locationMarkerSource,
      style: currentLocationMarkerStyle,
      zIndex: 40,
    })
    const map = new Map({
      target: targetRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        routeLayer,
        vectorLayer,
        locationAccuracyLayer,
        locationMarkerLayer,
      ],
      view: new View({ center: SEONGSU_CENTER, zoom: 14.4 }),
    })

    const clickKey = map.on('singleclick', (event) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (candidate) => candidate)
      const popupStore = feature?.get('popupStore') as PopupStore | undefined
      if (popupStore) onSelectRef.current(popupStore)
    })

    vectorSourceRef.current = vectorSource
    vectorLayerRef.current = vectorLayer
    routeSourceRef.current = routeSource
    locationAccuracySourceRef.current = locationAccuracySource
    locationMarkerSourceRef.current = locationMarkerSource
    mapRef.current = map
    return () => {
      unByKey(clickKey)
      vectorSource.clear()
      routeSource.clear()
      locationAccuracySource.clear()
      locationMarkerSource.clear()
      map.setTarget(undefined)
      map.dispose()
      vectorSourceRef.current = null
      vectorLayerRef.current = null
      routeSourceRef.current = null
      locationAccuracySourceRef.current = null
      locationMarkerSourceRef.current = null
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
    vectorLayerRef.current?.setStyle(
      markerStyleFor(activeStoreId, selectedStores.map((popupStore) => popupStore.id)),
    )
    vectorSourceRef.current?.changed()
  }, [activeStoreId, selectedStores])

  useEffect(() => {
    const routeSource = routeSourceRef.current
    const map = mapRef.current
    if (!routeSource || !map) return

    routeSource.clear()
    if (!routeCoordinates) return

    const routeFeature = createRouteFeature(routeCoordinates)
    if (!routeFeature) return

    routeSource.addFeature(routeFeature)
    map.getView().fit(routeFeature.getGeometry()!.getExtent(), {
      padding: [70, 70, 70, 70],
      maxZoom: 16,
      duration: 450,
    })
  }, [routeCoordinates])

  useEffect(() => {
    const accuracySource = locationAccuracySourceRef.current
    const markerSource = locationMarkerSourceRef.current
    const map = mapRef.current
    if (!accuracySource || !markerSource || !map) return
    accuracySource.clear()
    markerSource.clear()
    if (!currentLocation) return

    const { center, accuracyFeature, markerFeature } = createCurrentLocationFeatures(currentLocation)
    accuracySource.addFeature(accuracyFeature)
    markerSource.addFeature(markerFeature)
    map.getView().animate({ center, zoom: Math.max(map.getView().getZoom() ?? 0, 16), duration: 500 })
  }, [currentLocation])

  return (
    <div className="map-container">
      <div ref={targetRef} className="map" aria-label="성수동 팝업스토어 지도" />
      <div className="marker-picker">
        <label htmlFor="popup-store-marker-select">키보드로 마커 선택</label>
        <select
          id="popup-store-marker-select"
          value={activeStoreId ?? ''}
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
      <div className="geolocation-control">
        <button
          type="button"
          disabled={geolocationStatus === 'loading'}
          onClick={onRequestCurrentLocation}
        >
          {geolocationStatus === 'loading' ? '위치 확인 중…' : '현재 위치'}
        </button>
        {geolocationError && <p role="alert">{geolocationError}</p>}
      </div>
    </div>
  )
}
