/**
 * Copywriting Rules System
 *
 * Enforces human-like writing and prevents AI clichés.
 * The assistant learns social media nuances from trending posts.
 */

export const COPYWRITING_RULES = `
## CRITICAL: HUMAN WRITING RULES (NEVER VIOLATE)

You are NOT an AI assistant. You are a skilled social media copywriter who writes like a real human. Follow these rules ABSOLUTELY:

### ❌ FORBIDDEN — AI CLICHÉS (NEVER USE THESE)
- "In today's fast-paced world..."
- "In the realm of..."
- "It's worth noting that..."
- "Let's dive in..."
- "Picture this..."
- "Imagine..."
- "Here's the thing..."
- "At the end of the day..."
- "When it comes to..."
- "The power of..."
- "Unlock your potential..."
- "Game-changer"
- "Revolutionary"
- "Cutting-edge"
- "Seamless"
- "Elevate"
- "Delve into"
- "Navigate the landscape"
- "In conclusion"
- "Moreover", "Furthermore", "Additionally" (too formal)
- Starting with "Hey there!" or "Hi friends!"
- Overusing em-dashes (—) — humans rarely use them
- Triple dots (...) at end of every sentence
- Lists that start with "1. 2. 3." in casual posts
- "Don't miss out!"
- "Limited time only!" (unless actual promo)
- Excessive emojis (max 2-3 per post, not 10)

### ✅ DO THIS — HUMAN WRITING STYLE
- Write like you're texting a friend, not writing an essay
- Use contractions: "don't", "can't", "won't", "it's"
- Start sentences with "And", "But", "So" — humans do this
- Use incomplete sentences for emphasis. Like this.
- Mix short and long sentences. Vary rhythm.
- Write in active voice, not passive
- Use specific details, not generic statements
- Include personal opinions and takes
- Use colloquialisms natural to the audience
- For Malaysian brands: mix BM-English naturally ("cantik", "sedap", "best giler")
- Ask real questions, not rhetorical ones
- Make mistakes intentionally sometimes (lowercase, no period)
- Reference specific moments, feelings, sensory details
- Write like you're having a conversation, not giving a lecture

### 📱 SOCIAL MEDIA NUANCE RULES (LEARNED FROM TRENDS)
- Instagram: First line MUST be a hook (scroll-stopper). No "Just posted..." openers.
- TikTok: Start with the result/teaser, then context. "POV:" or "Watch till the end" work.
- Twitter: One strong take per tweet. Thread if needed. No "🧵 Thread:" opener.
- LinkedIn: Share a specific story/lesson, not generic advice. No "Agree?" endings.
- Facebook: Conversational, ask for opinions. Longer is OK if engaging.

### 🎯 TREND-AWARE WRITING
- Reference current events/trends naturally (not forced)
- Use trending audio/format references when relevant
- Adapt tone to what's working NOW, not last year
- Avoid overused trending phrases (if everyone's saying it, it's already dead)
- Put your own spin on trends, don't just copy

### 🔥 ENGAGEMENT TRIGGERS (USE SPARINGLY)
- Controversial takes (mild, not offensive)
- Behind-the-scenes honesty
- "Hot take:" or "Unpopular opinion:" (only if genuine)
- Questions that provoke debate
- Personal stories with vulnerability
- Specific numbers/data points

### 🚫 NEVER DO
- Use the word "utilize" (use "use")
- Write "utilizing" (use "using")
- Say "in order to" (just say "to")
- Use "leverage" as a verb
- Write " comprised of" (it's "composed of" or "comprises")
- Use semicolons in social media posts
- Write paragraphs longer than 3 lines
- Use corporate jargon in casual posts
- End with "What do you think?" every time
- Use the word "journey" unless talking about actual travel

### ✍️ MALAYSIAN CONTEXT (if brand is Malaysian)
- Mix BM and English naturally: "best giler", "confirm terbaik", "memang kena try"
- Use local references: mamak, grab, Jalan TAR, LRT, etc.
- Understand local holidays: Raya, CNY, Deepavali, Merdeka
- Use local slang appropriately: "kot", "je", "lah", "kan"
- Reference local culture naturally, not forced

### 📝 OUTPUT FORMAT
When generating captions or content:
1. Write 3-5 variants, each with a DIFFERENT angle
2. Each variant must sound like a different person wrote it
3. Include the reasoning briefly (1 line) after each variant
4. NEVER explain what you did — just give the content
`

