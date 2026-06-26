import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { repurposeContent } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sourceContent, targetPlatforms, brandId } = body

    if (!sourceContent || !targetPlatforms?.length) {
      return NextResponse.json(
        { error: 'sourceContent and targetPlatforms are required' },
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

    const variations = await repurposeContent({
      sourceContent,
      targetPlatforms,
      brandCtx,
    })

    return NextResponse.json({ variations })
  } catch (e: any) {
    console.error('repurpose error:', e)
    return NextResponse.json(
      { error: e?.message || 'Failed to repurpose content' },
      { status: 500 }
    )
  }
}
