import { httpClient } from './httpClient'
import type { PageResponse, PopupStore } from '../types/popupStore'
import { getEngagementIdentity } from '../features/engagement/visitorIdentity'

export async function fetchPopupStores(signal: AbortSignal): Promise<PopupStore[]> {
  const response = await httpClient.get<PageResponse<PopupStore>>(
    '/api/popup-stores/search',
    {
      signal,
      headers: { 'X-Anonymous-Visitor-Id': getEngagementIdentity().anonymousVisitorId },
      params: { page: 0, size: 100, sort: 'createdAt,desc' },
    },
  )

  return normalizePopupStores(response.data.content)
}

export async function fetchFeaturedPopupStores(signal: AbortSignal, limit = 4): Promise<PopupStore[]> {
  const response = await httpClient.get<PopupStore[]>('/api/popup-stores/featured', {
    signal,
    headers: { 'X-Anonymous-Visitor-Id': getEngagementIdentity().anonymousVisitorId },
    params: { limit },
  })
  return normalizePopupStores(response.data)
}

export function normalizePopupStores(stores: PopupStore[]) {
  return stores.map((store) => ({
    ...store,
    engagement: store.engagement ?? {
      viewCount: 0,
      likeCount: 0,
      planAddCount: 0,
      likedByCurrentVisitor: false,
    },
  }))
}
