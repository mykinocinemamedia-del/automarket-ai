import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const snapshots = await db.analyticsSnapshot.findMany({
    orderBy: { recordedAt: 'desc' },
    take: 1000,
  })

  return NextResponse.json({ snapshots })
}
