'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from '@/components/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'
import { useBrand } from '@/hooks/use-brand'
import { getPlatformMeta } from '@/lib/platforms'
import {
  TrendingUp,
  RefreshCw,
  Loader2,
  Sparkles,
  Check,
  X,
  Clock,
  ArrowRight,
  Eye,
  MessageSquare,
  Lightbulb,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Suggestion {
  id: string
  title: string
  caption: string
  platform: string
  hashtags: string
  whyItWorks: string
  bestTimeToPost: string
  pillar: string
  trendTopic: string
}

export function TrendsSection() {
  const activeProjectId = useAppStore((s) => s.activeProjectId)
  const setSection = useAppStore((s) => s.setSection)
  const { brand } = useBrand()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [trendsData, setTrendsData] = useState<string>('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [lastRun, setLastRun] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const runTrendScan = async () => {
    if (!activeProjectId) {
      toast({ title: 'Select a project first', variant: 'destructive' })
      return
    }

    setLoading(true)
    setSuggestions([])
    setSavedIds(new Set())

    try {
      const res = await fetch('/api/trends/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: activeProjectId,
          count: 5,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed')
      }

      setTrendsData(data.trends || '')
      setSuggestions(data.suggestions || [])
      setLastRun(data.generatedAt)

      toast({
        title: `${data.suggestions?.length || 0} suggestions generated`,
        description: 'Based on current trends in your industry.',
      })
    } catch (e: any) {
      toast({
        title: 'Trend scan failed',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSuggestion = async (suggestion: Suggestion) => {
    try {
      // Calculate scheduled time (next occurrence of bestTimeToPost)
      const [hours, minutes] = (suggestion.bestTimeToPost || '08:00').split(':').map(Number)
      const scheduledDate = new Date()
      scheduledDate.setDate(scheduledDate.getDate() + 1) // Tomorrow
      scheduledDate.setHours(hours || 8, minutes || 0, 0, 0)

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: suggestion.title,
          body: suggestion.caption,
          platform: suggestion.platform,
          status: 'scheduled',
          hashtags: suggestion.hashtags,
          scheduledAt: scheduledDate.toISOString(),
          brandId: brand?.id,
          projectId: activeProjectId,
        }),
      })

      if (!res.ok) throw new Error('Failed to save')

      setSavedIds((prev) => new Set(prev).add(suggestion.id))
      toast({
        title: 'Saved to calendar',
        description: `"${suggestion.title}" scheduled for tomorrow at ${suggestion.bestTimeToPost}.`,
      })
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' })
    }
  }

  const dismissSuggestion = (id: string) => {
    setSuggestions((prev) => prev.filter((s) => s.id !== id))
    toast({ title: 'Suggestion dismissed' })
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto">
      <SectionHeader
        title="Trend Agent"
        description="Autonomous AI agent that monitors trends in your industry and suggests timely content ideas. Scan, review, and approve — one click saves to your calendar."
        icon={TrendingUp}
        actions={
          <Button
            onClick={runTrendScan}
            disabled={loading || !activeProjectId}
            className="gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? 'Scanning Trends...' : 'Scan Trends Now'}
          </Button>
        }
      />

      {/* Status banner */}
      {!activeProjectId ? (
        <Card className="bg-[var(--brutal-yellow)] mb-6">
          <CardContent className="p-4 flex items-center gap-3">
            <Activity className="h-5 w-5" />
            <div>
              <div className="font-display text-lg">No Active Project</div>
              <div className="text-xs">Select a project to start scanning trends.</div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-black text-[var(--brutal-yellow)] mb-6">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-[var(--brutal-yellow)] flex items-center justify-center border-[3px] border-[var(--brutal-yellow)]">
                <TrendingUp className="h-5 w-5 text-black" />
              </div>
              <div>
                <div className="font-display text-lg leading-none">MONITORING: {brand?.name || 'No brand set'}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--brutal-yellow)]/70 mt-1">
                  {brand?.industry || 'Set up brand in Brand Memory'}
                </div>
              </div>
            </div>
            {lastRun && (
              <Badge variant="outline" className="border-[var(--brutal-yellow)] text-[var(--brutal-yellow)]">
                <Clock className="h-3 w-3 mr-1" />
                Last scan: {new Date(lastRun).toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' })}
              </Badge>
            )}
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <Card className="mb-6">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--brutal-red)]" />
              <span className="font-display text-xl">SCANNING TRENDS...</span>
            </div>
            <div className="space-y-2 text-xs font-semibold uppercase tracking-widest text-black/60">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 bg-[var(--brutal-green)]" />
                Searching web for trending topics in {brand?.industry || 'your industry'}
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 bg-[var(--brutal-yellow)]" />
                Analyzing trends for {brand?.targetAudience || 'your audience'}
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 bg-[var(--brutal-red)]" />
                Generating content suggestions with brand voice
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trends research data */}
      {trendsData && !loading && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              TREND RESEARCH
            </CardTitle>
            <CardDescription>What's trending in {brand?.industry || 'your industry'} right now</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted border-[3px] border-black p-4 max-h-48 overflow-y-auto scrollbar-thin">
              <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed">{trendsData}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && !loading && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-wide">
              {suggestions.length} CONTENT SUGGESTIONS
            </h2>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              AI-Generated
            </Badge>
          </div>

          {suggestions.map((suggestion, index) => {
            const platform = getPlatformMeta(suggestion.platform)
            const PlatformIcon = platform.icon
            const isExpanded = expandedId === suggestion.id
            const isSaved = savedIds.has(suggestion.id)

            return (
              <Card
                key={suggestion.id}
                className={cn(
                  'hover:shadow-brutal transition-all',
                  isSaved && 'border-[var(--brutal-green)] border-[3px]'
                )}
              >
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="font-display text-3xl text-black/20 leading-none">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-display text-xl leading-none tracking-wide">
                          {suggestion.title}
                        </h3>
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <PlatformIcon className="h-2.5 w-2.5" />
                          {platform.label.split(' ')[0]}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {suggestion.pillar}
                        </Badge>
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-black/50 flex items-center gap-1">
                        <TrendingUp className="h-2.5 w-2.5" />
                        Trend: {suggestion.trendTopic}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {suggestion.bestTimeToPost}
                      </Badge>
                    </div>
                  </div>

                  {/* Caption */}
                  <div className="bg-muted border-l-[3px] border-[var(--brutal-red)] p-3 mb-3">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{suggestion.caption}</p>
                    {suggestion.hashtags && (
                      <p className="text-xs text-black/60 mt-2 font-medium">{suggestion.hashtags}</p>
                    )}
                  </div>

                  {/* Why it works */}
                  <div className="flex items-start gap-2 mb-3 text-xs">
                    <Lightbulb className="h-4 w-4 text-[var(--brutal-yellow)] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase tracking-widest text-[10px] text-black/60">WHY IT WORKS: </span>
                      <span className="text-black/80">{suggestion.whyItWorks}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t-[3px] border-black">
                    {isSaved ? (
                      <Badge className="bg-[var(--brutal-green)] text-black gap-1">
                        <Check className="h-3 w-3" />
                        SAVED TO CALENDAR
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => saveSuggestion(suggestion)}
                        className="gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Save to Calendar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => dismissSuggestion(suggestion.id)}
                      className="gap-1 text-destructive"
                    >
                      <X className="h-3 w-3" />
                      Dismiss
                    </Button>
                    {isSaved && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto gap-1"
                        onClick={() => setSection('calendar')}
                      >
                        View Calendar
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {suggestions.length === 0 && !loading && !trendsData && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-display text-2xl mb-2">NO TRENDS SCANNED YET</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-black/60 mb-4">
              Click "Scan Trends Now" to find what's trending in your industry
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
              <div className="p-3 border-[3px] border-black bg-[var(--brutal-yellow)]/30">
                <Eye className="h-5 w-5 mx-auto mb-2" />
                <div className="font-display text-sm">1. SCAN</div>
                <div className="text-[10px] uppercase tracking-wider text-black/60">Search web for trends</div>
              </div>
              <div className="p-3 border-[3px] border-black bg-[var(--brutal-green)]/30">
                <Lightbulb className="h-5 w-5 mx-auto mb-2" />
                <div className="font-display text-sm">2. REVIEW</div>
                <div className="text-[10px] uppercase tracking-wider text-black/60">AI generates ideas</div>
              </div>
              <div className="p-3 border-[3px] border-black bg-[var(--brutal-red)]/30">
                <Check className="h-5 w-5 mx-auto mb-2" />
                <div className="font-display text-sm">3. APPROVE</div>
                <div className="text-[10px] uppercase tracking-wider text-black/60">Save to calendar</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
