import { create } from 'zustand'

export type RoomType = 'SINGLE' | 'SHARED' | '1BHK' | '2BHK' | '3BHK' | 'PG'
export type Furnished = 'FURNISHED' | 'SEMI' | 'UNFURNISHED'
export type GenderAllowed = 'MALE' | 'FEMALE' | 'ANY'
export type WaterSupply = '24H' | 'TIMED' | 'BOREWELL'

export interface ListingState {
  title: string
  description: string
  rent: number | ''
  deposit: number | ''
  room_type: RoomType
  furnished: Furnished
  gender_allowed: GenderAllowed
  roommates_needed: number
  has_wifi: boolean
  has_ac: boolean
  food_available: boolean
  water_supply: WaterSupply
  latitude: number | null
  longitude: number | null
  address: string
  available_from: string
  images: File[]
}

interface ListingStore extends ListingState {
  updateField: <K extends keyof ListingState>(key: K, value: ListingState[K]) => void
  setImages: (images: File[]) => void
  reset: () => void
}

const initialState: ListingState = {
  title: '',
  description: '',
  rent: '',
  deposit: '',
  room_type: 'SHARED',
  furnished: 'SEMI',
  gender_allowed: 'ANY',
  roommates_needed: 1,
  has_wifi: false,
  has_ac: false,
  food_available: false,
  water_supply: '24H',
  latitude: null,
  longitude: null,
  address: '',
  available_from: '',
  images: [],
}

export const useListingStore = create<ListingStore>((set) => ({
  ...initialState,
  updateField: (key, value) => set({ [key]: value }),
  setImages: (images) => set({ images }),
  reset: () => set(initialState),
}))