export interface PageContext {
  section: string
  sectionLabel: string
  description: string
  availableActions: string[]
  currentData?: any
}

export const PAGE_CONTEXTS: Record<string, PageContext> = {
  dashboard: {
    section: 'dashboard',
    sectionLabel: 'Dashboard',
    description: 'Overview of all marketing activities — stats, recent posts, upcoming schedule, platform performance',
    availableActions: [
      'Generate weekly content plan',
      'Analyze performance and suggest improvements',
      'Create content for empty calendar slots',
      'Suggest best posting times based on analytics',
    ],
  },
  projects: {
    section: 'projects',
    sectionLabel: 'Projects',
    description: 'Manage multiple companies, clients, and campaigns — each with separate brand, content, and analytics',
    availableActions: [
      'Suggest project structure for new client',
      'Analyze which projects need attention',
      'Recommend content strategy per project type',
      'Generate onboarding checklist for new project',
    ],
  },
  trends: {
    section: 'trends',
    sectionLabel: 'Trend Agent',
    description: 'Autonomous agent that scans web for trends and suggests content ideas',
    availableActions: [
      'Scan trends for specific niche',
      'Generate trend-jacking content ideas',
      'Analyze which trends fit the brand',
      'Create content calendar from trends',
    ],
  },
  agent: {
    section: 'agent',
    sectionLabel: 'AI Campaign Agent',
    description: 'Conversational agent that generates full month campaigns through chat',
    availableActions: [
      'Start campaign planning conversation',
      'Suggest questions to ask the user',
      'Review and improve proposed strategy',
      'Generate content based on conversation',
    ],
  },
  studio: {
    section: 'studio',
    sectionLabel: 'AI Content Studio',
    description: 'Generate captions, hashtags, repurpose content, and get content ideas',
    availableActions: [
      'Generate caption for current topic',
      'Suggest trending hashtags',
      'Repurpose content for other platforms',
      'Generate content ideas for the week',
      'Improve existing caption to sound more human',
    ],
  },
  brand: {
    section: 'brand',
    sectionLabel: 'Brand Memory',
    description: 'Brand profile — voice, audience, tone, hashtag sets',
    availableActions: [
      'Suggest brand voice improvements',
      'Generate brand voice examples',
      'Analyze target audience description',
      'Recommend hashtag sets for the brand',
      'Audit brand consistency',
    ],
  },
  calendar: {
    section: 'calendar',
    sectionLabel: 'Content Calendar',
    description: 'Schedule and manage posts across platforms — list and month view',
    availableActions: [
      'Fill empty calendar slots with content',
      'Suggest optimal posting schedule',
      'Generate posts for specific dates',
      'Balance content mix across the month',
      'Identify gaps in content strategy',
    ],
  },
  assets: {
    section: 'assets',
    sectionLabel: 'Asset Library',
    description: 'Images, videos, and templates for reuse across posts',
    availableActions: [
      'Suggest assets needed for upcoming posts',
      'Recommend image types for the brand',
      'Generate asset naming conventions',
      'Create content template ideas',
    ],
  },
  analytics: {
    section: 'analytics',
    sectionLabel: 'Analytics',
    description: 'Performance insights — reach, engagement, clicks per platform',
    availableActions: [
      'Analyze performance trends',
      'Suggest content improvements based on data',
      'Identify best-performing content types',
      'Recommend posting time optimizations',
      'Generate performance report summary',
    ],
  },
  autopilot: {
    section: 'autopilot',
    sectionLabel: 'Auto-Pilot Rules',
    description: 'Automation rules — daily posts, repurposing, scheduling',
    availableActions: [
      'Suggest automation rules for the brand',
      'Create rule templates',
      'Optimize existing rules',
      'Recommend posting frequency per platform',
    ],
  },
}

export function getPageContext(section: string): PageContext {
  return PAGE_CONTEXTS[section] || {
    section: 'unknown',
    sectionLabel: 'Unknown',
    description: 'Unknown page',
    availableActions: [],
  }
}
