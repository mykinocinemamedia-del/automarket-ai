'use client'

import { useState, useEffect } from 'react'

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
}

/**
 * Fetches the first (primary) brand profile.
 * Returns { brand, loading }.
 */
export function useBrand() {
  const [brand, setBrand] = useState<BrandData | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/brand')
      const data = await res.json()
      if (data.brands?.[0]) {
        setBrand(data.brands[0])
      } else {
        setBrand(null)
      }
    } catch {
      setBrand(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return { brand, brandId: brand?.id, loading, refresh }
}
