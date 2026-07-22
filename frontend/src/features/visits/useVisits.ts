import { useCallback, useEffect, useMemo, useState } from 'react'
import { getVisits, recordVisit, type VisitItem, type VisitSource } from '../../api/visits'
import { useAuth } from '../auth/authContext'

export function useVisits(onError: (message: string) => void) {
  const { user } = useAuth()
  const [items, setItems] = useState<VisitItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!user) { setItems([]); return }
    let active = true
    setIsLoading(true)
    void getVisits().then((page) => { if (active) setItems(page.content) })
      .catch(() => { if (active) onError('방문 기록을 불러오지 못했습니다.') })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [onError, user])

  const visitedStoreIds = useMemo(() => new Set(items.map(({ popupStore }) => popupStore.id)), [items])
  const record = useCallback(async (popupStoreId: number, source: VisitSource) => {
    const saved = await recordVisit(popupStoreId, source)
    setItems((current) => [saved, ...current.filter((item) => item.id !== saved.id)])
    return saved
  }, [])

  return { items, visitedStoreIds, isLoading, record }
}
