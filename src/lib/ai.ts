/**
 * AI integration — supports Groq (primary), Gemini (fallback)
 *
 * Groq: Free, fast (500+ tokens/sec), OpenAI-compatible API
 *   Free tier: 14,400 requests/day, 30 RPM
 *   Get key: https://console.groq.com/keys
 *
 * Gemini: Free, multimodal, but quota can be limited for new keys
 *   Get key: https://aistudio.google.com/app/apikey
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

// Auto-detect which provider to use (Groq preferred)
const USE_GROQ = !!GROQ_API_KEY

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Call Groq (OpenAI-compatible API)
 */
async function callGroq(
  messages: ChatMessage[],
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set')
  }

  const res = await fetch(GROQ_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: options.temperature ?? 0.85,
      max_tokens: options.maxTokens ?? 4096,
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
}

/**
 * Call Gemini (fallback)
 */
async function callGemini(
  prompt: string,
  systemPrompt: string,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set')
  }

  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
  const fullPrompt = `${systemPrompt}\n\n---\n\n${prompt}`

  const body = {
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: {
      temperature: options.temperature ?? 0.85,
      maxOutputTokens: options.maxTokens ?? 4096,
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

/**
 * Unified AI call — uses Groq if available, falls back to Gemini
 */
async function callAI(
  systemPrompt: string,
  userPrompt: string,
  options: { temperature?: number; maxTokens?: number } = {}
): Promise<string> {
  if (USE_GROQ) {
    return await callGroq(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options
    )
  } else if (GEMINI_API_KEY) {
    return await callGemini(userPrompt, systemPrompt, options)
  } else {
    throw new Error('No AI provider configured. Set GROQ_API_KEY or GEMINI_API_KEY environment variable.')
  }
}

export function getAIProvider(): string {
  return USE_GROQ ? 'Groq' : (GEMINI_API_KEY ? 'Gemini' : 'None')
}

// ============================================================
// Brand context helper
// ============================================================

export interface BrandContext {
  name?: string
  tagline?: string
  industry?: string
  targetAudience?: string
  brandVoice?: string
  toneKeywords?: string
}

export function buildBrandPrompt(ctx: BrandContext): string {
  const parts: string[] = []
  if (ctx.name) parts.push(`Brand name: ${ctx.name}`)
  if (ctx.tagline) parts.push(`Tagline: ${ctx.tagline}`)
  if (ctx.industry) parts.push(`Industry: ${ctx.industry}`)
  if (ctx.targetAudience) parts.push(`Target audience: ${ctx.targetAudience}`)
  if (ctx.brandVoice) parts.push(`Brand voice: ${ctx.brandVoice}`)
  if (ctx.toneKeywords) parts.push(`Tone: ${ctx.toneKeywords}`)
  return parts.length ? parts.join('\n') : 'No specific brand context provided.'
}

// ============================================================
// Caption generation
// ============================================================

export async function generateCaption(opts: {
  topic: string
  platform: string
  brandCtx: BrandContext
  additionalInstructions?: string
  count?: number
}): Promise<string[]> {
  const { topic, platform, brandCtx, additionalInstructions, count = 3 } = opts

  const platformSpecs: Record<string, string> = {
    instagram: 'Instagram (caption with emoji, 150-300 chars, hook in first line, call-to-action at end)',
    facebook: 'Facebook (conversational, 100-500 chars, engaging question)',
    linkedin: 'LinkedIn (professional, 200-600 chars, value-driven, no emoji spam)',
    twitter: 'Twitter/X (concise, under 280 chars, punchy)',
    tiktok: 'TikTok (casual, trendy, 100-200 chars, hook-oriented)',
  }

  const platformSpec = platformSpecs[platform] || platformSpecs.instagram

  const systemPrompt = `You are a world-class social media copywriter. Generate ${count} distinct caption variants for the requested platform.

Brand context:
${buildBrandPrompt(brandCtx)}

Platform spec: ${platformSpec}

Topic: ${topic}
${additionalInstructions ? `Extra instructions: ${additionalInstructions}` : ''}

Rules:
1. Each variant must be distinct in angle (e.g. story, benefit, question, bold claim)
2. Match the brand voice precisely
3. Use language natural to the target audience (mix English/BM if brand is Malaysian)
4. Return ONLY the captions, separated by the literal token ===VARIANT=== on its own line
5. No numbering, no prefixes, no explanations, no markdown
6. Each variant starts immediately after the ===VARIANT=== separator`

  const userPrompt = `Generate ${count} caption variants now. Separate them with ===VARIANT=== on its own line.`

  const raw = await callAI(systemPrompt, userPrompt, { temperature: 0.9, maxTokens: 4096 })

  // Try multiple separators the model might use
  let parts: string[] = []
  if (raw.includes('===VARIANT===')) {
    parts = raw.split(/={0,5}VARIANT={0,5}/)
  } else if (raw.includes('---VARIANT---')) {
    parts = raw.split(/---VARIANT---/)
  } else if (/^\s*---\s*$/m.test(raw)) {
    parts = raw.split(/^\s*---\s*$/m)
  } else if (/^\s*##\s+/m.test(raw)) {
    parts = raw.split(/^\s*##\s+/m).filter((s: string) => s.trim())
  } else if (/^\s*\d+[.)]\s+/m.test(raw)) {
    parts = raw.split(/^\s*\d+[.)]\s+/m).filter((s: string) => s.trim())
  } else {
    parts = [raw]
  }

  return parts
    .map((s: string) => s.trim())
    .filter(Boolean)
    .slice(0, count)
}

// ============================================================
// Hashtag generation
// ============================================================

export async function generateHashtags(opts: {
  topic: string
  platform: string
  brandCtx: BrandContext
  count?: number
}): Promise<string[]> {
  const { topic, platform, brandCtx, count = 15 } = opts

  const limits: Record<string, number> = {
    instagram: 30,
    facebook: 5,
    linkedin: 5,
    twitter: 3,
    tiktok: 20,
  }
  const maxForPlatform = limits[platform] || 10
  const finalCount = Math.min(count, maxForPlatform)

  const systemPrompt = `You are a hashtag strategist. Suggest ${finalCount} high-quality hashtags for ${platform}.

Brand context:
${buildBrandPrompt(brandCtx)}

Topic: ${topic}

Mix strategy:
- 30% broad/trending hashtags (high volume)
- 50% niche hashtags (medium volume, more targeted)
- 20% brand-specific hashtags

Rules:
1. Return ONLY hashtags, one per line, starting with #
2. No explanations, no numbering
3. No duplicates`

  const userPrompt = `Generate ${finalCount} hashtags now.`

  const raw = await callAI(systemPrompt, userPrompt, { temperature: 0.7, maxTokens: 1024 })

  return raw
    .split('\n')
    .map((s: string) => s.trim())
    .filter((s: string) => s.startsWith('#'))
    .slice(0, finalCount)
}

// ============================================================
// Content repurposing
// ============================================================

export async function repurposeContent(opts: {
  sourceContent: string
  targetPlatforms: string[]
  brandCtx: BrandContext
}): Promise<Record<string, string>> {
  const { sourceContent, targetPlatforms, brandCtx } = opts

  const platformSpecs: Record<string, string> = {
    instagram: 'Instagram: emoji-rich caption, 150-300 chars, hook first line, CTA at end',
    facebook: 'Facebook: conversational, 100-500 chars, engaging question',
    linkedin: 'LinkedIn: professional, 200-600 chars, value-driven, minimal emoji',
    twitter: 'Twitter/X: under 280 chars, punchy, single CTA',
    tiktok: 'TikTok: casual, 100-200 chars, hook-oriented',
  }

  const platformList = targetPlatforms
    .map((p) => `${p.toUpperCase()}:\n${platformSpecs[p] || platformSpecs.instagram}`)
    .join('\n\n')

  const systemPrompt = `You are a content repurposing expert. Take the source content and adapt it for each target platform, keeping the core message but matching each platform's voice and length conventions.

Brand context:
${buildBrandPrompt(brandCtx)}

Source content:
${sourceContent}

Target platforms and specs:
${platformList}

Output format (EXACTLY):
For each platform, output a header line "===PLATFORM===" (where PLATFORM is the platform name in uppercase) followed by the adapted caption on the next line(s). Separate platforms with a blank line. No other commentary.`

  const userPrompt = 'Repurpose the content now.'

  const raw = await callAI(systemPrompt, userPrompt, { temperature: 0.75, maxTokens: 4096 })
  const result: Record<string, string> = {}

  for (const platform of targetPlatforms) {
    const upper = platform.toUpperCase()
    const regex = new RegExp(`===${upper}===\\s*([\\s\\S]*?)(?===|$)`, 'i')
    const match = raw.match(regex)
    if (match && match[1]) {
      result[platform] = match[1].trim()
    }
  }

  return result
}

// ============================================================
// Content idea generation
// ============================================================

export async function generateContentIdeas(opts: {
  brandCtx: BrandContext
  pillarTopics?: string[]
  count?: number
}): Promise<string[]> {
  const { brandCtx, pillarTopics, count = 10 } = opts

  const systemPrompt = `You are a content strategy expert. Generate ${count} unique content post ideas for the brand.

Brand context:
${buildBrandPrompt(brandCtx)}

${pillarTopics?.length ? `Pillar topics to anchor ideas: ${pillarTopics.join(', ')}` : ''}

Each idea should include:
- A specific angle/hook (not generic)
- Brief description of what the post would cover
- Why it would resonate with the target audience

Format: One idea per line, no numbering, no preamble. Just the idea text.`

  const userPrompt = `Generate ${count} content ideas now.`

  const raw = await callAI(systemPrompt, userPrompt, { temperature: 0.95, maxTokens: 4096 })

  return raw
    .split('\n')
    .map((s: string) => s.trim())
    .filter(Boolean)
    .slice(0, count)
}

// ============================================================
// Backward compatibility
// ============================================================

export async function getAI() {
  return { callAI, getAIProvider }
}
