/**
 * Context-Aware Floating Assistant
 *
 * An autonomous AI agent that floats on every page, understands the current
 * page context, and can assist the user with page-specific actions.
 * Enforces human-like copywriting rules.
 */

import { callAI } from './ai'
import { COPYWRITING_RULES, getPageContext, type PageContext } from './copywriting-rules'
import { supabase, TABLES } from './supabase'

export interface AssistantMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  action?: AssistantAction
}

export interface AssistantAction {
  type: 'navigate' | 'fill_form' | 'generate_content' | 'show_suggestion' | 'open_dialog'
  target?: string
  data?: any
  label: string
}

interface AssistantContext {
  pageContext: PageContext
  brandCtx?: {
    name?: string
    industry?: string
    audience?: string
    brandVoice?: string
  }
  projectId?: string
  recentPosts?: any[]
}

const ASSISTANT_SYSTEM_PROMPT = `${COPYWRITING_RULES}

## YOUR ROLE
You are the AutoMarket AI Assistant — a floating helper that lives on every page of a marketing app. You understand what page the user is on and what they're trying to do. You help them by:

1. Answering questions about the current page
2. Suggesting actions they can take
3. Generating content that follows the HUMAN WRITING RULES above
4. Offering to auto-fill forms or generate content for empty boxes

## BEHAVIOR RULES
- Keep responses SHORT (2-4 sentences max for chat)
- Be proactive — suggest the next action
- When generating content, ALWAYS follow the copywriting rules
- Never say "As an AI..." or "I'd be happy to help..." — just help
- Use the brand's voice and language style
- If the user asks for content, generate it immediately (don't ask clarifying questions unless critical info is missing)
- Reference the current page context in your responses

## ACTION CAPABILITIES
You can suggest actions by including a special JSON block at the end of your response:
[ACTION:{"type":"navigate","target":"calendar","label":"Go to Calendar"}]
[ACTION:{"type":"fill_form","target":"caption_input","data":"generated caption text","label":"Fill Caption"}]
[ACTION:{"type":"generate_content","target":"caption","data":{"topic":"...","platform":"instagram"},"label":"Generate Caption"}]
[ACTION:{"type":"show_suggestion","target":"trending","data":"suggestion text","label":"Show Trend"}]

Only include an action if it's relevant. Most responses won't have actions.`

/**
 * Get context for the assistant based on current page and project
 */
async function buildContext(section: string, projectId?: string): Promise<AssistantContext> {
  const pageContext = getPageContext(section)

  let brandCtx
  let recentPosts

  if (projectId) {
    const { data: brand } = await supabase
      .from(TABLES.BRAND_PROFILES)
      .select('name, industry, targetAudience, brandVoice')
      .eq('projectId', projectId)
      .limit(1)
      .single()

    if (brand) {
      brandCtx = {
        name: brand.name,
        industry: brand.industry || undefined,
        audience: brand.targetAudience || undefined,
        brandVoice: brand.brandVoice || undefined,
      }
    }

    const { data: posts } = await supabase
      .from(TABLES.CONTENT_POSTS)
      .select('title, platform, status, createdAt')
      .eq('projectId', projectId)
      .order('createdAt', { ascending: false })
      .limit(5)

    recentPosts = posts || []
  }

  return {
    pageContext,
    brandCtx,
    projectId,
    recentPosts,
  }
}

/**
 * Chat with the assistant — context-aware
 */
export async function chatWithAssistant(opts: {
  messages: AssistantMessage[]
  section: string
  projectId?: string
}): Promise<{ response: string; action?: AssistantAction }> {
  const { messages, section, projectId } = opts
  const context = await buildContext(section, projectId)

  const contextPrompt = `
CURRENT PAGE CONTEXT:
- Page: ${context.pageContext.sectionLabel}
- Description: ${context.pageContext.description}
- Available actions on this page: ${context.pageContext.availableActions.join(', ')}

${context.brandCtx ? `
ACTIVE BRAND:
- Name: ${context.brandCtx.name}
- Industry: ${context.brandCtx.industry || 'Not set'}
- Audience: ${context.brandCtx.audience || 'Not set'}
- Voice: ${context.brandCtx.brandVoice || 'Not set'}
` : ''}
${context.recentPosts?.length ? `
RECENT POSTS (last 5):
${context.recentPosts.map((p) => `- "${p.title}" (${p.platform}, ${p.status})`).join('\n')}
` : ''}

CONVERSATION:
${messages.map((m) => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`).join('\n\n')}

ASSISTANT:`

  const response = await callAI(
    ASSISTANT_SYSTEM_PROMPT,
    contextPrompt,
    { temperature: 0.8, maxTokens: 1500 }
  )

  // Extract action if present
  const actionMatch = response.match(/\[ACTION:({[^}]+})\]/)
  let action: AssistantAction | undefined
  let cleanResponse = response

  if (actionMatch) {
    try {
      action = JSON.parse(actionMatch[1])
      cleanResponse = response.replace(actionMatch[0], '').trim()
    } catch (e) {
      // Invalid action JSON, ignore
    }
  }

  return { response: cleanResponse, action }
}

/**
 * Generate content for a specific page action
 * Used when the assistant triggers a "fill_form" or "generate_content" action
 */
export async function generateForPage(opts: {
  section: string
  action: string
  projectId?: string
  additionalContext?: string
}): Promise<string> {
  const { section, action, projectId, additionalContext } = opts
  const context = await buildContext(section, projectId)

  const systemPrompt = `${COPYWRITING_RULES}

You are generating content for the ${context.pageContext.sectionLabel} page.
Action requested: ${action}

${context.brandCtx ? `Brand: ${context.brandCtx.name} (${context.brandCtx.industry})
Voice: ${context.brandCtx.brandVoice || 'Not set'}
Audience: ${context.brandCtx.audience || 'Not set'}` : ''}

${additionalContext ? `Additional context: ${additionalContext}` : ''}

Generate the content following ALL the human writing rules. Output ONLY the content, no explanations.`

  const userPrompt = `Generate: ${action}`

  return await callAI(systemPrompt, userPrompt, { temperature: 0.85, maxTokens: 1000 })
}
