import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { generateCaption } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { topic, platform, additionalInstructions, count, projectId } = body

    if (!topic || !platform) {
      return NextResponse.json({ error: 'topic and platform are required' }, { status: 400 })
    }

    let brandCtx = {}
    if (projectId) {
      const { data: brand } = await supabase
        .from(TABLES.BRAND_PROFILES)
        .select('*')
        .eq('projectId', projectId)
        .limit(1)
        .single()

      if (brand) {
        brandCtx = {
          name: brand.name,
          tagline: brand.tagline || undefined,
          industry: brand.industry || undefined,
          targetAudience: brand.targetAudience || undefined,
          brandVoice: brand.brandVoice || undefined,
          toneKeywords: brand.toneKeywords || undefined,
        }
      }
    }

    const captions = await generateCaption({
      topic,
      platform,
      brandCtx,
      additionalInstructions,
      count: count || 3,
    })

    return NextResponse.json({ captions })
  } catch (e: any) {
    console.error('generate-caption error:', e)
    return NextResponse.json(
      { error: e?.message || 'Failed to generate caption' },
      { status: 500 }
    )
  }
}
