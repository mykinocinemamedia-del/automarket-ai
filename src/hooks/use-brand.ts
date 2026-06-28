'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { supabase, TABLES, type BrandData } from '@/lib/supabase'

export interface BrandData {
  id: string
  name: string
  tagline?: string | null
  industry?: string | null
  targetAudience?: string | null
  brandVoice?: string | null
  toneKeywords?: string | null
  primaryColor?: string | null
  logoUrl?: string | null
  hashtagSets?: string | null
  projectId?: string | null
}

/**
 * Fetches the brand profile for the active project.
 */
export function useBrand() {
  const activeProjectId = useAppStore((s) => s.activeProjectId)
  const [brand, setBrand] = useState<BrandData | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    if (!activeProjectId) {
      setBrand(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from(TABLES.BRAND_PROFILES)
        .select('*')
        .eq('projectId', activeProjectId)
        .order('createdAt', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found, which is fine
        throw error
      }
      setBrand(data || null)
    } catch {
      setBrand(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [activeProjectId])

  return { brand, brandId: brand?.id, loading, refresh }
}
