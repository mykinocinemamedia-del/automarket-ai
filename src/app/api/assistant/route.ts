import { NextRequest, NextResponse } from 'next/server'
import { chatWithAssistant, generateForPage } from '@/lib/assistant'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, section, projectId, action, additionalContext } = body

    // If action is provided, generate content for that action
    if (action && section) {
      const content = await generateForPage({
        section,
        action,
        projectId,
        additionalContext,
      })
      return NextResponse.json({ content })
    }

    // Otherwise, chat with the assistant
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 })
    }

    if (!section) {
      return NextResponse.json({ error: 'section is required' }, { status: 400 })
    }

    const result = await chatWithAssistant({
      messages,
      section,
      projectId,
    })

    return NextResponse.json({
      response: result.response,
      action: result.action,
    })
  } catch (e: any) {
    console.error('assistant error:', e)
    return NextResponse.json(
      { error: e?.message || 'Failed to get assistant response' },
      { status: 500 }
    )
  }
}
