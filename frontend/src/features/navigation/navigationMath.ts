import type { RouteCoordinate, RouteManeuver, RouteResult } from '../route/routeTypes'

const EARTH_RADIUS_METERS = 6_371_000

export const NAVIGATION_THRESHOLDS = {
  arrivalMeters: 25,
  offRouteMeters: 35,
  maxAccuracyForOffRouteMeters: 50,
  offRouteSamples: 3,
  minRerouteIntervalMs: 30_000,
} as const

export interface RouteProjection {
  coordinate: RouteCoordinate
  segmentIndex: number
  fraction: number
  distanceToRouteMeters: number
  remainingDistanceMeters: number
}

export function haversineMeters(a: RouteCoordinate, b: RouteCoordinate): number {
  const radians = Math.PI / 180
  const dLat = (b[1] - a[1]) * radians
  const dLon = (b[0] - a[0]) * radians
  const lat1 = a[1] * radians
  const lat2 = b[1] * radians
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function projectOntoRoute(
  position: RouteCoordinate,
  route: RouteCoordinate[],
  previousSegment = 0,
): RouteProjection | null {
  if (route.length < 2) return null
  const latitudeScale = Math.cos(position[1] * Math.PI / 180)
  const meterX = (longitude: number) => longitude * 111_320 * latitudeScale
  const meterY = (latitude: number) => latitude * 110_540
  const px = meterX(position[0]); const py = meterY(position[1])
  let best: { index: number; fraction: number; distance: number; coordinate: RouteCoordinate } | null = null
  const start = Math.max(0, previousSegment - 5)
  for (let index = start; index < route.length - 1; index += 1) {
    const a = route[index]; const b = route[index + 1]
    const ax = meterX(a[0]); const ay = meterY(a[1]); const bx = meterX(b[0]); const by = meterY(b[1])
    const dx = bx - ax; const dy = by - ay
    const fraction = dx === 0 && dy === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    const coordinate: RouteCoordinate = [a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction]
    const distance = haversineMeters(position, coordinate)
    if (!best || distance < best.distance) best = { index, fraction, distance, coordinate }
  }
  if (!best) return null
  let remaining = haversineMeters(best.coordinate, route[best.index + 1])
  for (let index = best.index + 1; index < route.length - 1; index += 1) remaining += haversineMeters(route[index], route[index + 1])
  return {
    coordinate: best.coordinate,
    segmentIndex: best.index,
    fraction: best.fraction,
    distanceToRouteMeters: best.distance,
    remainingDistanceMeters: remaining,
  }
}

export function nextManeuver(route: RouteResult, shapeIndex: number): RouteManeuver | null {
  return route.legs.flatMap((leg) => leg.maneuvers)
    .find((maneuver) => maneuver.endShapeIndex >= shapeIndex) ?? null
}

export function remainingDuration(route: RouteResult, remainingMeters: number): number {
  if (route.distanceMeters <= 0) return 0
  return Math.max(0, route.durationSeconds * Math.min(1, remainingMeters / route.distanceMeters))
}

export function shouldConfirmOffRoute(distances: number[], accuracyMeters: number): boolean {
  if (accuracyMeters > NAVIGATION_THRESHOLDS.maxAccuracyForOffRouteMeters) return false
  return distances.slice(-NAVIGATION_THRESHOLDS.offRouteSamples)
    .every((distance) => distance > NAVIGATION_THRESHOLDS.offRouteMeters) &&
    distances.length >= NAVIGATION_THRESHOLDS.offRouteSamples
}
