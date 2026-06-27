import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from(TABLES.AUTOMATION_RULES)
      .select('*')
      .order('createdAt', { ascending: false })
    if (error) throw error
    return NextResponse.json({ rules: data || [] })
  } catch (e: any) {
    console.error('rules GET error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, trigger, action, config, active } = body

    if (!name || !trigger || !action) {
      return NextResponse.json({ error: 'name, trigger, action are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from(TABLES.AUTOMATION_RULES)
      .insert({
        name,
        description: description || null,
        trigger,
        action,
        config: config || '{}',
        active: active ?? true,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ rule: data })
  } catch (e: any) {
    console.error('rules POST error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const updateData: any = { ...data, updatedAt: new Date().toISOString() }
    if ('description' in data) updateData.description = data.description ?? null
    if ('config' in data) updateData.config = data.config ?? undefined

    const { data: updated, error } = await supabase
      .from(TABLES.AUTOMATION_RULES)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ rule: updated })
  } catch (e: any) {
    console.error('rules PATCH error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { error } = await supabase.from(TABLES.AUTOMATION_RULES).delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('rules DELETE error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
