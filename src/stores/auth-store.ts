import { create } from 'zustand'
import type { Profile } from '@/types/database'

interface AuthState {
  user: Profile | null
  isLoading: boolean
  setUser: (user: Profile | null) => void
  setLoading: (loading: boolean) => void
  updateUser: (updates: Partial<Profile>) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
  clearUser: () => set({ user: null, isLoading: false }),
}))

/* ── Signup step tracking ────────────────────────────────── */

export type SignupStep =
  | 'email'
  | 'otp'
  | 'role'
  | 'profile'
  | 'id-upload'
  | 'pending'
  | 'already-exists'

interface SignupState {
  step: SignupStep
  email: string
  setStep: (step: SignupStep) => void
  setEmail: (email: string) => void
  reset: () => void
}

export const useSignupStore = create<SignupState>((set) => ({
  step: 'email',
  email: '',
  setStep: (step) => set({ step }),
  setEmail: (email) => set({ email }),
  reset: () => set({ step: 'email', email: '' }),
}))
