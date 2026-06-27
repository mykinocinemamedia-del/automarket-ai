import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES, type BrandProfile } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from(TABLES.BRAND_PROFILES)
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) throw error
    return NextResponse.json({ brands: data || [] })
  } catch (e: any) {
    console.error('brand GET error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, tagline, industry, targetAudience, brandVoice, toneKeywords, primaryColor, logoUrl, hashtagSets } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from(TABLES.BRAND_PROFILES)
      .insert({
        name,
        tagline: tagline || null,
        industry: industry || null,
        targetAudience: targetAudience || null,
        brandVoice: brandVoice || null,
        toneKeywords: toneKeywords || null,
        primaryColor: primaryColor || null,
        logoUrl: logoUrl || null,
        hashtagSets: hashtagSets || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ brand: data })
  } catch (e: any) {
    console.error('brand POST error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updateData: any = { ...data, updatedAt: new Date().toISOString() }
    if ('tagline' in data) updateData.tagline = data.tagline ?? null
    if ('industry' in data) updateData.industry = data.industry ?? null
    if ('targetAudience' in data) updateData.targetAudience = data.targetAudience ?? null
    if ('brandVoice' in data) updateData.brandVoice = data.brandVoice ?? null
    if ('toneKeywords' in data) updateData.toneKeywords = data.toneKeywords ?? null
    if ('primaryColor' in data) updateData.primaryColor = data.primaryColor ?? null
    if ('logoUrl' in data) updateData.logoUrl = data.logoUrl ?? null
    if ('hashtagSets' in data) updateData.hashtagSets = data.hashtagSets ?? null

    const { data: updated, error } = await supabase
      .from(TABLES.BRAND_PROFILES)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ brand: updated })
  } catch (e: any) {
    console.error('brand PATCH error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
