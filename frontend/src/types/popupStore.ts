export type PopupStoreCategory =
  | 'FASHION'
  | 'BEAUTY'
  | 'FOOD'
  | 'CHARACTER'
  | 'LIFESTYLE'
  | 'ETC'

export type PopupStoreStatus = 'UPCOMING' | 'OPEN' | 'CLOSED'

export interface PopupEngagement {
  viewCount: number
  likeCount: number
  planAddCount: number
  likedByCurrentVisitor: boolean
}

export interface PopupStore {
  id: number
  name: string
  address: string
  latitude: number | null
  longitude: number | null
  startDate: string
  endDate: string
  category: PopupStoreCategory | null
  status: PopupStoreStatus | null
  description: string | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
  engagement: PopupEngagement
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}
