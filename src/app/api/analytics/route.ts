import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const snapshots = await db.analyticsSnapshot.findMany({
    orderBy: { recordedAt: 'desc' },
    take: 500,
  })

  // Aggregate by platform + metric
  const byPlatform: Record<string, Record<string, number>> = {}
  for (const s of snapshots) {
    if (!byPlatform[s.platform]) byPlatform[s.platform] = {}
    byPlatform[s.platform][s.metric] = (byPlatform[s.platform][s.metric] || 0) + s.value
  }

  // Get most recent per metric per platform (latest)
  const latest: Record<string, Record<string, { value: number; recordedAt: string }>> = {}
  for (const s of snapshots) {
    if (!latest[s.platform]) latest[s.platform] = {}
    if (!latest[s.platform][s.metric] || new Date(s.recordedAt) > new Date(latest[s.platform][s.metric].recordedAt)) {
      latest[s.platform][s.metric] = { value: s.value, recordedAt: s.recordedAt.toISOString() }
    }
  }

  return NextResponse.json({ byPlatform, latest, total: snapshots.length })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { platform, metric, value } = body

    if (!platform || !metric || typeof value !== 'number') {
      return NextResponse.json({ error: 'platform, metric, value (number) required' }, { status: 400 })
    }

    const snap = await db.analyticsSnapshot.create({
      data: { platform, metric, value },
    })

    return NextResponse.json({ snapshot: snap })
  } catch (e: any) {
    console.error('analytics create error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to create analytics' }, { status: 500 })
  }
}
