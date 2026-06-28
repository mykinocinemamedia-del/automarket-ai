'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { supabase, TABLES, type Project } from '@/lib/supabase'

/**
 * Hook for managing the active project.
 * - On mount: loads all projects, sets the first one as active if none selected
 * - Exposes: projects list, activeProject, setActiveProject, refresh, loading
 */
export function useProject() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const activeProjectId = useAppStore((s) => s.activeProjectId)
  const setActiveProject = useAppStore((s) => s.setActiveProject)

  const refresh = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .select('*')
        .order('createdAt', { ascending: false })

      if (error) throw error

      const list = data || []
      setProjects(list)

      // Auto-select first project if none selected or selected doesn't exist
      if (list.length > 0) {
        const exists = list.some((p) => p.id === activeProjectId)
        if (!exists) {
          setActiveProject(list[0].id)
        }
      } else {
        setActiveProject(null)
      }
    } catch (e) {
      console.error('Failed to load projects:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const activeProject = projects.find((p) => p.id === activeProjectId) || null

  return {
    projects,
    activeProject,
    activeProjectId,
    setActiveProject,
    refresh,
    loading,
  }
}
