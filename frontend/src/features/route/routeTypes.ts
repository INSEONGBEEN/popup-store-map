export type RouteCoordinate = [longitude: number, latitude: number]

export interface RouteResult {
  coordinates: RouteCoordinate[]
  distanceMeters: number
  durationSeconds: number
}

export type RouteStatus = 'idle' | 'loading' | 'success' | 'error' | 'stale'

export interface RouteState {
  status: RouteStatus
  result: RouteResult | null
  errorMessage: string | null
}
