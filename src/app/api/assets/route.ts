import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from(TABLES.ASSETS)
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(100)
    if (error) throw error
    return NextResponse.json({ assets: data || [] })
  } catch (e: any) {
    console.error('assets GET error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, type, url, tags, brandId } = body

    if (!name || !type || !url) {
      return NextResponse.json({ error: 'name, type, url are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from(TABLES.ASSETS)
      .insert({
        name,
        type,
        url,
        tags: tags || null,
        brandId: brandId || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ asset: data })
  } catch (e: any) {
    console.error('assets POST error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { error } = await supabase.from(TABLES.ASSETS).delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('assets DELETE error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
