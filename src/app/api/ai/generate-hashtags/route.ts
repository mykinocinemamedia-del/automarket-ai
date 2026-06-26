import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateHashtags } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { topic, platform, count, brandId } = body

    if (!topic || !platform) {
      return NextResponse.json(
        { error: 'topic and platform are required' },
        { status: 400 }
      )
    }

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

    const hashtags = await generateHashtags({
      topic,
      platform,
      brandCtx,
      count: count || 15,
    })

    return NextResponse.json({ hashtags })
  } catch (e: any) {
    console.error('generate-hashtags error:', e)
    return NextResponse.json(
      { error: e?.message || 'Failed to generate hashtags' },
      { status: 500 }
    )
  }
}
