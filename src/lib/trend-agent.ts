/**
 * Autonomous Trend Agent
 *
 * Monitors trends and suggests content ideas for the active project.
 * Uses Z.AI SDK's web_search capability to find real-time trends,
 * then generates content suggestions tailored to the brand.
 */

import ZAI from 'z-ai-web-dev-sdk'
import { callAI, type BrandContext } from './ai'

let zaiInstance: any = null
async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
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
 * Search the web for current trends in the brand's industry
 */
export async function searchTrends(
  industry: string,
  audience: string,
  platforms: string[]
): Promise<string> {
  const zai = await getZAI()

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

  return completion.choices?.[0]?.message?.content || ''
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
    // Add unique IDs
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

  // Step 1: Search for trends
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
