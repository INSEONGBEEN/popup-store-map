import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { recordPlanAdd, setPopupLike } from './api/popupEngagement'
import { IntegratedHeader } from './components/IntegratedHeader'
import { AuthModal } from './components/AuthModal'
import { MyPageDrawer } from './components/MyPageDrawer'
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
import { useFavorites } from './features/favorites/useFavorites'
import { useVisits } from './features/visits/useVisits'
import { useMyReviews } from './features/reviews/useMyReviews'
import { useThemePreference } from './features/app/useThemePreference'
import { useTransientToast } from './features/app/useTransientToast'
import { usePopupStoreDetails } from './features/popupstore/usePopupStoreDetails'
import { deleteReview, type MyReview } from './api/reviews'
import './App.css'

function App() {
  const auth = useAuth()
  const { popupStores, featuredStores, isLoading, errorMessage, updateEngagement, updateReviewSummary } = usePopupStores(
    auth.user ? `user:${auth.user.id}` : auth.authStatus,
  )
  const [draftQuery, setDraftQuery] = useState('')
  const [appliedQuery, setAppliedQuery] = useState('')
  const [category, setCategory] = useState('ALL')
  const [scheduleExpanded, setScheduleExpanded] = useState(false)
  const [gpsMode, setGpsMode] = useState<GpsDisplayMode>('idle')
  const [guidanceRequested, setGuidanceRequested] = useState(false)
  const [guidanceStageText, setGuidanceStageText] = useState<string | null>(null)
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'signup' }>({ open: false, mode: 'login' })
  const [myPageOpen, setMyPageOpen] = useState(false)
  const preparingRef = useRef(false)
  const guidancePreparationStartedRef = useRef(false)
  const planAddRecordedRef = useRef(new Set<number>())
  const pendingFavoriteRef = useRef<number | null>(null)
  const pendingVisitRef = useRef<number | null>(null)
  const handledArrivalSequenceRef = useRef(0)
  const initialLocateCenteredRef = useRef(false)
  const locatePauseTimerRef = useRef<number | null>(null)
  const geolocation = useCurrentLocation()
  const { theme, toggleTheme } = useThemePreference()
  const { message: toastMessage, show: showToast } = useTransientToast()
  const popupDetails = usePopupStoreDetails(popupStores, updateEngagement)
  const {
    activeStore, homeDetailStore, highlightedStore,
    setActiveStore, setHomeDetailStore, setHighlightedStore,
    openMapDetails: selectMapDetails,
    openHomeDetails: selectHomeDetails,
  } = popupDetails
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

  const filteredStores = useMemo(() => filterPopupStores(popupStores, category, appliedQuery),
    [appliedQuery, category, popupStores])
  const activeStoreIsSelected = activeStore
    ? routePlanner.selectedStores.some(({ id }) => id === activeStore.id) : false
  const navigationActive = navigation.status !== 'inactive'
  const completedStops = navigation.status === 'completed'
    ? routePlanner.selectedStores.length : navigation.activeWaypointIndex
  const currentStopName = navigation.activeWaypointIndex > 0
    ? routePlanner.selectedStores[navigation.activeWaypointIndex - 1]?.name ?? null : '출발지'

  const favorites = useFavorites(showToast)
  const visits = useVisits(showToast)
  const myReviews = useMyReviews()

  const reviewsChanged = useCallback((popupStoreId: number, summary: PopupStore['reviewSummary']) => {
    updateReviewSummary(popupStoreId, summary)
    myReviews.reload()
  }, [myReviews, updateReviewSummary])

  const removeMyReview = useCallback((item: MyReview) => {
    if (!window.confirm(`${item.popupStore.name} 리뷰를 삭제할까요?`)) return
    void deleteReview(item.popupStore.id, item.review.reviewId).then(() => {
      const summary = item.popupStore.reviewSummary
      const nextCount = Math.max(0, summary.reviewCount - 1)
      const nextAverage = nextCount === 0 ? 0 : (summary.averageRating * summary.reviewCount - item.review.rating) / nextCount
      reviewsChanged(item.popupStore.id, { averageRating: nextAverage, reviewCount: nextCount })
      showToast('리뷰를 삭제했습니다.')
    }).catch(() => showToast('리뷰를 삭제하지 못했습니다.'))
  }, [reviewsChanged, showToast])

  const toggleFavorite = useCallback((store: PopupStore) => {
    if (!auth.isAuthenticated) {
      pendingFavoriteRef.current = store.id
      setAuthModal({ open: true, mode: 'login' })
      return
    }
    void favorites.toggle(store).then((favorited) =>
      showToast(favorited ? '즐겨찾기에 저장했습니다.' : '즐겨찾기에서 해제했습니다.')).catch(() => undefined)
  }, [auth.isAuthenticated, favorites, showToast])

  useEffect(() => {
    if (!auth.isAuthenticated || pendingFavoriteRef.current == null) return
    const popupStoreId = pendingFavoriteRef.current
    pendingFavoriteRef.current = null
    const store = popupStores.find(({ id }) => id === popupStoreId)
    if (store) void favorites.toggle(store).then(() => showToast('로그인 후 즐겨찾기에 저장했습니다.')).catch(() => undefined)
  }, [auth.isAuthenticated, favorites, popupStores, showToast])

  const confirmVisit = useCallback((store: PopupStore) => {
    if (!window.confirm(`${store.name} 방문을 완료했나요? 방문 날짜만 저장되며 위치 정보는 저장하지 않습니다.`)) return
    if (!auth.isAuthenticated) {
      pendingVisitRef.current = store.id
      setAuthModal({ open: true, mode: 'login' })
      return
    }
    void visits.record(store.id, 'MANUAL_CONFIRMATION')
      .then(() => showToast('방문 완료를 기록했습니다.')).catch(() => showToast('방문 기록을 저장하지 못했습니다.'))
  }, [auth.isAuthenticated, showToast, visits])

  useEffect(() => {
    if (!auth.isAuthenticated || pendingVisitRef.current == null) return
    const popupStoreId = pendingVisitRef.current
    pendingVisitRef.current = null
    void visits.record(popupStoreId, 'MANUAL_CONFIRMATION')
      .then(() => showToast('로그인 후 방문 완료를 기록했습니다.')).catch(() => showToast('방문 기록을 저장하지 못했습니다.'))
  }, [auth.isAuthenticated, showToast, visits])

  useEffect(() => {
    const arrival = navigation.arrivalEvent
    if (!arrival || arrival.sequence <= handledArrivalSequenceRef.current) return
    handledArrivalSequenceRef.current = arrival.sequence
    if (!auth.isAuthenticated) {
      showToast('도착했습니다. 로그인하면 방문 기록을 저장할 수 있어요.')
      return
    }
    void visits.record(arrival.storeId, 'NAVIGATION_ARRIVAL')
      .then(() => showToast('도착 방문 기록을 저장했습니다.'))
      .catch(() => showToast('방문 기록 저장에 실패했지만 길안내는 계속됩니다.'))
  }, [auth.isAuthenticated, navigation.arrivalEvent, showToast, visits])

  const openMapDetails = useCallback((store: PopupStore) => {
    selectMapDetails(store)
    setScheduleExpanded(false)
  }, [selectMapDetails])

  const openHomeDetails = useCallback((store: PopupStore) => {
    selectHomeDetails(store)
    setScheduleExpanded(false)
  }, [selectHomeDetails])

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
    routePlanner.originType, routePlanner.selectedStores.length, setActiveStore, showToast])

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
      onToggleLike={toggleLike} isFavorited={favorites.favoriteIds.has(activeStore.id)} onToggleFavorite={toggleFavorite}
      visited={visits.visitedStoreIds.has(activeStore.id)} onConfirmVisit={confirmVisit}
      onRequireLogin={() => setAuthModal({ open: true, mode: 'login' })} onReviewsChanged={reviewsChanged}
      myReview={myReviews.items.find((item) => item.popupStore.id === activeStore.id)?.review}
      onViewOnMap={() => document.getElementById('explore-map')?.scrollIntoView({ behavior: 'smooth' })}
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
      onOpenMyPage={() => setMyPageOpen(true)}
      onLogout={() => void auth.logout().then(() => showToast('로그아웃했습니다.'))}
      onToggleTheme={toggleTheme} />}

    {navigationActive ? <div className="navigation-map-stage">{map}{routePlannerPanel}</div> : <>
      {isLoading ? <div className="home-loading">성수의 팝업을 모으고 있어요…</div> : errorMessage ? <div className="home-loading error">{errorMessage}</div> :
        <PopupDiscovery popupStores={popupStores} featuredStores={featuredStores} selectedStores={routePlanner.selectedStores}
          activeStoreId={highlightedStore?.id ?? activeStore?.id ?? null} category={category} query={appliedQuery} mapContent={map}
          onCategoryChange={(value) => { setCategory(value); setDraftQuery(''); setAppliedQuery('') }} onOpenDetails={openHomeDetails}
          onOpenMapDetails={openMapDetails}
          onAddToSchedule={toggleSchedule} onToggleLike={toggleLike} favoriteIds={favorites.favoriteIds}
          onToggleFavorite={toggleFavorite} onHighlight={setHighlightedStore} />}
      {routePlanner.selectedStores.length > 0 && !scheduleExpanded && <button type="button" className="schedule-dock"
        onClick={() => setScheduleExpanded(true)} aria-label={`오늘 일정 ${routePlanner.selectedStores.length}곳 펼치기`}>
        <span><strong>오늘 일정 {routePlanner.selectedStores.length}곳</strong>
          {routePlanner.optimizationState.result && <small>{Math.round(routePlanner.optimizationState.result.optimized.durationSeconds / 60)}분 · {(routePlanner.optimizationState.result.optimized.distanceMeters / 1000).toFixed(1)}km</small>}</span><b>펼치기 ↑</b>
      </button>}
      {scheduleExpanded && routePlannerPanel}
    </>}
    {toastMessage && <div className="app-toast" role="status">{toastMessage}</div>}
    <AuthModal open={authModal.open} initialMode={authModal.mode} onClose={() => setAuthModal((current) => ({ ...current, open: false }))} />
    <MyPageDrawer open={myPageOpen} user={auth.user} favorites={favorites.items} isLoading={favorites.isLoading}
      visits={visits.items} visitsLoading={visits.isLoading}
      reviews={myReviews.items} onDeleteReview={removeMyReview}
      onClose={() => setMyPageOpen(false)} onOpenDetails={(store) => { setMyPageOpen(false); openHomeDetails(store) }}
      onRemoveFavorite={toggleFavorite} onAddToSchedule={toggleSchedule}
      onLogout={() => void auth.logout().then(() => { setMyPageOpen(false); showToast('로그아웃했습니다.') })} />
    {homeDetailStore && !navigationActive && <HomepagePopupDetailsModal popupStore={homeDetailStore}
      isRouteSelected={routePlanner.selectedStores.some(({ id }) => id === homeDetailStore.id)}
      routeSelectionFull={routePlanner.selectedStores.length >= 8} onToggleRoute={toggleSchedule}
      onToggleLike={toggleLike} isFavorited={favorites.favoriteIds.has(homeDetailStore.id)} onToggleFavorite={toggleFavorite}
      visited={visits.visitedStoreIds.has(homeDetailStore.id)} onConfirmVisit={confirmVisit}
      onRequireLogin={() => setAuthModal({ open: true, mode: 'login' })} onReviewsChanged={reviewsChanged}
      myReview={myReviews.items.find((item) => item.popupStore.id === homeDetailStore.id)?.review}
      onClose={() => setHomeDetailStore(null)} onViewOnMap={() => {
        const store = homeDetailStore
        setHomeDetailStore(null)
        setActiveStore(store)
        window.requestAnimationFrame(() => document.getElementById('explore-map')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      }} />}
    {!navigationActive && <footer>지도 데이터 © OpenStreetMap contributors · 개발용 샘플 데이터</footer>}
  </main>
}

export default App
