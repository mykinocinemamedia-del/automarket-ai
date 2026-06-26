import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const brands = await db.brandProfile.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ brands })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, tagline, industry, targetAudience, brandVoice, toneKeywords, primaryColor, logoUrl, hashtagSets } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const brand = await db.brandProfile.create({
      data: {
        name,
        tagline: tagline || null,
        industry: industry || null,
        targetAudience: targetAudience || null,
        brandVoice: brandVoice || null,
        toneKeywords: toneKeywords || null,
        primaryColor: primaryColor || null,
        logoUrl: logoUrl || null,
        hashtagSets: hashtagSets || null,
      },
    })

    return NextResponse.json({ brand })
  } catch (e: any) {
    console.error('brand create error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to create brand' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const brand = await db.brandProfile.update({
      where: { id },
      data: {
        ...data,
        tagline: data.tagline ?? null,
        industry: data.industry ?? null,
        targetAudience: data.targetAudience ?? null,
        brandVoice: data.brandVoice ?? null,
        toneKeywords: data.toneKeywords ?? null,
        primaryColor: data.primaryColor ?? null,
        logoUrl: data.logoUrl ?? null,
        hashtagSets: data.hashtagSets ?? null,
      },
    })

    return NextResponse.json({ brand })
  } catch (e: any) {
    console.error('brand update error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to update brand' }, { status: 500 })
  }
}
