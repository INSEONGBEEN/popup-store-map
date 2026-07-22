import { memo, useEffect, useMemo, useRef, useState } from 'react'
import type { PopupStore } from '../types/popupStore'
import { shouldExecuteSearch } from '../features/popupstore/popupDiscoveryUtils'

interface Props {
  popupStores: PopupStore[]
  draftQuery: string
  onDraftQueryChange: (query: string) => void
  onSearch: (query: string) => void
  onSelect: (store: PopupStore) => void
  onCategory: (category: string) => void
}

const suggestedQueries = ['성수 팝업', '이번 주 오픈', '캐릭터 팝업', '패션 팝업', '뷰티 팝업']
const popularAreas = ['성수', '서울숲', '뚝섬']
const categoryShortcuts = [['FASHION', '패션'], ['BEAUTY', '뷰티'], ['CHARACTER', '캐릭터'], ['FOOD', '음식']] as const
const RECENT_KEY = 'popup-store-map.recent-searches'

export const FloatingSearch = memo(function FloatingSearch({ popupStores, draftQuery, onDraftQueryChange, onSearch, onSelect, onCategory }: Props) {
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<string[]>(() => readRecentSearches())
  const rootRef = useRef<HTMLDivElement>(null)
  const composingRef = useRef(false)
  const normalized = draftQuery.trim().toLocaleLowerCase()
  const results = useMemo(() => normalized.length < 1 ? [] : popupStores
    .filter((store) => `${store.name} ${store.address} ${store.category ?? ''}`.toLocaleLowerCase().includes(normalized))
    .slice(0, 6), [normalized, popupStores])

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const search = (value: string) => {
    const trimmed = value.trim()
    onDraftQueryChange(value)
    onSearch(trimmed)
    if (trimmed) {
      const next = [trimmed, ...recent.filter((item) => item !== trimmed)].slice(0, 5)
      setRecent(next)
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
    }
    setOpen(false)
  }

  return <div className="unified-search" ref={rootRef}>
    <label htmlFor="unified-popup-search" className="sr-only">팝업스토어, 브랜드 또는 지역 검색</label>
    <input id="unified-popup-search" type="search" value={draftQuery}
      placeholder="팝업스토어, 브랜드 또는 지역을 검색하세요"
      onFocus={() => setOpen(true)} onChange={(event) => { onDraftQueryChange(event.target.value); setOpen(true) }}
      onCompositionStart={() => { composingRef.current = true }}
      onCompositionEnd={() => { composingRef.current = false }}
      onKeyDown={(event) => {
        if (!shouldExecuteSearch(event.key, composingRef.current || event.nativeEvent.isComposing)) return
        event.preventDefault()
        search(draftQuery)
      }}
      autoComplete="off" />
    {draftQuery && <button type="button" className="search-clear" onClick={() => { onDraftQueryChange(''); onSearch('') }} aria-label="검색어 지우기">×</button>}
    <button type="button" className="search-submit" onClick={() => search(draftQuery)} aria-label="검색">
      <span aria-hidden="true">⌕</span>
    </button>
    {open && <div className="unified-search-dropdown" role="dialog" aria-label="통합 검색">
      {normalized ? <section><h3>검색 결과 <small>{results.length}곳</small></h3>
        {results.length === 0 ? <p className="search-empty">일치하는 팝업이 없습니다.</p> : results.map((store) =>
          <button key={store.id} type="button" className="search-result" onClick={() => { search(store.name); onSelect(store) }}>
            <span>{store.status === 'OPEN' ? 'OPEN' : store.status === 'UPCOMING' ? 'SOON' : 'END'}</span>
            <div><strong>{store.name}</strong><small>{store.address}</small></div>
          </button>)}</section> : <>
        <SearchChips title="추천 검색어" values={suggestedQueries} onSelect={search} />
        <SearchChips title="인기 지역" values={popularAreas} onSelect={search} />
        {recent.length > 0 && <SearchChips title="최근 검색어" values={recent} onSelect={search} />}
        <section><h3>카테고리 바로가기</h3><div className="search-chips">
          {categoryShortcuts.map(([value, label]) => <button key={value} type="button" onClick={() => { onCategory(value); setOpen(false) }}>{label}</button>)}
        </div></section>
      </>}
    </div>}
  </div>
})

function SearchChips({ title, values, onSelect }: { title: string; values: string[]; onSelect: (value: string) => void }) {
  return <section><h3>{title}</h3><div className="search-chips">{values.map((value) =>
    <button type="button" key={value} onClick={() => onSelect(value)}>{value}</button>)}</div></section>
}

function readRecentSearches(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(RECENT_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 5) : []
  } catch {
    return []
  }
}
