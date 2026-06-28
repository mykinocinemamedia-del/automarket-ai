/**
 * Autonomous Trend Agent
 *
 * Monitors trends and suggests content ideas for the active project.
 * Uses Z.AI SDK's web_search if available, otherwise uses AI knowledge
 * to generate trend-based suggestions.
 */

import ZAI from 'z-ai-web-dev-sdk'
import { callAI, type BrandContext } from './ai'

let zaiInstance: any = null
async function getZAI() {
  if (!zaiInstance) {
    const ZAI_API_KEY = process.env.ZAI_API_KEY
    const ZAI_BASE_URL = process.env.ZAI_BASE_URL || 'https://api.z.ai/api/paas/v4'

    if (ZAI_API_KEY) {
      zaiInstance = new (ZAI as any)({ baseUrl: ZAI_BASE_URL, apiKey: ZAI_API_KEY })
    } else {
      try {
        zaiInstance = await ZAI.create()
      } catch (e) {
        zaiInstance = null
      }
    }
  }
  return zaiInstance
}

export interface Trend {
  topic: string
  why: string
  momentum: 'rising' | 'peak' | 'stable'
  platforms: string[]
}

export interface ContentSuggestion {
  id: string
  trendTopic: string
  title: string
  caption: string
  platform: string
  hashtags: string
  whyItWorks: string
  bestTimeToPost: string
  pillar: string
}

/**
 * Try to search the web for current trends using Z.AI web_search.
 * If Z.AI is not configured, fall back to AI-generated trend knowledge.
 */
export async function searchTrends(
  industry: string,
  audience: string,
  platforms: string[]
): Promise<string> {
  // Try Z.AI web_search first
  try {
    const zai = await getZAI()
    if (zai) {
      const query = `What are the current trending topics, hashtags, and content ideas in ${industry} for ${audience} on ${platforms.join(', ')}? Include specific trending hashtags, viral content formats, and emerging conversations. Focus on trends from the last 7 days.`

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'assistant',
            content: 'You are a trend researcher. Use web_search to find current, real-time trends. Return a concise summary of the top 5-8 trending topics relevant to the query. For each trend, include: the topic, why it\'s trending, and which platforms it\'s popular on. Format as a simple list.',
          },
          { role: 'user', content: query },
        ],
        thinking: { type: 'disabled' },
        temperature: 0.7,
        max_tokens: 2000,
        tools: [{ type: 'web_search' }],
      })

      const result = completion.choices?.[0]?.message?.content || ''
      if (result) return result
    }
  } catch (e) {
    console.log('Z.AI web_search not available, falling back to AI knowledge:', e)
  }

  // Fallback: Use AI knowledge to generate trends
  const systemPrompt = `You are a trend researcher for social media marketing. Based on your knowledge of current trends (as of 2025-2026), list the top 6-8 trending topics, hashtags, and content formats relevant to the query.

For each trend, include:
- The topic/hashtag
- Why it's trending
- Which platforms it works best on
- Momentum (rising, peak, or stable)

Format as a simple numbered list.`

  const userPrompt = `Industry: ${industry}
Target audience: ${audience}
Platforms: ${platforms.join(', ')}

What are the current trending topics, hashtags, and content ideas in this space?`

  return await callAI(systemPrompt, userPrompt, { temperature: 0.7, maxTokens: 2000 })
}

/**
 * Generate content suggestions based on trends + brand context
 */
export async function generateTrendBasedSuggestions(opts: {
  trendData: string
  brandCtx: BrandContext
  platform?: string
  count?: number
}): Promise<ContentSuggestion[]> {
  const { trendData, brandCtx, platform, count = 5 } = opts

  const systemPrompt = `You are a content strategist who creates trendy, relevant social media posts.

Brand context:
${JSON.stringify(brandCtx, null, 2)}

Current trends research:
${trendData}

Generate ${count} content suggestions that combine the trends with the brand's voice and audience.

Return ONLY a valid JSON array (no markdown, no explanation). Each item must have:
{
  "title": "Short title (3-5 words)",
  "caption": "Full caption ready to post (with emojis, line breaks, CTA)",
  "platform": "${platform || 'instagram'}",
  "hashtags": "#tag1 #tag2 #tag3",
  "whyItWorks": "1-2 sentences explaining why this angle will resonate",
  "bestTimeToPost": "HH:MM (24h format)",
  "pillar": "Education|Promotion|Engagement|Behind the Scenes|Trend Jacking",
  "trendTopic": "Which trend from the research this leverages"
}

Rules:
- Each suggestion must leverage a DIFFERENT trend
- Match the brand voice precisely
- Platform-appropriate length (IG: 150-300 chars, LI: 200-600 chars, TW: <280 chars)
- Include a mix of content pillars
- Use the brand's language style (BM/English mix if applicable)
- Make captions genuinely good — not generic`

  const userPrompt = `Generate ${count} trend-based content suggestions now. Return ONLY the JSON array.`

  const raw = await callAI(systemPrompt, userPrompt, { temperature: 0.9, maxTokens: 6000 })

  // Parse JSON from response
  let jsonStr = raw.trim()
  // Remove markdown code fences if present
  jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')

  try {
    const suggestions = JSON.parse(jsonStr) as ContentSuggestion[]
    return suggestions.map((s, i) => ({
      ...s,
      id: `suggestion-${Date.now()}-${i}`,
    }))
  } catch (e) {
    console.error('Failed to parse suggestions JSON:', e)
    // Try to extract JSON array from text
    const match = raw.match(/\[[\s\S]*\]/)
    if (match) {
      try {
        const suggestions = JSON.parse(match[0]) as ContentSuggestion[]
        return suggestions.map((s, i) => ({
          ...s,
          id: `suggestion-${Date.now()}-${i}`,
        }))
      } catch (e2) {
        console.error('Secondary parse failed:', e2)
      }
    }
    return []
  }
}

/**
 * Full autonomous cycle: search trends → generate suggestions
 * Called by the /api/trends/suggest endpoint
 */
export async function runTrendCycle(opts: {
  brandCtx: BrandContext
  platforms: string[]
  count?: number
}): Promise<{
  trends: string
  suggestions: ContentSuggestion[]
}> {
  const { brandCtx, platforms, count = 5 } = opts

  // Step 1: Search for trends (web search or AI knowledge)
  const trendData = await searchTrends(
    brandCtx.industry || 'general business',
    brandCtx.targetAudience || 'general audience',
    platforms
  )

  // Step 2: Generate suggestions based on trends
  const suggestions = await generateTrendBasedSuggestions({
    trendData,
    brandCtx,
    count,
  })

  return {
    trends: trendData,
    suggestions,
  }
}
