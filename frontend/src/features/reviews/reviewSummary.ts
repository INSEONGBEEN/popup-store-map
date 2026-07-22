export interface ReviewSummary { averageRating: number; reviewCount: number }

export function addRating(summary: ReviewSummary, rating: number): ReviewSummary {
  const reviewCount = summary.reviewCount + 1
  return { reviewCount, averageRating: (summary.averageRating * summary.reviewCount + rating) / reviewCount }
}
export function replaceRating(summary: ReviewSummary, previous: number, next: number): ReviewSummary {
  if (summary.reviewCount === 0) return summary
  return { ...summary, averageRating: (summary.averageRating * summary.reviewCount - previous + next) / summary.reviewCount }
}
export function removeRating(summary: ReviewSummary, rating: number): ReviewSummary {
  if (summary.reviewCount <= 1) return { averageRating: 0, reviewCount: 0 }
  const reviewCount = summary.reviewCount - 1
  return { reviewCount, averageRating: (summary.averageRating * summary.reviewCount - rating) / reviewCount }
}
