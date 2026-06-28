import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    let query = supabase.from(TABLES.ANALYTICS_SNAPSHOTS).select('*')
    if (projectId) query = query.eq('projectId', projectId)
    query = query.order('recordedAt', { ascending: false }).limit(1000)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ snapshots: data || [] })
  } catch (e: any) {
    console.error('analytics raw GET error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
