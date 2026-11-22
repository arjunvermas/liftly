import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),

  setAuth: (user, profile) =>
    set({ user, profile, isAuthenticated: !!user, isLoading: false }),

  logout: () =>
    set({ user: null, profile: null, isAuthenticated: false, isLoading: false }),
}))

export default useAuthStore
