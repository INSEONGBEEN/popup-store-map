export type RouteCoordinate = [longitude: number, latitude: number]

export type RouteOriginType = 'SEONGSU_STATION' | 'CURRENT_LOCATION' | 'FIRST_SELECTED_STORE'

export interface CurrentLocation {
  coordinate: RouteCoordinate
  accuracyMeters: number
}

export interface RouteManeuver {
  instruction: string
  maneuverType: number
  distanceMeters: number
  durationSeconds: number
}

export interface RouteLeg {
  index: number
  distanceMeters: number
  durationSeconds: number
  maneuvers: RouteManeuver[]
}

export interface RouteResult {
  coordinates: RouteCoordinate[]
  distanceMeters: number
  durationSeconds: number
  legs: RouteLeg[]
  departureName: string
  destinationName: string
  popupStoreCount: number
}

export type RouteStatus = 'idle' | 'loading' | 'success' | 'error' | 'stale'

export interface RouteState {
  status: RouteStatus
  result: RouteResult | null
  errorMessage: string | null
}
