import { httpClient } from './httpClient'
import type { PageResponse, PopupStore } from '../types/popupStore'

export type ReviewOrder = 'latest' | 'rating_desc' | 'rating_asc'
export interface Review {
  reviewId: number
  nickname: string
  rating: number
  content: string
  createdAt: string
  updatedAt: string
  verifiedVisit: boolean
  mine: boolean
}
export interface ReviewInput { rating: number; content: string }
export interface MyReview { popupStore: PopupStore; review: Review }

export async function getReviews(popupStoreId: number, order: ReviewOrder, page = 0) {
  return (await httpClient.get<PageResponse<Review>>(`/api/popup-stores/${popupStoreId}/reviews`, {
    params: { sort: order, page, size: 10 },
  })).data
}
export async function createReview(popupStoreId: number, input: ReviewInput) {
  return (await httpClient.post<Review>(`/api/popup-stores/${popupStoreId}/reviews`, input)).data
}
export async function updateReview(popupStoreId: number, reviewId: number, input: ReviewInput) {
  return (await httpClient.patch<Review>(`/api/popup-stores/${popupStoreId}/reviews/${reviewId}`, input)).data
}
export async function deleteReview(popupStoreId: number, reviewId: number) {
  await httpClient.delete(`/api/popup-stores/${popupStoreId}/reviews/${reviewId}`)
}
export async function getMyReviews() {
  return (await httpClient.get<PageResponse<MyReview>>('/api/users/me/reviews?page=0&size=100')).data
}
