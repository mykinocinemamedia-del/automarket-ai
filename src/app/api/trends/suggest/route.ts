import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { runTrendCycle } from '@/lib/trend-agent'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { projectId, platform, count } = body

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    // Fetch brand context for this project
    const { data: brand } = await supabase
      .from(TABLES.BRAND_PROFILES)
      .select('*')
      .eq('projectId', projectId)
      .limit(1)
      .single()

    const brandCtx = {
      name: brand?.name,
      tagline: brand?.tagline || undefined,
      industry: brand?.industry || undefined,
      targetAudience: brand?.targetAudience || undefined,
      brandVoice: brand?.brandVoice || undefined,
      toneKeywords: brand?.toneKeywords || undefined,
    }

    const platforms = platform ? [platform] : ['instagram', 'tiktok']

    const result = await runTrendCycle({
      brandCtx,
      platforms,
      count: count || 5,
    })

    return NextResponse.json({
      success: true,
      trends: result.trends,
      suggestions: result.suggestions,
      generatedAt: new Date().toISOString(),
    })
  } catch (e: any) {
    console.error('trends suggest error:', e)
    return NextResponse.json(
      { error: e?.message || 'Failed to generate trend suggestions' },
      { status: 500 }
    )
  }
}
