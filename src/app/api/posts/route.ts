import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const platform = searchParams.get('platform')
  const brandId = searchParams.get('brandId')

  const where: any = {}
  if (status) where.status = status
  if (platform) where.platform = platform
  if (brandId) where.brandId = brandId

  const posts = await db.contentPost.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({ posts })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, body: postBody, platform, status, hashtags, scheduledAt, brandId, assetUrls } = body

    if (!title || !postBody || !platform) {
      return NextResponse.json({ error: 'title, body, platform are required' }, { status: 400 })
    }

    const post = await db.contentPost.create({
      data: {
        title,
        body: postBody,
        platform,
        status: status || 'draft',
        hashtags: hashtags || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        brandId: brandId || null,
        assetUrls: assetUrls || null,
      },
    })

    return NextResponse.json({ post })
  } catch (e: any) {
    console.error('post create error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to create post' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updateData: any = { ...data }
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt)
    if (data.publishedAt) updateData.publishedAt = new Date(data.publishedAt)

    const post = await db.contentPost.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ post })
  } catch (e: any) {
    console.error('post update error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await db.contentPost.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('post delete error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to delete post' }, { status: 500 })
  }
}
