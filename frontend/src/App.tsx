import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { recordPlanAdd, recordPopupView, setPopupLike } from './api/popupEngagement'
import { IntegratedHeader } from './components/IntegratedHeader'
import { AuthModal } from './components/AuthModal'
import { PopupDiscovery } from './components/PopupDiscovery'
import { HomepagePopupDetailsModal, MapPopupDetailsDrawer } from './components/PopupStoreDetails'
import { RoutePlanner } from './components/RoutePlanner'
import { useCurrentLocation } from './features/geolocation/useCurrentLocation'
import { usePedestrianNavigation } from './features/navigation/usePedestrianNavigation'
import { usePopupStores } from './features/popupstore/usePopupStores'
import { filterPopupStores } from './features/popupstore/popupDiscoveryUtils'
import { useRoutePlanner } from './features/route/useRoutePlanner'
import { PopupStoreMap, type GpsDisplayMode } from './map/PopupStoreMap'
import type { PopupStore } from './types/popupStore'
import { useAuth } from './features/auth/authContext'
import './App.css'

function App() {
  const auth = useAuth()
  const { popupStores, featuredStores, isLoading, errorMessage, updateEngagement } = usePopupStores()
  const [activeStore, setActiveStore] = useState<PopupStore | null>(null)
  const [homeDetailStore, setHomeDetailStore] = useState<PopupStore | null>(null)
  const [highlightedStore, setHighlightedStore] = useState<PopupStore | null>(null)
  const [draftQuery, setDraftQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [category, setCategory] = useState('ALL')
  const [scheduleExpanded, setScheduleExpanded] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    window.localStorage.getItem('popup-store-map.theme') === 'dark' ? 'dark' : 'light')
  const [gpsMode, setGpsMode] = useState<GpsDisplayMode>('idle')
  const [guidanceRequested, setGuidanceRequested] = useState(false)
  const [guidanceStageText, setGuidanceStageText] = useState<string | null>(null)
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'signup' }>({ open: false, mode: 'login' })
  const preparingRef = useRef(false)
  const guidancePreparationStartedRef = useRef(false)
  const planAddRecordedRef = useRef(new Set<number>())
  const initialLocateCenteredRef = useRef(false)
  const locatePauseTimerRef = useRef<number | null>(null)
  const geolocation = useCurrentLocation()
  const routePlanner = useRoutePlanner(geolocation.location)
  const navigation = usePedestrianNavigation(routePlanner.routeState.result, routePlanner.selectedStores, geolocation.location)
  const { clearStores, prepareNavigationRoute } = routePlanner
  const { location, status: geolocationStatus, requestLocation, ensureCurrentPosition, resumeFollow, pauseFollow } = geolocation
  const { start: startNavigation, stop: stopNavigation } = navigation

  useEffect(() => {
    if (import.meta.env?.DEV) {
      console.debug('[runtime-env]', JSON.stringify({
        origin: window.location.origin,
        secureContext: window.isSecureContext,
        geolocationSupported: Boolean(navigator.geolocation),
      }))
    }
  }, [])

  useEffect(() => {
    setActiveStore((current) => current
      ? popupStores.find(({ id }) => id === current.id) ?? current
      : null)
    setHomeDetailStore((current) => current
      ? popupStores.find(({ id }) => id === current.id) ?? current
      : null)
  }, [popupStores])

  const filteredStores = useMemo(() => filterPopupStores(popupStores, category, appliedQuery),
    [appliedQuery, category, popupStores])
  const activeStoreIsSelected = activeStore
    ? routePlanner.selectedStores.some(({ id }) => id === activeStore.id) : false
  const navigationActive = navigation.status !== 'inactive'
  const completedStops = navigation.status === 'completed'
    ? routePlanner.selectedStores.length : navigation.activeWaypointIndex
  const currentStopName = navigation.activeWaypointIndex > 0
    ? routePlanner.selectedStores[navigation.activeWaypointIndex - 1]?.name ?? null : '출발지'

  const showToast = useCallback((message: string) => {
    setToastMessage(message)
    window.setTimeout(() => setToastMessage((current) => current === message ? null : current), 2200)
  }, [])

  const recordDetailsView = useCallback((store: PopupStore) => {
    void recordPopupView(store.id).then((engagement) => updateEngagement(store.id, engagement)).catch(() => undefined)
  }, [updateEngagement])

  const openMapDetails = useCallback((store: PopupStore) => {
    setActiveStore(store)
    setHomeDetailStore(null)
    setScheduleExpanded(false)
    recordDetailsView(store)
  }, [recordDetailsView])

  const openHomeDetails = useCallback((store: PopupStore) => {
    setHomeDetailStore(store)
    setActiveStore(null)
    setScheduleExpanded(false)
    recordDetailsView(store)
  }, [recordDetailsView])

  const toggleSchedule = useCallback((store: PopupStore) => {
    const selected = routePlanner.selectedStores.some(({ id }) => id === store.id)
    if (selected) {
      routePlanner.removeStore(store.id)
      showToast(`${store.name}을 오늘 일정에서 제외했습니다.`)
      return 'removed' as const
    }
    const result = routePlanner.addStore(store)
    if (result === 'added') {
      showToast(`${store.name}을 오늘 일정에 추가했습니다.`)
      if (!planAddRecordedRef.current.has(store.id)) {
        planAddRecordedRef.current.add(store.id)
        void recordPlanAdd(store.id).then((engagement) => updateEngagement(store.id, engagement)).catch(() => undefined)
      }
    } else if (result === 'duplicate') showToast('이미 오늘 일정에 담긴 팝업입니다.')
    else showToast('오늘 일정은 최대 8곳까지 담을 수 있습니다.')
    return result
  }, [routePlanner, showToast, updateEngagement])

  const toggleLike = useCallback((store: PopupStore) => {
    const liked = !store.engagement.likedByCurrentVisitor
    void setPopupLike(store.id, liked)
      .then((engagement) => updateEngagement(store.id, engagement))
      .catch(() => showToast('좋아요를 반영하지 못했습니다. 다시 시도해 주세요.'))
  }, [showToast, updateEngagement])

  const selectFromSearch = useCallback((store: PopupStore) => {
    openMapDetails(store)
    document.getElementById('explore-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [openMapDetails])

  const cycleGpsMode = useCallback(() => {
    if (!location || geolocationStatus !== 'tracking') {
      requestLocation()
      setGpsMode('located')
      return
    }
    if (gpsMode === 'idle' || gpsMode === 'located') {
      resumeFollow(); setGpsMode('follow'); return
    }
    if (gpsMode === 'follow') {
      resumeFollow(); setGpsMode('heading'); return
    }
    resumeFollow(); setGpsMode('follow')
  }, [geolocationStatus, gpsMode, location, requestLocation, resumeFollow])

  const pauseMapFollow = useCallback(() => {
    pauseFollow()
    setGpsMode('located')
  }, [pauseFollow])

  const startGuidance = useCallback(async () => {
    if (guidanceRequested || routePlanner.selectedStores.length < 2) return
    setGuidanceRequested(true)
    guidancePreparationStartedRef.current = true
    preparingRef.current = true
    setActiveStore(null)
    setScheduleExpanded(false)
    setGuidanceStageText('출발지 확인 중')
    try {
      let routeLocation = location
      if (routePlanner.originType === 'CURRENT_LOCATION') {
        setGuidanceStageText('현재 위치 확인 중')
        routeLocation = await ensureCurrentPosition()
      }
      setGuidanceStageText('최적 방문 순서 계산 중')
      await prepareNavigationRoute(routeLocation, (stage) => {
        setGuidanceStageText(stage === 'optimizing' ? '최적 방문 순서 계산 중' : '도보 경로 생성 중')
      })
    } catch (error) {
      setGuidanceRequested(false)
      guidancePreparationStartedRef.current = false
      setGuidanceStageText(null)
      showToast(error instanceof Error ? error.message : '현재 위치를 확인하지 못했습니다.')
    } finally {
      preparingRef.current = false
    }
  }, [ensureCurrentPosition, guidanceRequested, location, prepareNavigationRoute,
    routePlanner.originType, routePlanner.selectedStores.length, showToast])

  useEffect(() => {
    if (gpsMode === 'idle') initialLocateCenteredRef.current = false
    if (gpsMode !== 'located' || !location || initialLocateCenteredRef.current) return
    initialLocateCenteredRef.current = true
    locatePauseTimerRef.current = window.setTimeout(pauseFollow, 450)
  }, [gpsMode, location, pauseFollow])

  useEffect(() => {
    if (!location && ['permission-denied', 'unavailable', 'timeout', 'unsupported', 'insecure'].includes(geolocationStatus)) {
      setGpsMode('idle')
    }
  }, [geolocationStatus, location])

  useEffect(() => () => {
    if (locatePauseTimerRef.current !== null) window.clearTimeout(locatePauseTimerRef.current)
  }, [])

  useEffect(() => {
    if (!guidanceRequested) return
    if (guidancePreparationStartedRef.current && routePlanner.routeState.status === 'error') {
      setGuidanceRequested(false)
      preparingRef.current = false
      guidancePreparationStartedRef.current = false
      setGuidanceStageText(null)
      return
    }
    if (guidancePreparationStartedRef.current && !preparingRef.current &&
      routePlanner.routeState.status === 'success' && routePlanner.routeState.result) {
      if (location) {
        startNavigation()
        resumeFollow()
        setGpsMode('follow')
      } else {
        showToast('실시간 위치 없이 도보 경로를 표시합니다. GPS 버튼으로 위치 추적을 시작할 수 있어요.')
        setScheduleExpanded(true)
      }
      setGuidanceRequested(false)
      preparingRef.current = false
      guidancePreparationStartedRef.current = false
      setGuidanceStageText(null)
    }
  }, [guidanceRequested, location, resumeFollow, routePlanner.routeState.result,
    routePlanner.routeState.status, showToast, startNavigation])

  const clearRoute = useCallback(() => {
    stopNavigation()
    setGuidanceRequested(false)
    setGuidanceStageText(null)
    guidancePreparationStartedRef.current = false
    clearStores()
    setScheduleExpanded(false)
  }, [clearStores, stopNavigation])

  const navigationStoreIds = useMemo(() => ({
    current: navigation.status === 'inactive' ? null : routePlanner.selectedStores[navigation.activeWaypointIndex]?.id ?? null,
    next: navigation.status === 'inactive' ? null : routePlanner.selectedStores[navigation.activeWaypointIndex + 1]?.id ?? null,
  }), [navigation.activeWaypointIndex, navigation.status, routePlanner.selectedStores])

  const map = <section className="map-card">
    <PopupStoreMap popupStores={filteredStores} activeStoreId={highlightedStore?.id ?? activeStore?.id ?? null}
      selectedStores={routePlanner.selectedStores} navigationStoreIds={navigationStoreIds}
      routeCoordinates={navigation.activeRoute?.coordinates ?? routePlanner.routeState.result?.coordinates
        ?? routePlanner.optimizationState.result?.route.coordinates ?? null}
      currentLocation={geolocation.location} geolocationStatus={geolocation.status}
      geolocationError={geolocation.errorMessage} followMode={geolocation.followMode}
      recenterToken={geolocation.recenterToken} gpsMode={gpsMode}
      onCycleGpsMode={cycleGpsMode} onStopTracking={() => { geolocation.stopTracking(); setGpsMode('idle') }}
      onPauseFollow={pauseMapFollow} onNorthUp={() => setGpsMode('follow')}
      headingUp={gpsMode === 'heading'} onSelect={openMapDetails} navigationMode={navigationActive}
      focusStoreId={activeStore?.id ?? null} />
    {isLoading && <div className="state-card">팝업스토어를 불러오는 중입니다…</div>}
    {errorMessage && <div className="state-card error">{errorMessage}</div>}
    {activeStore && !navigationActive && <MapPopupDetailsDrawer popupStore={activeStore} isRouteSelected={activeStoreIsSelected}
      routeSelectionFull={routePlanner.selectedStores.length >= 8} onToggleRoute={toggleSchedule}
      onToggleLike={toggleLike} onViewOnMap={() => document.getElementById('explore-map')?.scrollIntoView({ behavior: 'smooth' })}
      onClose={() => setActiveStore(null)} />}
  </section>

  const routePlannerPanel = <RoutePlanner popupStores={popupStores} selectedStores={routePlanner.selectedStores}
    routeState={routePlanner.routeState} selectionMessage={routePlanner.selectionMessage}
    originType={routePlanner.originType} onAdd={toggleSchedule} onRemove={routePlanner.removeStore}
    onMove={routePlanner.moveStore} onReorder={routePlanner.reorderStores} onClear={clearRoute}
    onOriginTypeChange={routePlanner.setOriginType} optimizationState={routePlanner.optimizationState}
    onRestoreOrder={routePlanner.restoreOriginalOrder} onCollapse={() => setScheduleExpanded(false)}
    guidanceBusy={guidanceRequested || routePlanner.routeState.status === 'loading' || routePlanner.optimizationState.status === 'loading'}
    guidanceStage={guidanceStageText} onStartGuidance={() => void startGuidance()}
    navigation={{ status: navigation.status, nextInstruction: navigation.nextInstruction,
      remainingDistanceMeters: navigation.remainingDistanceMeters,
      remainingDurationSeconds: navigation.remainingDurationSeconds,
      distanceToRouteMeters: navigation.distanceToRouteMeters, currentStopName,
      nextStopName: routePlanner.selectedStores[navigation.activeWaypointIndex]?.name ?? null,
      completedStops, totalStops: routePlanner.selectedStores.length, rerouteCount: navigation.rerouteCount,
      errorMessage: navigation.errorMessage, onPause: navigation.pause, onResume: navigation.resume,
      onStop: navigation.stop, onRetry: navigation.reroute }} />

  const shellClasses = [
    'app-shell',
    navigationActive ? 'navigation-mode' : '',
    routePlanner.selectedStores.length > 0 && !scheduleExpanded ? 'has-schedule-dock' : '',
    scheduleExpanded ? 'has-schedule-sheet' : '',
    activeStore ? 'has-map-details' : '',
  ].filter(Boolean).join(' ')

  return <main className={shellClasses} data-theme={theme}>
    {!navigationActive && <IntegratedHeader popupStores={popupStores} draftQuery={draftQuery} scheduleCount={routePlanner.selectedStores.length} theme={theme}
      onDraftQueryChange={setDraftQuery} onSearch={setAppliedQuery} onSelect={selectFromSearch}
      onCategory={(value) => { setCategory(value); setDraftQuery(''); setAppliedQuery('') }}
      onHome={() => { setDraftQuery(''); setAppliedQuery(''); setActiveStore(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
      onOpenSchedule={() => setScheduleExpanded(true)} onOptimize={() => setScheduleExpanded(true)}
      authStatus={auth.authStatus} user={auth.user}
      onOpenAuth={(mode) => setAuthModal({ open: true, mode })}
      onLogout={() => void auth.logout().then(() => showToast('로그아웃했습니다.'))}
      onToggleTheme={() => setTheme((current) => { const next = current === 'light' ? 'dark' : 'light'; window.localStorage.setItem('popup-store-map.theme', next); return next })} />}

    {navigationActive ? <div className="navigation-map-stage">{map}{routePlannerPanel}</div> : <>
      {isLoading ? <div className="home-loading">성수의 팝업을 모으고 있어요…</div> : errorMessage ? <div className="home-loading error">{errorMessage}</div> :
        <PopupDiscovery popupStores={popupStores} featuredStores={featuredStores} selectedStores={routePlanner.selectedStores}
          activeStoreId={highlightedStore?.id ?? activeStore?.id ?? null} category={category} query={appliedQuery} mapContent={map}
          onCategoryChange={(value) => { setCategory(value); setDraftQuery(''); setAppliedQuery('') }} onOpenDetails={openHomeDetails}
          onOpenMapDetails={openMapDetails}
          onAddToSchedule={toggleSchedule} onToggleLike={toggleLike} onHighlight={setHighlightedStore} />}
      {routePlanner.selectedStores.length > 0 && !scheduleExpanded && <button type="button" className="schedule-dock"
        onClick={() => setScheduleExpanded(true)} aria-label={`오늘 일정 ${routePlanner.selectedStores.length}곳 펼치기`}>
        <span><strong>오늘 일정 {routePlanner.selectedStores.length}곳</strong>
          {routePlanner.optimizationState.result && <small>{Math.round(routePlanner.optimizationState.result.optimized.durationSeconds / 60)}분 · {(routePlanner.optimizationState.result.optimized.distanceMeters / 1000).toFixed(1)}km</small>}</span><b>펼치기 ↑</b>
      </button>}
      {scheduleExpanded && routePlannerPanel}
    </>}
    {toastMessage && <div className="app-toast" role="status">{toastMessage}</div>}
    <AuthModal open={authModal.open} initialMode={authModal.mode} onClose={() => setAuthModal((current) => ({ ...current, open: false }))} />
    {homeDetailStore && !navigationActive && <HomepagePopupDetailsModal popupStore={homeDetailStore}
      isRouteSelected={routePlanner.selectedStores.some(({ id }) => id === homeDetailStore.id)}
      routeSelectionFull={routePlanner.selectedStores.length >= 8} onToggleRoute={toggleSchedule}
      onToggleLike={toggleLike} onClose={() => setHomeDetailStore(null)} onViewOnMap={() => {
        const store = homeDetailStore
        setHomeDetailStore(null)
        setActiveStore(store)
        window.requestAnimationFrame(() => document.getElementById('explore-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      }} />}
    {!navigationActive && <footer>지도 데이터 © OpenStreetMap contributors · 개발용 샘플 데이터</footer>}
  </main>
}

export default App
