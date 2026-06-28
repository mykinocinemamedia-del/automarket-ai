import { createClient } from '@supabase/supabase-js'

/**
 * Supabase REST API client — uses HTTPS port 443 (always reachable, unlike direct DB port 5432)
 *
 * Env vars:
 *  - NEXT_PUBLIC_SUPABASE_URL: Project URL (https://xxx.supabase.co)
 *  - SUPABASE_SERVICE_ROLE_KEY: Secret key with full access (server-only!)
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tgikwdngogwzpmbttjoc.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || 'sb_publishable_X5wuVZWmx3l3q_ncJUHLnA_Lvsrynod'

// Use service role key on server (bypasses RLS), anon key is fine for read-only demo data
export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: 'public' },
  global: { headers: { 'x-application-name': 'automarket-ai' } },
})

// Type definitions matching our Prisma schema
export interface Project {
  id: string
  name: string
  type: string // 'company' | 'client' | 'project'
  description: string | null
  color: string | null
  emoji: string | null
  createdAt: string
  updatedAt: string
}

export interface BrandProfile {
  id: string
  name: string
  tagline: string | null
  industry: string | null
  targetAudience: string | null
  brandVoice: string | null
  toneKeywords: string | null
  primaryColor: string | null
  logoUrl: string | null
  hashtagSets: string | null
  projectId: string | null
  createdAt: string
  updatedAt: string
}

export interface ContentPost {
  id: string
  title: string
  body: string
  platform: string
  status: string
  hashtags: string | null
  scheduledAt: string | null
  publishedAt: string | null
  brandId: string | null
  projectId: string | null
  assetUrls: string | null
  createdAt: string
  updatedAt: string
}

export interface Asset {
  id: string
  name: string
  type: string
  url: string
  tags: string | null
  brandId: string | null
  projectId: string | null
  createdAt: string
}

export interface AutomationRule {
  id: string
  name: string
  description: string | null
  trigger: string
  action: string
  config: string
  active: boolean
  lastRunAt: string | null
  projectId: string | null
  createdAt: string
  updatedAt: string
}

export interface AnalyticsSnapshot {
  id: string
  platform: string
  metric: string
  value: number
  projectId: string | null
  recordedAt: string
}

// Table name constants
export const TABLES = {
  PROJECTS: 'projects',
  BRAND_PROFILES: 'brand_profiles',
  CONTENT_POSTS: 'content_posts',
  ASSETS: 'assets',
  AUTOMATION_RULES: 'automation_rules',
  ANALYTICS_SNAPSHOTS: 'analytics_snapshots',
} as const
