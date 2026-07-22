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
import { defaults as defaultControls } from 'ol/control/defaults.js'
import {
  createPopupStoreFeatures,
  isValidCoordinate,
  markerStyleFor,
} from './popupStoreMarkers'
import { createRouteFeature, routeStyles } from './popupStoreRoute'
import {
  createCurrentLocationFeatures,
  currentLocationStyle,
} from './currentLocationLayer'
import type { GeolocationStatus } from '../features/geolocation/useCurrentLocation'
import type { CurrentLocation, RouteCoordinate } from '../features/route/routeTypes'
import type { PopupStore } from '../types/popupStore'

interface PopupStoreMapProps {
  popupStores: PopupStore[]
  activeStoreId: number | null
  focusStoreId: number | null
  selectedStores: PopupStore[]
  navigationStoreIds: { current: number | null; next: number | null }
  routeCoordinates: RouteCoordinate[] | null
  currentLocation: CurrentLocation | null
  geolocationStatus: GeolocationStatus
  geolocationError: string | null
  followMode: boolean
  recenterToken: number
  gpsMode: GpsDisplayMode
  onCycleGpsMode: () => void
  onStopTracking: () => void
  onPauseFollow: () => void
  onNorthUp: () => void
  headingUp: boolean
  navigationMode?: boolean
  onSelect: (popupStore: PopupStore) => void
}

export type GpsDisplayMode = 'idle' | 'located' | 'follow' | 'heading'

const SEONGSU_CENTER = fromLonLat([127.0508, 37.5454])

