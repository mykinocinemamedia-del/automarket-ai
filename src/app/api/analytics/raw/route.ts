import { NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from(TABLES.ANALYTICS_SNAPSHOTS)
      .select('*')
      .order('recordedAt', { ascending: false })
      .limit(1000)

    if (error) throw error
    return NextResponse.json({ snapshots: data || [] })
  } catch (e: any) {
    console.error('analytics raw GET error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
