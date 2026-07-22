import { httpClient } from './httpClient'
import { getEngagementIdentity } from '../features/engagement/visitorIdentity'
import type { PopupEngagement } from '../types/popupStore'

export async function recordPopupView(popupStoreId: number): Promise<PopupEngagement> {
  const response = await httpClient.post<PopupEngagement>(
    `/api/popup-stores/${popupStoreId}/engagement/view`,
    getEngagementIdentity(),
  )
  return response.data
}

export async function recordPlanAdd(popupStoreId: number): Promise<PopupEngagement> {
  const response = await httpClient.post<PopupEngagement>(
    `/api/popup-stores/${popupStoreId}/engagement/plan-add`,
    getEngagementIdentity(),
  )
  return response.data
}

export async function setPopupLike(popupStoreId: number, liked: boolean): Promise<PopupEngagement> {
  const { anonymousVisitorId } = getEngagementIdentity()
  const url = `/api/popup-stores/${popupStoreId}/engagement/like`
  const response = liked
    ? await httpClient.put<PopupEngagement>(url, { anonymousVisitorId })
    : await httpClient.delete<PopupEngagement>(url, { data: { anonymousVisitorId } })
  return response.data
}
