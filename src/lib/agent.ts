/**
 * AutoMarket AI Agent — Conversational campaign generator
 *
 * Flow:
 * 1. Discovery: AI asks questions to understand the brand
 * 2. Strategy: AI proposes content strategy
 * 3. Generation: AI generates 30 days of content & auto-saves to DB
 *
 * Supports Groq (preferred) and Gemini (fallback)
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

const USE_GROQ = !!GROQ_API_KEY

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface CampaignContext {
  brandName?: string
  industry?: string
  audience?: string
  usp?: string
  brandVoice?: string
  platforms?: string[]
  goal?: string
  events?: string
  budget?: string
}

export interface GeneratedPost {
  title: string
  body: string
  platform: string
  hashtags: string
  dayOffset: number
  timeSlot: string
  pillar: string
}

const AGENT_SYSTEM_PROMPT = `You are AutoMarket AI Agent, an expert marketing strategist and content creator. Your job is to help the user plan a FULL MONTH of social media content through natural conversation.

You operate in 3 phases:

## PHASE 1 — DISCOVERY
Ask questions ONE AT A TIME to gather:
1. Company/brand name
2. Industry/niche
3. Target audience (demographics, interests, pain points)
4. Unique selling proposition (USP) — what makes them different
5. Brand voice/tone (professional, casual, playful, authoritative, etc.)
6. Preferred platforms (Instagram, Facebook, LinkedIn, Twitter, TikTok — pick 2-4)
7. Main goal for the month (sales, brand awareness, product launch, engagement, etc.)
8. Any specific dates, events, launches, or promotions coming up
9. Budget/resources (do they have images? video? just text?)

Rules for Phase 1:
- Ask ONE question at a time — NEVER list multiple questions
- Be conversational, warm, and genuinely curious
- Acknowledge each answer briefly before asking the next question
- If an answer is vague, ask a follow-up to get specifics
- Use Malaysian-English mix if the user speaks that way
- Keep your responses SHORT (2-4 sentences max)
- Skip questions the user already answered in their opening message

## PHASE 2 — STRATEGY
Once you have all the info (or the user says "that's all"), propose a strategy:
- 3-5 content pillars/themes (e.g., "Education", "Behind the Scenes", "Customer Stories", "Promotional", "Engagement")
- Posting frequency per platform (e.g., "Instagram: 4x/week, LinkedIn: 2x/week")
- Content mix percentages
- Key dates to highlight

Format as a clean summary. Ask: "Does this strategy look good? Should I generate the full month of content?"

## PHASE 3 — READY
When the user approves, respond with EXACTLY this format:
"READY_TO_GENERATE

[brief summary of what will be created — e.g., "I'll create 30 posts across Instagram and LinkedIn, spread across 4 weeks, covering 5 content pillars."]"

IMPORTANT RULES:
- Never generate posts in chat — that happens separately
- Always ask before moving to the next phase
- If the user wants changes, adjust and re-confirm
- Be encouraging and professional
- Adapt to the user's communication style`

const GENERATION_SYSTEM_PROMPT = `You are a content generation engine. Generate social media posts based on the brand context and strategy provided.

OUTPUT FORMAT — Return ONLY a valid JSON array. No markdown, no explanation, no code blocks. Just the raw JSON array:

[
  {
    "title": "Short internal title (3-5 words)",
    "body": "Full caption with emojis, line breaks, and call-to-action",
    "platform": "instagram",
    "hashtags": "#tag1 #tag2 #tag3",
    "dayOffset": 1,
    "timeSlot": "08:00",
    "pillar": "Education"
  }
]

RULES:
1. Each post must be UNIQUE in angle, hook, and content
2. Match the brand voice EXACTLY
3. Platform-specific lengths:
   - Instagram: 150-300 chars, emoji-rich, hook first line, CTA at end
   - Facebook: 100-500 chars, conversational
   - LinkedIn: 200-600 chars, professional, value-driven
   - Twitter: under 280 chars, punchy
   - TikTok: 100-200 chars, casual, hook-oriented
4. Hashtags: platform-appropriate count (IG: 8-15, FB: 3-5, LI: 3-5, TW: 2-3, TT: 5-10)
5. dayOffset: days from TODAY (1 = tomorrow, 7 = next week, etc.)
6. timeSlot: HH:MM format (24h). Use these slots: 08:00, 12:00, 15:00, 18:00, 20:00
7. Spread posts naturally — don't cluster all on the same day
8. Mix content pillars throughout the period
9. Include variety: questions, stories, tips, promos, behind-the-scenes
10. Use the brand's language style (BM/English mix if applicable)
11. Every post must have a clear purpose (educate, engage, promote, or inspire)
12. Don't repeat the same hook or opening line across posts`

async function callAI(prompt: string, systemPrompt: string, temperature = 0.85): Promise<string> {
  if (USE_GROQ) {
    // Groq (OpenAI-compatible)
    if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY is not set')

    const res = await fetch(GROQ_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: 8192,
      }),
    })

    if (!res.ok) {
      let errMsg = `Groq API error ${res.status}`
      try {
        const errBody = await res.json()
        errMsg = errBody?.error?.message || errMsg
      } catch {}
      throw new Error(errMsg)
    }

    const data = await res.json()
    return data.choices?.[0]?.message?.content || ''
  } else {
    // Gemini fallback
    if (!GEMINI_API_KEY) throw new Error('GROQ_API_KEY or GEMINI_API_KEY is not set')

    const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
    const fullPrompt = `${systemPrompt}\n\n---\n\n${prompt}`

    const body = {
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: 8192,
        topP: 0.95,
        topK: 40,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      let errMsg = `Gemini API error ${res.status}`
      try {
        const errBody = await res.json()
        errMsg = errBody?.error?.message || errMsg
      } catch {}
      throw new Error(errMsg)
    }

    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }
}

/**
 * Chat with the agent — takes conversation history and returns AI response
 */
