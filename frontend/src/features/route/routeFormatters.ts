export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1_000) {
    return `${Math.round(distanceMeters)}m`
  }
  return `${(distanceMeters / 1_000).toFixed(1)}km`
}

export function formatDuration(durationSeconds: number): string {
  const totalMinutes = Math.max(1, Math.round(durationSeconds / 60))
  if (totalMinutes < 60) {
    return `${totalMinutes}분`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes === 0 ? `${hours}시간` : `${hours}시간 ${minutes}분`
}
