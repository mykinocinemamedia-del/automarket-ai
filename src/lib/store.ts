import { create } from 'zustand'

export type SectionId =
  | 'dashboard'
  | 'agent'
  | 'studio'
  | 'brand'
  | 'calendar'
  | 'assets'
  | 'analytics'
  | 'autopilot'

interface AppState {
  activeSection: SectionId
  setSection: (s: SectionId) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeSection: 'dashboard',
  setSection: (s) => set({ activeSection: s }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
