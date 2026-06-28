import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')

    let query = supabase.from(TABLES.ANALYTICS_SNAPSHOTS).select('*')
    if (projectId) query = query.eq('projectId', projectId)
    query = query.order('recordedAt', { ascending: false }).limit(1000)

    const { data: snapshots, error } = await query

    if (error) throw error

    // Aggregate by platform + metric
    const byPlatform: Record<string, Record<string, number>> = {}
    const latest: Record<string, Record<string, { value: number; recordedAt: string }>> = {}

    for (const s of snapshots || []) {
      if (!byPlatform[s.platform]) byPlatform[s.platform] = {}
      byPlatform[s.platform][s.metric] = (byPlatform[s.platform][s.metric] || 0) + s.value

      if (!latest[s.platform]) latest[s.platform] = {}
      if (!latest[s.platform][s.metric] || new Date(s.recordedAt) > new Date(latest[s.platform][s.metric].recordedAt)) {
        latest[s.platform][s.metric] = { value: s.value, recordedAt: s.recordedAt }
      }
    }

    return NextResponse.json({ byPlatform, latest, total: (snapshots || []).length })
  } catch (e: any) {
    console.error('analytics GET error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { platform, metric, value, projectId } = body

    if (!platform || !metric || typeof value !== 'number') {
      return NextResponse.json({ error: 'platform, metric, value (number) required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from(TABLES.ANALYTICS_SNAPSHOTS)
      .insert({ platform, metric, value, projectId: projectId || null })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ snapshot: data })
  } catch (e: any) {
    console.error('analytics POST error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
