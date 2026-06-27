import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const platform = searchParams.get('platform')
    const brandId = searchParams.get('brandId')

    let query = supabase.from(TABLES.CONTENT_POSTS).select('*')
    if (status) query = query.eq('status', status)
    if (platform) query = query.eq('platform', platform)
    if (brandId) query = query.eq('brandId', brandId)
    query = query.order('createdAt', { ascending: false }).limit(200)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ posts: data || [] })
  } catch (e: any) {
    console.error('posts GET error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, body: postBody, platform, status, hashtags, scheduledAt, brandId, assetUrls } = body

    if (!title || !postBody || !platform) {
      return NextResponse.json({ error: 'title, body, platform are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from(TABLES.CONTENT_POSTS)
      .insert({
        title,
        body: postBody,
        platform,
        status: status || 'draft',
        hashtags: hashtags || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        brandId: brandId || null,
        assetUrls: assetUrls || null,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ post: data })
  } catch (e: any) {
    console.error('posts POST error:', e)
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
    if (data.scheduledAt) updateData.scheduledAt = new Date(data.scheduledAt).toISOString()
    if (data.publishedAt) updateData.publishedAt = new Date(data.publishedAt).toISOString()

    const { data: updated, error } = await supabase
      .from(TABLES.CONTENT_POSTS)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ post: updated })
  } catch (e: any) {
    console.error('posts PATCH error:', e)
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

    const { error } = await supabase.from(TABLES.CONTENT_POSTS).delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('posts DELETE error:', e)
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  }
}