export function PopupStoreMap({
  popupStores,
  activeStoreId,
  focusStoreId,
  selectedStores,
  navigationStoreIds,
  routeCoordinates,
  currentLocation,
  geolocationStatus,
  geolocationError,
  followMode,
  recenterToken,
  gpsMode,
  onCycleGpsMode,
  onStopTracking,
  onPauseFollow,
  onNorthUp,
  headingUp,
  navigationMode = false,
  onSelect,
}: PopupStoreMapProps) {
  const targetRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const vectorSourceRef = useRef<VectorSource | null>(null)
  const vectorLayerRef = useRef<VectorLayer | null>(null)
  const routeSourceRef = useRef<VectorSource | null>(null)
  const currentLocationSourceRef = useRef<VectorSource | null>(null)
  const previousLocationRef = useRef<CurrentLocation | null>(null)
  const locationAnimationRef = useRef<number | null>(null)
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
    const currentLocationSource = new VectorSource()
    const routeLayer = new VectorLayer({ source: routeSource, style: routeStyles, zIndex: 10 })
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: markerStyleFor(null),
      zIndex: 20,
    })
    const currentLocationLayer = new VectorLayer({
      source: currentLocationSource,
      style: currentLocationStyle,
      zIndex: 30,
    })
    const map = new Map({
      target: targetRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        routeLayer,
        vectorLayer,
        currentLocationLayer,
      ],
      controls: defaultControls({ zoom: false, rotate: false }),
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
    currentLocationSourceRef.current = currentLocationSource
    mapRef.current = map
    return () => {
      unByKey(clickKey)
      interactionKeys.forEach(unByKey)
      vectorSource.clear()
      routeSource.clear()
      currentLocationSource.clear()
      if (locationAnimationRef.current !== null) cancelAnimationFrame(locationAnimationRef.current)
      map.setTarget(undefined)
      map.dispose()
      vectorSourceRef.current = null
      vectorLayerRef.current = null
      routeSourceRef.current = null
      currentLocationSourceRef.current = null
      previousLocationRef.current = null
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
      markerStyleFor(activeStoreId, selectedStores.map((popupStore) => popupStore.id), navigationStoreIds),
    )
    vectorSourceRef.current?.changed()
  }, [activeStoreId, navigationStoreIds, selectedStores])

  useEffect(() => {
    if (focusStoreId == null) return
    const map = mapRef.current
    const feature = vectorSourceRef.current?.getFeatures()
      .find((candidate) => (candidate.get('popupStore') as PopupStore | undefined)?.id === focusStoreId)
    const coordinate = feature?.getGeometry()?.getExtent()
    if (!map || !coordinate) return
    map.getView().animate({ center: [(coordinate[0] + coordinate[2]) / 2, (coordinate[1] + coordinate[3]) / 2],
      zoom: Math.max(map.getView().getZoom() ?? 0, 15.5), duration: 350 })
  }, [focusStoreId])

  useEffect(() => {
    if (navigationStoreIds.current == null) return
    const timer = window.setInterval(() => vectorSourceRef.current?.changed(), 120)
    return () => window.clearInterval(timer)
  }, [navigationStoreIds])

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
    const source = currentLocationSourceRef.current
    const map = mapRef.current
    if (!source || !map) return
    if (locationAnimationRef.current !== null) cancelAnimationFrame(locationAnimationRef.current)
    if (!currentLocation) {
      source.clear()
      previousLocationRef.current = null
      return
    }

    const previous = previousLocationRef.current ?? currentLocation
    const startedAt = performance.now()
    const duration = 360
    const renderFrame = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - (1 - progress) ** 3
      const interpolated: CurrentLocation = {
        ...currentLocation,
        coordinate: [
          previous.coordinate[0] + (currentLocation.coordinate[0] - previous.coordinate[0]) * eased,
          previous.coordinate[1] + (currentLocation.coordinate[1] - previous.coordinate[1]) * eased,
        ],
      }
      const rendered = createCurrentLocationFeatures(interpolated)
      source.clear()
      source.addFeatures(rendered.features)
      if (progress < 1) locationAnimationRef.current = requestAnimationFrame(renderFrame)
      else locationAnimationRef.current = null
    }
    locationAnimationRef.current = requestAnimationFrame(renderFrame)
    previousLocationRef.current = currentLocation
    const { center } = createCurrentLocationFeatures(currentLocation)
    if (followMode) {
      const rotation = headingUp && currentLocation.headingDegrees != null &&
        (currentLocation.speedMetersPerSecond ?? 0) > 0.5
        ? -currentLocation.headingDegrees * Math.PI / 180 : 0
      map.getView().animate({ center, rotation, zoom: Math.max(map.getView().getZoom() ?? 0, 16), duration: 400 })
    }
  }, [currentLocation, followMode, headingUp, recenterToken])

  return (
    <div className="map-container" data-route-coordinate-count={routeCoordinates?.length ?? 0}
      data-route-visible={Boolean(routeCoordinates && routeCoordinates.length >= 2)}>
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
      <div className={`map-fab-stack${navigationMode ? ' navigation-controls' : ''}`} aria-label="지도 컨트롤">
        <button
          type="button"
          className={`map-fab gps-fab ${gpsMode !== 'idle' ? 'active' : ''}`}
          disabled={geolocationStatus === 'locating'}
          onClick={onCycleGpsMode}
          aria-label={gpsModeLabel(gpsMode)}
          title={gpsModeLabel(gpsMode)}
        >
          <span aria-hidden="true">{gpsMode === 'heading' ? '➤' : gpsMode === 'follow' ? '◎' : '⌖'}</span>
        </button>
        <button type="button" className="map-fab desktop-map-control" aria-label="지도 확대" title="지도 확대"
          onClick={() => { const view = mapRef.current?.getView(); if (view) view.animate({ zoom: (view.getZoom() ?? 14) + 1, duration: 180 }) }}>+</button>
        <button type="button" className="map-fab desktop-map-control" aria-label="지도 축소" title="지도 축소"
          onClick={() => { const view = mapRef.current?.getView(); if (view) view.animate({ zoom: (view.getZoom() ?? 14) - 1, duration: 180 }) }}>−</button>
        <button type="button" className="map-fab" aria-label="북쪽 고정" title="북쪽 고정"
          onClick={() => { mapRef.current?.getView().animate({ rotation: 0, duration: 220 }); onNorthUp() }}>N</button>
        <button type="button" className="map-fab" aria-label="지도 회전 초기화" title="지도 회전 초기화"
          onClick={() => mapRef.current?.getView().animate({ rotation: 0, duration: 220 })}>↻</button>
        {geolocationStatus === 'tracking' && <button type="button" className="map-fab stop-gps" onClick={onStopTracking} aria-label="GPS 추적 종료" title="GPS 추적 종료">■</button>}
      </div>
      {geolocationError && <p className="geolocation-error" role="alert">{geolocationError}</p>}
    </div>
  )
}

function gpsModeLabel(mode: GpsDisplayMode) {
  if (mode === 'heading') return '진행 방향 따라가기 활성화'
  if (mode === 'follow') return '현재 위치 따라가기 활성화, 다시 누르면 진행 방향 모드'
  if (mode === 'located') return '현재 위치 표시, 다시 누르면 따라가기'
  return '현재 위치로 이동'
}
