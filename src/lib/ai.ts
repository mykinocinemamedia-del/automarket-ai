import ZAI from 'z-ai-web-dev-sdk'

let zaiInstance: any = null

export async function getAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

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

export async function generateCaption(opts: {
  topic: string
  platform: string
  brandCtx: BrandContext
  additionalInstructions?: string
  count?: number
}): Promise<string[]> {
  const zai = await getAI()
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

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: `Generate ${count} caption variants now. Separate them with ===VARIANT=== on its own line.` },
    ],
    thinking: { type: 'disabled' },
    temperature: 0.85,
  })

  const raw = completion.choices[0]?.message?.content || ''
  // Try multiple separators the model might use
  let parts: string[] = []
  if (raw.includes('===VARIANT===')) {
    parts = raw.split(/={0,5}VARIANT={0,5}/)
  } else if (raw.includes('---VARIANT---')) {
    parts = raw.split(/---VARIANT---/)
  } else if (/^\s*---\s*$/m.test(raw)) {
    // Fallback: --- on its own line
    parts = raw.split(/^\s*---\s*$/m)
  } else if (/^\s*##\s+/m.test(raw)) {
    // Fallback: ## headers
    parts = raw.split(/^\s*##\s+/m).filter((s: string) => s.trim())
  } else if (/^\s*\d+[.)]\s+/m.test(raw)) {
    // Fallback: numbered list 1. 2. 3.
    parts = raw.split(/^\s*\d+[.)]\s+/m).filter((s: string) => s.trim())
  } else {
    parts = [raw]
  }

  return parts
    .map((s: string) => s.trim())
    .filter(Boolean)
    .slice(0, count)
}

export async function generateHashtags(opts: {
  topic: string
  platform: string
  brandCtx: BrandContext
  count?: number
}): Promise<string[]> {
  const zai = await getAI()
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

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: `Generate ${finalCount} hashtags now.` },
    ],
    thinking: { type: 'disabled' },
    temperature: 0.7,
  })

  const raw = completion.choices[0]?.message?.content || ''
  return raw
    .split('\n')
    .map((s: string) => s.trim())
    .filter((s: string) => s.startsWith('#'))
    .slice(0, finalCount)
}

export async function repurposeContent(opts: {
  sourceContent: string
  targetPlatforms: string[]
  brandCtx: BrandContext
}): Promise<Record<string, string>> {
  const zai = await getAI()
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

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: 'Repurpose the content now.' },
    ],
    thinking: { type: 'disabled' },
    temperature: 0.75,
  })

  const raw = completion.choices[0]?.message?.content || ''
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

export async function generateContentIdeas(opts: {
  brandCtx: BrandContext
  pillarTopics?: string[]
  count?: number
}): Promise<string[]> {
  const zai = await getAI()
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

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: `Generate ${count} content ideas now.` },
    ],
    thinking: { type: 'disabled' },
    temperature: 0.9,
  })

  const raw = completion.choices[0]?.message?.content || ''
  return raw
    .split('\n')
    .map((s: string) => s.trim())
    .filter(Boolean)
    .slice(0, count)
}
