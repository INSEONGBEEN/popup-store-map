import { useCallback, useEffect, useState } from 'react'
import { getMyReviews, type MyReview } from '../../api/reviews'
import { useAuth } from '../auth/authContext'

export function useMyReviews() {
  const { user } = useAuth()
  const [items, setItems] = useState<MyReview[]>([])
  const [revision, setRevision] = useState(0)
  const reload = useCallback(() => setRevision((value) => value + 1), [])
  useEffect(() => {
    if (!user) { setItems([]); return }
    let active = true
    void getMyReviews().then((page) => { if (active) setItems(page.content) }).catch(() => undefined)
    return () => { active = false }
  }, [revision, user])
  return { items, reload }
}
