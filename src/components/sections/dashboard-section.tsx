'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { SectionHeader } from '@/components/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Sparkles,
  TrendingUp,
  CalendarDays,
  Bot,
  ArrowUpRight,
  ArrowRight,
  Clock,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Zap,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { PLATFORMS, getStatusMeta, getPlatformMeta, timeAgo, timeUntil, formatDateTime } from '@/lib/platforms'

export function DashboardSection() {
  const setSection = useAppStore((s) => s.setSection)
  const activeProjectId = useAppStore((s) => s.activeProjectId)
  const [stats, setStats] = useState({
    totalPosts: 0,
    scheduled: 0,
    published: 0,
    drafts: 0,
    totalReach: 0,
    totalEngagement: 0,
    activeRules: 0,
  })
  const [recentPosts, setRecentPosts] = useState<any[]>([])
  const [upcomingPosts, setUpcomingPosts] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<Record<string, any>>({})
  const [brand, setBrand] = useState<any>(null)
  const [rules, setRules] = useState<any[]>([])

  useEffect(() => {
    if (!activeProjectId) {
      // Reset when no project selected
      Promise.resolve().then(() => {
        setStats({ totalPosts: 0, scheduled: 0, published: 0, drafts: 0, totalReach: 0, totalEngagement: 0, activeRules: 0 })
        setRecentPosts([])
        setUpcomingPosts([])
        setAnalytics({})
        setBrand(null)
        setRules([])
      })
      return
    }

    Promise.all([
      fetch(`/api/posts?projectId=${activeProjectId}`).then((r) => r.json()),
      fetch(`/api/analytics?projectId=${activeProjectId}`).then((r) => r.json()),
      fetch(`/api/brand?projectId=${activeProjectId}`).then((r) => r.json()),
      fetch(`/api/rules?projectId=${activeProjectId}`).then((r) => r.json()),
    ]).then(([postsData, analyticsData, brandData, rulesData]) => {
      const posts = postsData.posts || []
      const scheduled = posts.filter((p: any) => p.status === 'scheduled')
      const published = posts.filter((p: any) => p.status === 'published')
      const drafts = posts.filter((p: any) => p.status === 'draft')

      setRecentPosts(posts.slice(0, 5))
      setUpcomingPosts(
        scheduled
          .filter((p: any) => p.scheduledAt)
          .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
          .slice(0, 4)
      )

      const latest = analyticsData.latest || {}
      let totalReach = 0
      let totalEngagement = 0
      for (const platform of Object.keys(latest)) {
        if (latest[platform]?.reach) totalReach += latest[platform].reach.value
        if (latest[platform]?.engagement) totalEngagement += latest[platform].engagement.value
      }

      setStats({
        totalPosts: posts.length,
        scheduled: scheduled.length,
        published: published.length,
        drafts: drafts.length,
        totalReach,
        totalEngagement,
        activeRules: (rulesData.rules || []).filter((r: any) => r.active).length,
      })
      setAnalytics(latest)
      setBrand(brandData.brands?.[0] || null)
      setRules(rulesData.rules || [])
    }).catch(() => {})
  }, [activeProjectId])

  const quickActions = [
    {
      title: 'Generate Caption',
      desc: 'AI writes captions for any platform',
      icon: Sparkles,
      section: 'studio' as const,
      bg: 'bg-[var(--brutal-yellow)]',
    },
    {
      title: 'Schedule Post',
      desc: 'Queue content for the week',
      icon: CalendarDays,
      section: 'calendar' as const,
      bg: 'bg-[var(--brutal-green)]',
    },
    {
      title: 'Setup Brand Voice',
      desc: 'Teach AI your tone & audience',
      icon: TrendingUp,
      section: 'brand' as const,
      bg: 'bg-white',
    },
    {
      title: 'Create Automation',
      desc: 'Set up auto-pilot rules',
      icon: Bot,
      section: 'autopilot' as const,
      bg: 'bg-[var(--brutal-red)] text-white',
    },
  ]

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
      <SectionHeader
        title={brand ? `Welcome back, ${brand.name}` : 'Welcome to Kino Social'}
        description="Your personal marketing command center. Everything you need to run social media like a 1-person team."
        icon={Zap}
        actions={
          <Button onClick={() => setSection('studio')} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate Content
          </Button>
        }
      />

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6">
        <StatCard
          label="Total Posts"
          value={stats.totalPosts}
          sub={`${stats.drafts} drafts · ${stats.published} published`}
          icon={CalendarDays}
          accent="text-primary"
        />
        <StatCard
          label="Scheduled"
          value={stats.scheduled}
          sub="Queued for publish"
          icon={Clock}
          accent="text-amber-600"
        />
        <StatCard
          label="Total Reach"
          value={stats.totalReach.toLocaleString()}
          sub="Across all platforms"
          icon={Eye}
          accent="text-emerald-600"
        />
        <StatCard
          label="Engagement"
          value={stats.totalEngagement.toLocaleString()}
          sub="Likes + comments + shares"
          icon={Heart}
          accent="text-rose-600"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {quickActions.map((qa) => {
          const Icon = qa.icon
          return (
            <button
              key={qa.title}
              onClick={() => setSection(qa.section)}
              className="group text-left p-4 border-[3px] border-black bg-card shadow-brutal-sm hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
            >
              <div className={`h-10 w-10 flex items-center justify-center mb-3 border-[3px] border-black ${qa.bg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="font-display text-lg leading-none tracking-wide flex items-center gap-1">
                {qa.title}
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-black/60 mt-1">{qa.desc}</div>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent posts */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Recent Content</CardTitle>
              <CardDescription className="text-xs">Latest posts across all platforms</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSection('calendar')} className="gap-1 text-xs">
              View all
              <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
            {recentPosts.length === 0 ? (
              <EmptyState text="No posts yet. Start by generating one in the Content Studio." />
            ) : (
              recentPosts.map((post) => {
                const platform = getPlatformMeta(post.platform)
                const status = getStatusMeta(post.status)
                const PlatformIcon = platform.icon
                return (
                  <div
                    key={post.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <Avatar className="h-9 w-9 rounded-lg" style={{ backgroundColor: `${platform.color}20` }}>
                      <AvatarFallback style={{ backgroundColor: 'transparent', color: platform.color }}>
                        <PlatformIcon className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{post.title}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{post.body}</p>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {post.publishedAt ? `Published ${timeAgo(post.publishedAt)}` :
                         post.scheduledAt ? `Scheduled ${formatDateTime(post.scheduledAt)}` :
                         `Created ${timeAgo(post.createdAt)}`}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Upcoming + Auto-pilot summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Upcoming
              </CardTitle>
              <CardDescription className="text-xs">Next scheduled posts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
              {upcomingPosts.length === 0 ? (
                <EmptyState text="Nothing scheduled yet" />
              ) : (
                upcomingPosts.map((post) => {
                  const platform = getPlatformMeta(post.platform)
                  const PlatformIcon = platform.icon
                  return (
                    <div key={post.id} className="flex items-center gap-2 text-xs">
                      <div
                        className="h-7 w-7 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${platform.color}20`, color: platform.color }}
                      >
                        <PlatformIcon className="h-3.5 w-3.5" />
                      </div>
                      <span className="flex-1 truncate">{post.title}</span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {timeUntil(post.scheduledAt)}
                      </Badge>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-600" />
                Auto-Pilot
              </CardTitle>
              <CardDescription className="text-xs">{stats.activeRules} active rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {rules.filter((r) => r.active).slice(0, 3).map((rule) => (
                <div key={rule.id} className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="flex-1 truncate">{rule.name}</span>
                </div>
              ))}
              {rules.filter((r) => r.active).length === 0 && (
                <EmptyState text="No active rules" />
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs"
                onClick={() => setSection('autopilot')}
              >
                Manage rules
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Platform performance */}
      <Card className="mt-6">
        <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Platform Performance</CardTitle>
            <CardDescription className="text-xs">Latest reach & engagement per platform</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setSection('analytics')} className="gap-1 text-xs">
            Details
            <ArrowRight className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {PLATFORMS.map((p) => {
              const Icon = p.icon
              const data = analytics[p.id] || {}
              const reach = data.reach?.value || 0
              const engagement = data.engagement?.value || 0
              const engRate = reach > 0 ? Math.min(100, (engagement / reach) * 100) : 0
              return (
                <div key={p.id} className="p-3 rounded-lg border border-border bg-card/50">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="h-7 w-7 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: `${p.color}20`, color: p.color }}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-medium">{p.label}</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] text-muted-foreground flex justify-between">
                        <span>Reach</span>
                        <span className="font-medium">{reach.toLocaleString()}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground flex justify-between mb-1">
                        <span>Engagement rate</span>
                        <span className="font-medium">{engRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={engRate} className="h-1.5" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Setup checklist */}
      {!brand && (
        <Card className="mt-6 bg-[var(--brutal-yellow)]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Complete your setup
            </CardTitle>
            <CardDescription className="text-xs">
              Set up your brand profile so the AI can write in your voice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setSection('brand')} size="sm" className="gap-2 bg-black text-[var(--brutal-yellow)]">
              Set up brand
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string | number
  sub: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
}) {
  return (
    <Card className="hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-black/60">{label}</span>
          <div className="h-8 w-8 bg-[var(--brutal-yellow)] flex items-center justify-center border-[2px] border-black">
            <Icon className="h-4 w-4 text-black" />
          </div>
        </div>
        <div className="font-display text-4xl leading-none tracking-wide">{value}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-black/60 mt-2 border-l-[3px] border-[var(--brutal-red)] pl-2">{sub}</div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-6 text-xs text-muted-foreground">{text}</div>
  )
}
