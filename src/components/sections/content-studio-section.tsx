'use client'

import { useState } from 'react'
import { SectionHeader } from '@/components/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Sparkles, Hash, RefreshCw, Copy, Wand2, Lightbulb, Check, Loader2, Save, ArrowRight } from 'lucide-react'
import { PLATFORMS, getPlatformMeta } from '@/lib/platforms'
import { useAppStore } from '@/lib/store'
import { useBrand } from '@/hooks/use-brand'

export function ContentStudioSection() {
  const [tab, setTab] = useState('caption')

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
      <SectionHeader
        title="AI Content Studio"
        description="Generate captions, hashtags, content ideas, and repurpose posts across platforms — all in your brand voice."
        icon={Sparkles}
      />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="caption" className="gap-1.5 py-2">
            <Wand2 className="h-3.5 w-3.5" />
            Caption
          </TabsTrigger>
          <TabsTrigger value="hashtags" className="gap-1.5 py-2">
            <Hash className="h-3.5 w-3.5" />
            Hashtags
          </TabsTrigger>
          <TabsTrigger value="repurpose" className="gap-1.5 py-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Repurpose
          </TabsTrigger>
          <TabsTrigger value="ideas" className="gap-1.5 py-2">
            <Lightbulb className="h-3.5 w-3.5" />
            Ideas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="caption" className="mt-4">
          <CaptionGenerator />
        </TabsContent>
        <TabsContent value="hashtags" className="mt-4">
          <HashtagGenerator />
        </TabsContent>
        <TabsContent value="repurpose" className="mt-4">
          <RepurposeTool />
        </TabsContent>
        <TabsContent value="ideas" className="mt-4">
          <IdeaGenerator />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CaptionGenerator() {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [extra, setExtra] = useState('')
  const [count, setCount] = useState(3)
  const [loading, setLoading] = useState(false)
  const [captions, setCaptions] = useState<string[]>([])
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const { brandId } = useBrand()
  const activeProjectId = useAppStore((s) => s.activeProjectId)
  const { toast } = useToast()
  const setSection = useAppStore((s) => s.setSection)

  const generate = async () => {
    if (!topic.trim()) {
      toast({ title: 'Topic required', description: 'Tell the AI what you want to post about.', variant: 'destructive' })
      return
    }
    setLoading(true)
    setCaptions([])
    setSavedIds(new Set())
    try {
      const res = await fetch('/api/ai/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, platform, additionalInstructions: extra, count, projectId: activeProjectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setCaptions(data.captions || [])
      toast({ title: `${data.captions?.length || 0} captions generated` })
    } catch (e: any) {
      toast({ title: 'Generation failed', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: 'Copied to clipboard' })
  }

  const saveAsPost = async (caption: string, index: number) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic.slice(0, 60),
          body: caption,
          platform,
          status: 'draft',
          brandId,
          projectId: activeProjectId,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      setSavedIds((prev) => new Set(prev).add(index))
      toast({ title: 'Saved as draft', description: 'Find it in your Content Calendar.' })
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            Caption Generator
          </CardTitle>
          <CardDescription className="text-xs">
            AI writes distinct caption variants tuned for your platform and brand voice.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="topic">Topic / idea <span className="text-destructive">*</span></Label>
            <Textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. launching our new single-origin Ethiopia beans this Friday, limited 50 packs only"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Platform</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {PLATFORMS.map((p) => {
                const Icon = p.icon
                const active = platform === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] font-medium transition-all ${
                      active ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    }`}
                    title={p.label}
                  >
                    <Icon className="h-4 w-4" style={{ color: active ? undefined : p.color }} />
                    <span className="hidden sm:inline">{p.label.split(' ')[0]}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="extra">Extra instructions (optional)</Label>
            <Textarea
              id="extra"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="e.g. mention discount code FRIDAY10, sound urgent, use storytelling"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3">
            <Label htmlFor="count" className="text-xs">Variants:</Label>
            {[1, 2, 3, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                className={`h-7 w-7 rounded-md text-xs font-medium border transition-all ${
                  count === n ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <Button onClick={generate} disabled={loading} className="w-full gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate {count} Caption{count > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Generated Captions</span>
            {captions.length > 0 && (
              <Badge variant="secondary" className="text-xs">{captions.length}</Badge>
            )}
          </CardTitle>
          <CardDescription className="text-xs">
            Tap copy or save as draft post.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {captions.length === 0 && !loading && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-40" />
              Your captions will appear here.
            </div>
          )}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2 p-3 border border-border rounded-lg animate-pulse">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              ))}
            </div>
          )}
          <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin pr-1">
            {captions.map((c, i) => {
              const saved = savedIds.has(i)
              return (
                <div key={i} className="p-3 border border-border rounded-lg bg-card hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-[10px]">Variant {i + 1}</Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copy(c)}
                        title="Copy"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        onClick={() => saveAsPost(c, i)}
                        disabled={saved}
                      >
                        {saved ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Save className="h-3.5 w-3.5" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{c}</p>
                </div>
              )
            })}
          </div>
          {captions.length > 0 && (
            <Button variant="outline" size="sm" className="w-full mt-3 gap-1 text-xs" onClick={() => setSection('calendar')}>
              Go to calendar
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function HashtagGenerator() {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [loading, setLoading] = useState(false)
  const [hashtags, setHashtags] = useState<string[]>([])
  const { brandId } = useBrand()
  const activeProjectId = useAppStore((s) => s.activeProjectId)
  const { toast } = useToast()

  const generate = async () => {
    if (!topic.trim()) {
      toast({ title: 'Topic required', variant: 'destructive' })
      return
    }
    setLoading(true)
    setHashtags([])
    try {
      const res = await fetch('/api/ai/generate-hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, platform, projectId: activeProjectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setHashtags(data.hashtags || [])
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const copyAll = () => {
    navigator.clipboard.writeText(hashtags.join(' '))
    toast({ title: 'All hashtags copied' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Hash className="h-4 w-4 text-primary" />
          Hashtag Strategist
        </CardTitle>
        <CardDescription className="text-xs">
          Get a balanced mix of broad, niche, and brand-specific hashtags.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ht-topic">Topic</Label>
            <Input
              id="ht-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. single origin coffee launch"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Platform</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {PLATFORMS.map((p) => {
                const Icon = p.icon
                const active = platform === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatform(p.id)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] font-medium transition-all ${
                      active ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <Button onClick={generate} disabled={loading} className="w-full gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Hashtags
            </>
          )}
        </Button>

        {hashtags.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{hashtags.length} hashtags</span>
              <Button variant="ghost" size="sm" onClick={copyAll} className="gap-1 text-xs h-7">
                <Copy className="h-3 w-3" />
                Copy all
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag, i) => (
                <button
                  key={i}
                  onClick={() => {
                    navigator.clipboard.writeText(tag)
                    toast({ title: 'Copied', description: tag })
                  }}
                  className="px-2.5 py-1 text-xs rounded-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {hashtags.length === 0 && !loading && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Hash className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Hashtags will appear here.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RepurposeTool() {
  const [source, setSource] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram', 'linkedin', 'twitter'])
  const [loading, setLoading] = useState(false)
  const [variations, setVariations] = useState<Record<string, string>>({})
  const { brandId } = useBrand()
  const activeProjectId = useAppStore((s) => s.activeProjectId)
  const { toast } = useToast()

  const toggle = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const repurpose = async () => {
    if (!source.trim()) {
      toast({ title: 'Source content required', variant: 'destructive' })
      return
    }
    if (selectedPlatforms.length === 0) {
      toast({ title: 'Pick at least one platform', variant: 'destructive' })
      return
    }
    setLoading(true)
    setVariations({})
    try {
      const res = await fetch('/api/ai/repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceContent: source, targetPlatforms: selectedPlatforms, projectId: activeProjectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setVariations(data.variations || {})
      toast({ title: 'Content repurposed' })
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            Repurpose Content
          </CardTitle>
          <CardDescription className="text-xs">
            Take one piece of content and adapt it for multiple platforms in one click.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="source">Source content (blog post, caption, idea)</Label>
            <Textarea
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Paste your blog post, caption, or any content here..."
              rows={8}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Target platforms ({selectedPlatforms.length} selected)</Label>
            <div className="grid grid-cols-5 gap-1.5">
              {PLATFORMS.map((p) => {
                const Icon = p.icon
                const active = selectedPlatforms.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggle(p.id)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] font-medium transition-all ${
                      active ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
          </div>

          <Button onClick={repurpose} disabled={loading} className="w-full gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Repurposing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Repurpose for {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Variations</CardTitle>
          <CardDescription className="text-xs">One piece of content, many formats.</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(variations).length === 0 && !loading && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <RefreshCw className="h-8 w-8 mx-auto mb-2 opacity-40" />
              Variations will appear here.
            </div>
          )}
          <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin pr-1">
            {Object.entries(variations).map(([platform, content]) => {
              const meta = getPlatformMeta(platform)
              const Icon = meta.icon
              return (
                <div key={platform} className="p-3 border border-border rounded-lg bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-6 w-6 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                      >
                        <Icon className="h-3 w-3" />
                      </div>
                      <span className="text-xs font-medium">{meta.label}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        navigator.clipboard.writeText(content)
                        toast({ title: 'Copied' })
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function IdeaGenerator() {
  const [pillars, setPillars] = useState('')
  const [loading, setLoading] = useState(false)
  const [ideas, setIdeas] = useState<string[]>([])
  const { brandId } = useBrand()
  const activeProjectId = useAppStore((s) => s.activeProjectId)
  const { toast } = useToast()

  const generate = async () => {
    setLoading(true)
    setIdeas([])
    try {
      const pillarTopics = pillars.split(',').map((s) => s.trim()).filter(Boolean)
      const res = await fetch('/api/ai/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pillarTopics, count: 10, projectId: activeProjectId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setIdeas(data.ideas || [])
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          Content Idea Generator
        </CardTitle>
        <CardDescription className="text-xs">
          Get 10 fresh content ideas based on your brand and pillar topics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pillars">Pillar topics (comma-separated, optional)</Label>
          <Input
            id="pillars"
            value={pillars}
            onChange={(e) => setPillars(e.target.value)}
            placeholder="e.g. product launches, behind the scenes, customer stories, education"
          />
        </div>

        <Button onClick={generate} disabled={loading} className="w-full gap-2">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating ideas...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate 10 Ideas
            </>
          )}
        </Button>

        {ideas.length > 0 && (
          <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
            {ideas.map((idea, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border border-border rounded-lg bg-card hover:border-primary/30 transition-colors">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed flex-1">{idea}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => {
                    navigator.clipboard.writeText(idea)
                    toast({ title: 'Copied' })
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {ideas.length === 0 && !loading && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-40" />
            Ideas will appear here.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
