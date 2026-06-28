import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { generateCampaign, type CampaignContext, type GeneratedPost } from '@/lib/agent'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { context, strategy, projectId } = body as {
      context: CampaignContext
      strategy: string
      projectId?: string
    }

    if (!context || !strategy) {
      return NextResponse.json({ error: 'context and strategy are required' }, { status: 400 })
    }
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
    }

    // Fetch brand if exists for this project (to get brandId for posts)
    let brandId: string | null = null
    const { data: brand } = await supabase
      .from(TABLES.BRAND_PROFILES)
      .select('id')
      .eq('projectId', projectId)
      .limit(1)
      .single()

    if (brand) {
      brandId = brand.id
    }

    // Generate all posts
    const posts = await generateCampaign(context, strategy)

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'No posts were generated. Please try again.' },
        { status: 500 }
      )
    }

    // Convert to database format & save to Supabase
    const now = new Date()
    const postsToInsert = posts.map((post: GeneratedPost) => {
      const scheduledDate = new Date(now)
      scheduledDate.setDate(scheduledDate.getDate() + (post.dayOffset || 1))

      // Parse time slot
      const [hours, minutes] = (post.timeSlot || '08:00').split(':').map(Number)
      scheduledDate.setHours(hours || 8, minutes || 0, 0, 0)

      return {
        title: post.title,
        body: post.body,
        platform: post.platform,
        status: 'scheduled',
        hashtags: post.hashtags || null,
        scheduledAt: scheduledDate.toISOString(),
        brandId: brandId,
        projectId,
      }
    })

    // Insert in batches of 10 (Supabase batch limit)
    const inserted: any[] = []
    for (let i = 0; i < postsToInsert.length; i += 10) {
      const batch = postsToInsert.slice(i, i + 10)
      const { data, error } = await supabase
        .from(TABLES.CONTENT_POSTS)
        .insert(batch)
        .select()

      if (error) {
        console.error('Insert error:', error)
      } else if (data) {
        inserted.push(...data)
      }
    }

    return NextResponse.json({
      success: true,
      totalGenerated: posts.length,
      totalSaved: inserted.length,
      posts: inserted,
    })
  } catch (e: any) {
    console.error('agent generate error:', e)
    return NextResponse.json(
      { error: e?.message || 'Failed to generate campaign' },
      { status: 500 }
    )
  }
}
