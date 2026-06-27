import { NextRequest, NextResponse } from 'next/server'
import { supabase, TABLES } from '@/lib/supabase'
import { chatWithAgent, type ChatMessage, type CampaignContext } from '@/lib/agent'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, brandId } = body as { messages: ChatMessage[]; brandId?: string }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 })
    }

    // If brandId provided, fetch brand context
    let brandContext: CampaignContext | undefined
    if (brandId) {
      const { data: brand } = await supabase
        .from(TABLES.BRAND_PROFILES)
        .select('*')
        .eq('id', brandId)
        .single()

      if (brand) {
        brandContext = {
          brandName: brand.name,
          industry: brand.industry || undefined,
          audience: brand.targetAudience || undefined,
          brandVoice: brand.brandVoice || undefined,
        }
      }
    }

    const response = await chatWithAgent(messages, brandContext)

    return NextResponse.json({
      response,
      ready: response.includes('READY_TO_GENERATE'),
    })
  } catch (e: any) {
    console.error('agent chat error:', e)
    return NextResponse.json(
      { error: e?.message || 'Failed to chat with agent' },
      { status: 500 }
    )
  }
}