export async function chatWithAgent(
  messages: ChatMessage[],
  brandContext?: CampaignContext
): Promise<string> {
  // Build conversation context
  let conversationContext = ''

  if (brandContext && Object.keys(brandContext).length > 0) {
    conversationContext += '\n\nEXISTING BRAND CONTEXT (from brand profile):\n'
    if (brandContext.brandName) conversationContext += `Brand: ${brandContext.brandName}\n`
    if (brandContext.industry) conversationContext += `Industry: ${brandContext.industry}\n`
    if (brandContext.audience) conversationContext += `Audience: ${brandContext.audience}\n`
    if (brandContext.brandVoice) conversationContext += `Voice: ${brandContext.brandVoice}\n`
    conversationContext += '\nUse this info if relevant. Ask about anything missing.\n'
  }

  // Build conversation history
  const history = messages
    .map((m) => `${m.role === 'user' ? 'USER' : 'ASSISTANT'}: ${m.content}`)
    .join('\n\n')

  const prompt = `${conversationContext}\n\nCONVERSATION:\n${history}\n\nASSISTANT:`

  return await callAI(prompt, AGENT_SYSTEM_PROMPT, 0.85)
}

/**
 * Generate a full month of campaign content in batches
 * Returns array of generated posts
 */
export async function generateCampaign(
  context: CampaignContext,
  strategy: string,
  onProgress?: (step: string, detail: string) => void
): Promise<GeneratedPost[]> {
  const allPosts: GeneratedPost[] = []

  // Generate 4 weeks of content (7-8 posts per week)
  const weeks = [
    { name: 'Week 1', days: 'days 1-7', count: 8 },
    { name: 'Week 2', days: 'days 8-14', count: 7 },
    { name: 'Week 3', days: 'days 15-21', count: 7 },
    { name: 'Week 4', days: 'days 22-30', count: 8 },
  ]

  const brandSummary = `
BRAND: ${context.brandName || 'N/A'}
INDUSTRY: ${context.industry || 'N/A'}
AUDIENCE: ${context.audience || 'N/A'}
USP: ${context.usp || 'N/A'}
BRAND VOICE: ${context.brandVoice || 'N/A'}
PLATFORMS: ${context.platforms?.join(', ') || 'instagram, facebook'}
GOAL: ${context.goal || 'N/A'}
EVENTS: ${context.events || 'None'}
`

  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i]
    onProgress?.(`Generating ${week.name}`, `Creating ${week.count} posts for ${week.days}...`)

    const prompt = `Generate ${week.count} social media posts for ${week.name} (${week.days} from today).

${brandSummary}

STRATEGY:
${strategy}

REQUIREMENTS:
- Generate exactly ${week.count} posts
- Spread across ${week.days}
- Distribute across platforms: ${context.platforms?.join(', ') || 'instagram, facebook'}
- Vary content pillars from the strategy
- Each post must be unique

Return ONLY the JSON array. No other text.`

    try {
      const response = await callAI(prompt, GENERATION_SYSTEM_PROMPT, 0.9)

      // Parse JSON from response (handle markdown code blocks if present)
      let jsonStr = response.trim()
      // Remove markdown code fences if present
      jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')

      const posts = JSON.parse(jsonStr) as GeneratedPost[]

      if (Array.isArray(posts)) {
        allPosts.push(...posts)
        onProgress?.(`${week.name} complete`, `${posts.length} posts generated`)
      }
    } catch (e: any) {
      console.error(`Generation error for ${week.name}:`, e)
      onProgress?.(`${week.name} error`, e.message)
      // Continue with other weeks even if one fails
    }
  }

  return allPosts
}

/**
 * Check if the agent's response indicates readiness to generate
 */
export function isReadyToGenerate(response: string): boolean {
  return response.includes('READY_TO_GENERATE')
}

/**
 * Extract the summary from a READY_TO_GENERATE response
 */
export function extractReadySummary(response: string): string {
  const parts = response.split('READY_TO_GENERATE')
  return parts[1]?.trim() || 'Ready to generate your campaign.'
}
