import { useEffect, useRef } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import { unByKey } from 'ol/Observable'
import type { EventsKey } from 'ol/events'
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
import type { GeolocationStatus } from '../features/geolocation/useCurrentLocation'
import type { CurrentLocation, RouteCoordinate } from '../features/route/routeTypes'
import type { PopupStore } from '../types/popupStore'

interface PopupStoreMapProps {
  popupStores: PopupStore[]
  activeStoreId: number | null
  selectedStores: PopupStore[]
  routeCoordinates: RouteCoordinate[] | null
  currentLocation: CurrentLocation | null
  geolocationStatus: GeolocationStatus
  geolocationError: string | null
  followMode: boolean
  recenterToken: number
  onRequestCurrentLocation: () => void
  onStopTracking: () => void
  onPauseFollow: () => void
  headingUp: boolean
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
  followMode,
  recenterToken,
  onRequestCurrentLocation,
  onStopTracking,
  onPauseFollow,
  headingUp,
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
  const onPauseFollowRef = useRef(onPauseFollow)
  const locatedPopupStores = popupStores.filter(isValidCoordinate)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    onPauseFollowRef.current = onPauseFollow
  }, [onPauseFollow])

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
    const interactionKeys: EventsKey[] = [
      map.on('pointerdrag', () => onPauseFollowRef.current()),
    ]

    vectorSourceRef.current = vectorSource
    vectorLayerRef.current = vectorLayer
    routeSourceRef.current = routeSource
    locationAccuracySourceRef.current = locationAccuracySource
    locationMarkerSourceRef.current = locationMarkerSource
    mapRef.current = map
    return () => {
      unByKey(clickKey)
      interactionKeys.forEach(unByKey)
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
    if (followMode) {
      const rotation = headingUp && currentLocation.headingDegrees != null &&
        (currentLocation.speedMetersPerSecond ?? 0) > 0.5
        ? -currentLocation.headingDegrees * Math.PI / 180 : 0
      map.getView().animate({ center, rotation, zoom: Math.max(map.getView().getZoom() ?? 0, 16), duration: 400 })
    }
  }, [currentLocation, followMode, headingUp, recenterToken])

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
          disabled={geolocationStatus === 'locating'}
          onClick={onRequestCurrentLocation}
        >
          {geolocationStatus === 'locating'
            ? '위치 확인 중…'
            : geolocationStatus === 'tracking' && !followMode ? '현재 위치로 복귀' : '현재 위치'}
        </button>
        {geolocationStatus === 'tracking' && (
          <button type="button" onClick={onStopTracking}>추적 종료</button>
        )}
        {geolocationError && <p role="alert">{geolocationError}</p>}
      </div>
    </div>
  )
}
