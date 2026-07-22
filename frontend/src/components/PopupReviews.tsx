import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createReview, deleteReview, getReviews, updateReview, type Review, type ReviewOrder } from '../api/reviews'
import { useAuth } from '../features/auth/authContext'
import { addRating, removeRating, replaceRating, type ReviewSummary } from '../features/reviews/reviewSummary'

interface Props {
  popupStoreId: number
  initialSummary: ReviewSummary
  visited: boolean
  onRequireLogin: () => void
  onChanged: (summary: ReviewSummary) => void
  myReview?: Review
}

export function PopupReviews(props: Props) {
  const auth = useAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState(props.initialSummary)
  const [order, setOrder] = useState<ReviewOrder>('latest')
  const [page, setPage] = useState(0)
  const [last, setLast] = useState(true)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resumeAfterLogin = useRef(false)

  useEffect(() => { setSummary(props.initialSummary) }, [props.initialSummary])
  useEffect(() => {
    let active = true
    setLoading(true); setPage(0)
    void getReviews(props.popupStoreId, order).then((result) => {
      if (!active) return
      setReviews(result.content); setLast(result.last)
    }).catch(() => { if (active) setError('리뷰를 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [auth.user?.id, order, props.popupStoreId])

  const mine = reviews.find((review) => review.mine) ?? props.myReview
  useEffect(() => {
    if (auth.isAuthenticated && resumeAfterLogin.current) {
      resumeAfterLogin.current = false
      if (props.visited || mine) setEditing(true)
    }
  }, [auth.isAuthenticated, mine, props.visited])

  const begin = () => {
    if (!auth.isAuthenticated) { resumeAfterLogin.current = true; props.onRequireLogin(); return }
    if (!props.visited && !mine) return
    setRating(mine?.rating ?? 5); setContent(mine?.content ?? ''); setEditing(true); setError(null)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const normalized = content.trim()
    if (normalized.length < 10 || normalized.length > 1000) { setError('리뷰는 10자 이상 1000자 이하로 작성해 주세요.'); return }
    setSubmitting(true); setError(null)
    try {
      const saved = mine
        ? await updateReview(props.popupStoreId, mine.reviewId, { rating, content: normalized })
        : await createReview(props.popupStoreId, { rating, content: normalized })
      setReviews((current) => [saved, ...current.filter((review) => review.reviewId !== saved.reviewId)])
      const next = mine ? replaceRating(summary, mine.rating, saved.rating) : addRating(summary, saved.rating)
      setSummary(next); props.onChanged(next); setEditing(false)
    } catch { setError('리뷰를 저장하지 못했습니다. 자격과 입력 내용을 확인해 주세요.') }
    finally { setSubmitting(false) }
  }

  const removeMine = async () => {
    if (!mine || !window.confirm('내 리뷰를 삭제할까요?')) return
    setSubmitting(true)
    try {
      await deleteReview(props.popupStoreId, mine.reviewId)
      setReviews((current) => current.filter((review) => review.reviewId !== mine.reviewId))
      const next = removeRating(summary, mine.rating); setSummary(next); props.onChanged(next); setEditing(false)
    } catch { setError('리뷰를 삭제하지 못했습니다.') }
    finally { setSubmitting(false) }
  }

  const loadMore = async () => {
    const nextPage = page + 1
    setLoading(true)
    try {
      const result = await getReviews(props.popupStoreId, order, nextPage)
      setReviews((current) => [...current, ...result.content]); setPage(nextPage); setLast(result.last)
    } catch { setError('리뷰를 더 불러오지 못했습니다.') }
    finally { setLoading(false) }
  }

  return <section className="popup-reviews">
    <header><div><strong>★ {summary.averageRating.toFixed(1)}</strong><span>리뷰 {summary.reviewCount}개</span></div>
      <select value={order} onChange={(event) => setOrder(event.target.value as ReviewOrder)} aria-label="리뷰 정렬">
        <option value="latest">최신순</option><option value="rating_desc">평점 높은순</option><option value="rating_asc">평점 낮은순</option>
      </select></header>
    {!editing && <div className="review-cta">
      {!auth.isAuthenticated ? <button type="button" onClick={begin}>로그인 후 리뷰를 작성할 수 있습니다</button>
        : !props.visited && !mine ? <p>방문 완료 후 리뷰를 작성할 수 있습니다.</p>
          : <button type="button" onClick={begin}>{mine ? '내 리뷰 수정' : '리뷰 작성'}</button>}
      {mine && <button type="button" onClick={() => void removeMine()} disabled={submitting}>내 리뷰 삭제</button>}
    </div>}
    {editing && <form className="review-form" onSubmit={submit}>
      <fieldset><legend>평점</legend>{[1, 2, 3, 4, 5].map((value) => <label key={value}>
        <input type="radio" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} />{value}점</label>)}</fieldset>
      <label>리뷰 내용<textarea value={content} onChange={(event) => setContent(event.target.value)} minLength={10} maxLength={1000} required /></label>
      <span className="review-count">{content.length} / 1000</span>
      <div><button type="button" onClick={() => setEditing(false)}>취소</button><button type="submit" disabled={submitting}>{submitting ? '저장 중…' : '저장'}</button></div>
    </form>}
    {error && <p className="planner-message error" role="alert">{error}</p>}
    {loading && reviews.length === 0 ? <p className="details-empty">리뷰를 불러오는 중입니다…</p> : reviews.length === 0
      ? <p className="details-empty">아직 등록된 후기가 없습니다.</p>
      : <ul className="review-list">{reviews.map((review) => <li key={review.reviewId}>
        <header><strong>{review.nickname}</strong><span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></header>
        {review.verifiedVisit && <small>길안내 방문 확인</small>}<p>{review.content}</p><time>{review.createdAt.slice(0, 10)}</time>
      </li>)}</ul>}
    {!last && <button type="button" className="review-more" onClick={() => void loadMore()} disabled={loading}>리뷰 더 보기</button>}
  </section>
}
