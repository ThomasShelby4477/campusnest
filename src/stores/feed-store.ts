import { create } from 'zustand'

export interface RoommateTarget {
  id: string
  name: string
  avatar_url: string
  year: number
  branch: string
  gender: string
  looking_for_buddy: boolean
  prefs: Record<string, unknown>
  compatibility: number
}

interface FeedStore {
  feed: RoommateTarget[]
  loading: boolean
  setFeed: (feed: RoommateTarget[]) => void
  setLoading: (loading: boolean) => void
  popCard: () => void
}

export const useFeedStore = create<FeedStore>((set) => ({
  feed: [],
  loading: true,
  setFeed: (feed) => set({ feed, loading: false }),
  setLoading: (loading) => set({ loading }),
  popCard: () => set((state) => ({ feed: state.feed.slice(1) }))
}))
