import { httpClient } from './httpClient'
import type { PopupStore } from '../types/popupStore'

export type VisitSource = 'NAVIGATION_ARRIVAL' | 'MANUAL_CONFIRMATION'

export interface VisitItem {
  id: number
  popupStore: PopupStore
  visitedAt: string
  visitDate: string
  source: VisitSource
  createdAt: string
}

interface VisitPage { content: VisitItem[]; totalElements: number }

export async function getVisits() {
  return (await httpClient.get<VisitPage>('/api/users/me/visits?page=0&size=100&sort=visitedAt,desc')).data
}

export async function recordVisit(popupStoreId: number, source: VisitSource) {
  return (await httpClient.post<VisitItem>(`/api/users/me/visits/${popupStoreId}`, { source })).data
}
