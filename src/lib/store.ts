import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SectionId =
  | 'dashboard'
  | 'projects'
  | 'trends'
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
  activeProjectId: string | null
  setActiveProject: (id: string | null) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeSection: 'dashboard',
      setSection: (s) => set({ activeSection: s }),
      activeProjectId: null,
      setActiveProject: (id) => set({ activeProjectId: id }),
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'kino-social-store',
      partialize: (state) => ({ activeProjectId: state.activeProjectId }),
    }
  )
)
