import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const assets = await db.asset.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
  return NextResponse.json({ assets })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, type, url, tags, brandId } = body

    if (!name || !type || !url) {
      return NextResponse.json({ error: 'name, type, url are required' }, { status: 400 })
    }

    const asset = await db.asset.create({
      data: {
        name,
        type,
        url,
        tags: tags || null,
        brandId: brandId || null,
      },
    })

    return NextResponse.json({ asset })
  } catch (e: any) {
    console.error('asset create error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to create asset' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await db.asset.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('asset delete error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to delete asset' }, { status: 500 })
  }
}
