import { httpClient } from './httpClient'
import type { PageResponse, PopupStore } from '../types/popupStore'

export async function fetchPopupStores(signal: AbortSignal): Promise<PopupStore[]> {
  const response = await httpClient.get<PageResponse<PopupStore>>(
    '/api/popup-stores/search',
    {
      signal,
      params: { page: 0, size: 100, sort: 'createdAt,desc' },
    },
  )

  return response.data.content
}
