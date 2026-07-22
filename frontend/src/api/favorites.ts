import { httpClient } from './httpClient'
import type { PopupStore } from '../types/popupStore'

export interface FavoriteItem {
  id: number
  popupStore: PopupStore
  createdAt: string
}

interface FavoritePage {
  content: FavoriteItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export async function getFavorites() {
  return (await httpClient.get<FavoritePage>('/api/users/me/favorites?page=0&size=100&sort=createdAt,desc')).data
}

export async function addFavorite(popupStoreId: number) {
  return (await httpClient.post<FavoriteItem>(`/api/users/me/favorites/${popupStoreId}`)).data
}

export async function removeFavorite(popupStoreId: number) {
  await httpClient.delete(`/api/users/me/favorites/${popupStoreId}`)
}
