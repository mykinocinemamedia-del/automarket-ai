import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from(TABLES.PROJECTS)
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) throw error
    return NextResponse.json({ projects: data || [] })
  } catch (e: any) {
    console.error('projects GET error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, type, description, color, emoji } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from(TABLES.PROJECTS)
      .insert({
        name,
        type: type || 'company',
        description: description || null,
        color: color || '#f5e642',
        emoji: emoji || '📁',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ project: data })
  } catch (e: any) {
    console.error('projects POST error:', e)
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
    if ('description' in data) updateData.description = data.description ?? null
    if ('color' in data) updateData.color = data.color ?? null
    if ('emoji' in data) updateData.emoji = data.emoji ?? null

    const { data: updated, error } = await supabase
      .from(TABLES.PROJECTS)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ project: updated })
  } catch (e: any) {
    console.error('projects PATCH error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // Delete project — cascades to all related data (brand, posts, assets, rules, analytics)
    const { error } = await supabase.from(TABLES.PROJECTS).delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('projects DELETE error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
