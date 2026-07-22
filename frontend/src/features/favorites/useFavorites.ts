import { useCallback, useEffect, useMemo, useState } from 'react'
import { addFavorite, getFavorites, removeFavorite, type FavoriteItem } from '../../api/favorites'
import type { PopupStore } from '../../types/popupStore'
import { useAuth } from '../auth/authContext'

export function useFavorites(onError: (message: string) => void) {
  const { user } = useAuth()
  const [items, setItems] = useState<FavoriteItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!user) { setItems([]); return }
    let active = true
    setIsLoading(true)
    void getFavorites().then((page) => { if (active) setItems(page.content) })
      .catch(() => { if (active) onError('즐겨찾기 목록을 불러오지 못했습니다.') })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [onError, user])

  const favoriteIds = useMemo(() => new Set(items.map(({ popupStore }) => popupStore.id)), [items])

  const toggle = useCallback(async (store: PopupStore) => {
    const wasFavorite = favoriteIds.has(store.id)
    const previous = items
    setItems((current) => optimisticFavoriteItems(current, store, wasFavorite, new Date().toISOString()))
    try {
      if (wasFavorite) await removeFavorite(store.id)
      else {
        const created = await addFavorite(store.id)
        setItems((current) => [created, ...current.filter((item) => item.popupStore.id !== store.id)])
      }
      return !wasFavorite
    } catch (error) {
      setItems(previous)
      onError('즐겨찾기를 반영하지 못했습니다. 다시 시도해 주세요.')
      throw error
    }
  }, [favoriteIds, items, onError])

  return { items, favoriteIds, isLoading, toggle }
}

export function optimisticFavoriteItems(
  items: FavoriteItem[], store: PopupStore, wasFavorite: boolean, createdAt: string,
) {
  if (wasFavorite) return items.filter((item) => item.popupStore.id !== store.id)
  return [{ id: -store.id, popupStore: store, createdAt }, ...items.filter((item) => item.popupStore.id !== store.id)]
}
