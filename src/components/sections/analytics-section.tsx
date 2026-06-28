'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from '@/components/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, BarChart3, TrendingUp, Eye, Heart, MessageCircle, Share2, MousePointerClick, UserPlus } from 'lucide-react'
import { PLATFORMS, getPlatformMeta } from '@/lib/platforms'
import { useAppStore } from '@/lib/store'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, AreaChart, Area,
} from 'recharts'

interface Snapshot {
  id: string
  platform: string
  metric: string
  value: number
  recordedAt: string
}

export function AnalyticsSection() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const activeProjectId = useAppStore((s) => s.activeProjectId)

  useEffect(() => {
    if (!activeProjectId) {
      Promise.resolve().then(() => {
        setSnapshots([])
        setLoading(false)
      })
      return
    }
    fetch(`/api/analytics/raw?projectId=${activeProjectId}`)
      .then((r) => r.json())
      .then((data) => setSnapshots(data.snapshots || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeProjectId])

  // Build chart data: last 14 days, daily reach per platform
  const chartData = buildDailyChartData(snapshots, 14)
  const platformSummary = buildPlatformSummary(snapshots)

  const totalReach = platformSummary.reduce((sum, p) => sum + p.reach, 0)
  const totalEngagement = platformSummary.reduce((sum, p) => sum + p.engagement, 0)
  const totalClicks = platformSummary.reduce((sum, p) => sum + p.clicks, 0)
  const totalFollowers = platformSummary.reduce((sum, p) => sum + Math.max(0, p.followers), 0)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
      <SectionHeader
        title="Analytics"
        description="Track performance across all your platforms. Identify what works and double down."
        icon={BarChart3}
      />

      {/* Top metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total Reach" value={totalReach.toLocaleString()} sub="14-day aggregate" icon={Eye} accent="text-emerald-600" />
        <MetricCard label="Engagement" value={totalEngagement.toLocaleString()} sub="Likes + comments + shares" icon={Heart} accent="text-rose-600" />
        <MetricCard label="Clicks" value={totalClicks.toLocaleString()} sub="Link clicks tracked" icon={MousePointerClick} accent="text-amber-600" />
        <MetricCard label="New Followers" value={`+${totalFollowers.toLocaleString()}`} sub="14-day growth" icon={UserPlus} accent="text-purple-600" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">By Platform</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Reach trend (last 14 days)
              </CardTitle>
              <CardDescription className="text-xs">Daily reach across all platforms</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      fill="url(#reachGrad)"
                      name="Total reach"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Engagement breakdown</CardTitle>
              <CardDescription className="text-xs">By platform, last 14 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={platformSummary}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="engagement" fill="var(--chart-1)" name="Engagement" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="clicks" fill="var(--chart-2)" name="Clicks" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platformSummary.map((p) => {
              const meta = getPlatformMeta(p.platform)
              const Icon = meta.icon
              const engRate = p.reach > 0 ? (p.engagement / p.reach) * 100 : 0
              return (
                <Card key={p.platform}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{meta.label}</div>
                        <div className="text-[11px] text-muted-foreground">Last 14 days</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <Stat label="Reach" value={p.reach.toLocaleString()} />
                      <Stat label="Engagement" value={p.engagement.toLocaleString()} />
                      <Stat label="Clicks" value={p.clicks.toLocaleString()} />
                      <Stat label="Followers" value={`+${Math.max(0, p.followers)}`} />
                    </div>

                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Engagement rate</span>
                        <span className="font-medium">{engRate.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, engRate * 2)}%`, backgroundColor: meta.color }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function buildDailyChartData(snapshots: Snapshot[], days: number) {
  const now = new Date()
  const cutoff = new Date(now.getTime() - days * 86400000)

  const byDate: Record<string, { date: string; total: number; [k: string]: any }> = {}

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const key = d.toISOString().slice(0, 10)
    byDate[key] = {
      date: d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }),
      total: 0,
    }
  }

  for (const s of snapshots) {
    if (s.metric !== 'reach') continue
    const d = new Date(s.recordedAt)
    if (d < cutoff) continue
    const key = d.toISOString().slice(0, 10)
    if (!byDate[key]) continue
    byDate[key].total += s.value
  }

  return Object.values(byDate)
}

function buildPlatformSummary(snapshots: Snapshot[]) {
  const now = Date.now()
  const cutoff = now - 14 * 86400000
  const summary: Record<string, { reach: number; engagement: number; clicks: number; followers: number }> = {}

  for (const p of PLATFORMS) {
    summary[p.id] = { reach: 0, engagement: 0, clicks: 0, followers: 0 }
  }

  for (const s of snapshots) {
    const t = new Date(s.recordedAt).getTime()
    if (t < cutoff) continue
    if (!summary[s.platform]) continue
    if (s.metric === 'reach') summary[s.platform].reach += s.value
    else if (s.metric === 'engagement') summary[s.platform].engagement += s.value
    else if (s.metric === 'clicks') summary[s.platform].clicks += s.value
    else if (s.metric === 'followers') summary[s.platform].followers += s.value
  }

  return PLATFORMS.map((p) => ({
    platform: p.id,
    label: p.label.split(' ')[0],
    ...summary[p.id],
  }))
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  sub: string
  icon: React.ComponentType<{ className?: string }>
  accent: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className={`h-4 w-4 ${accent}`} />
        </div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-[11px] text-muted-foreground mt-1">{sub}</div>
      </CardContent>
    </Card>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="flex items-center justify-center h-[280px] text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
    </div>
  )
}
