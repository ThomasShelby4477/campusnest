import { create } from 'zustand'

export type FlatType = 'SINGLE' | '1BHK' | '2BHK' | '3BHK' | 'PG'
export type RoomType = FlatType   // kept for DB/API compat — same column
export type Furnished = 'FURNISHED' | 'SEMI' | 'UNFURNISHED'
export type GenderAllowed = 'MALE' | 'FEMALE' | 'ANY'
export type WaterSupply = '24H' | 'TIMED' | 'BOREWELL'
export type OwnerProximity = 'SAME_BUILDING' | 'NEARBY' | 'FAR'

export interface ListingState {
  title: string
  description: string
  rent: number | ''
  deposit: number | ''
  // flat_type is stored in the DB as room_type (same column, same enum values minus SHARED)
  room_type: FlatType
  furnished: Furnished
  gender_allowed: GenderAllowed
  roommates_needed: number
  persons_staying: number        // NEW: how many people currently live there
  owner_proximity: OwnerProximity // NEW: where does the owner live?
  has_balcony: boolean           // NEW: does it have a balcony?
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
  room_type: '1BHK',
  furnished: 'SEMI',
  gender_allowed: 'MALE',
  roommates_needed: 1,
  persons_staying: 0,
  owner_proximity: 'NEARBY',
  has_balcony: false,
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
