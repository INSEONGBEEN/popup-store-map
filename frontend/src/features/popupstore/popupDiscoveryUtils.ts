import type { PopupStore } from '../../types/popupStore'

export const categoryLabel = {
  FASHION: '패션', BEAUTY: '뷰티', FOOD: '음식', CHARACTER: '캐릭터',
  LIFESTYLE: '라이프스타일', ETC: '기타',
} as const

export function formatMetricCount(value: number) {
  if (value >= 10_000) return `${(value / 10_000).toFixed(1).replace('.0', '')}만`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace('.0', '')}천`
  return String(value)
}

export function filterPopupStores(stores: PopupStore[], category: string, query: string) {
  const normalized = query.trim().toLocaleLowerCase()
  return stores.filter((store) => {
    const categoryMatches = category === 'ALL' || store.category === category
    const queryMatches = !normalized || `${store.name} ${store.address} ${store.category ?? ''}`.toLocaleLowerCase().includes(normalized)
    return categoryMatches && queryMatches
  })
}

export function shouldExecuteSearch(key: string, composing: boolean) {
  return key === 'Enter' && !composing
}
