import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateContentIdeas } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pillarTopics, count, brandId } = body

    let brandCtx = {}
    if (brandId) {
      const brand = await db.brandProfile.findUnique({ where: { id: brandId } })
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

    const ideas = await generateContentIdeas({
      brandCtx,
      pillarTopics,
      count: count || 10,
    })

    return NextResponse.json({ ideas })
  } catch (e: any) {
    console.error('ideas error:', e)
    return NextResponse.json(
      { error: e?.message || 'Failed to generate ideas' },
      { status: 500 }
    )
  }
}
