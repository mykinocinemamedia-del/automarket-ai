'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from '@/components/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Building2, Save, Loader2, Sparkles, Target, MessageSquare, Palette, Hash, Plus, X } from 'lucide-react'
import { useBrand } from '@/hooks/use-brand'
import { useAppStore } from '@/lib/store'

interface BrandForm {
  name: string
  tagline: string
  industry: string
  targetAudience: string
  brandVoice: string
  toneKeywords: string
  primaryColor: string
  hashtagSets: string
}

const EMPTY: BrandForm = {
  name: '',
  tagline: '',
  industry: '',
  targetAudience: '',
  brandVoice: '',
  toneKeywords: '',
  primaryColor: '#8B5A3C',
  hashtagSets: '',
}

export function BrandSection() {
  const { brand, loading, refresh } = useBrand()
  const activeProjectId = useAppStore((s) => s.activeProjectId)
  const [form, setForm] = useState<BrandForm>(EMPTY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (brand) {
      // Parse hashtagSets — it might be stored as JSON array or plain text
      let hashtagSets = brand.hashtagSets || ''
      try {
        const parsed = JSON.parse(hashtagSets)
        if (Array.isArray(parsed)) {
          hashtagSets = parsed.join('\n')
        }
      } catch {
        // Not JSON, use as-is
      }
      setForm({
        name: brand.name || '',
        tagline: brand.tagline || '',
        industry: brand.industry || '',
        targetAudience: brand.targetAudience || '',
        brandVoice: brand.brandVoice || '',
        toneKeywords: brand.toneKeywords || '',
        primaryColor: brand.primaryColor || '#8B5A3C',
        hashtagSets,
      })
      setEditingId(brand.id)
    }
  }, [brand])

  const set = (k: keyof BrandForm, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Brand name required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const method = editingId ? 'PATCH' : 'POST'
      const body = editingId ? { id: editingId, ...form } : { ...form, projectId: activeProjectId }
      const res = await fetch('/api/brand', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      toast({ title: editingId ? 'Brand updated' : 'Brand created', description: 'AI will now use this voice.' })
      await refresh()
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-4xl mx-auto">
        <SectionHeader title="Brand Memory" description="Loading..." icon={Building2} />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading brand profile...
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-4xl mx-auto">
      <SectionHeader
        title="Brand Memory"
        description="Teach the AI who you are. The more context you give, the more on-brand every generation will be."
        icon={Building2}
        actions={
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editingId ? 'Save Changes' : 'Create Brand'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: form */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Identity
              </CardTitle>
              <CardDescription className="text-xs">Who you are.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Brand name <span className="text-destructive">*</span></Label>
                  <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Kopi Senja" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="industry">Industry</Label>
                  <Input id="industry" value={form.industry} onChange={(e) => set('industry', e.target.value)} placeholder="e.g. F&B / Specialty Coffee" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tagline">Tagline</Label>
                <Input id="tagline" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="e.g. Setiap teguk, satu cerita" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="color">Primary brand color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primaryColor}
                    onChange={(e) => set('primaryColor', e.target.value)}
                    className="h-9 w-12 rounded-md border border-border cursor-pointer bg-transparent"
                  />
                  <Input value={form.primaryColor} onChange={(e) => set('primaryColor', e.target.value)} className="flex-1" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Audience & Voice
              </CardTitle>
              <CardDescription className="text-xs">Who you speak to and how.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="audience">Target audience</Label>
                <Textarea
                  id="audience"
                  value={form.targetAudience}
                  onChange={(e) => set('targetAudience', e.target.value)}
                  placeholder="e.g. Urban professionals 25-40 yang appreciate slow living & quality coffee"
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="voice">Brand voice description</Label>
                <Textarea
                  id="voice"
                  value={form.brandVoice}
                  onChange={(e) => set('brandVoice', e.target.value)}
                  placeholder="e.g. Warm, contemplative, slightly poetic. Mix BM-English. Not pushy, more like friend sharing passion."
                  rows={3}
                />
                <p className="text-[11px] text-muted-foreground">Describe how the brand sounds. Be specific about language, register, and what to avoid.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tone">Tone keywords (comma-separated)</Label>
                <Input
                  id="tone"
                  value={form.toneKeywords}
                  onChange={(e) => set('toneKeywords', e.target.value)}
                  placeholder="e.g. warm, authentic, poetic, calming, friendly"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                Hashtag Sets
              </CardTitle>
              <CardDescription className="text-xs">Save reusable hashtag groups for quick access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="hashtags">One set per line</Label>
                <Textarea
                  id="hashtags"
                  value={form.hashtagSets}
                  onChange={(e) => set('hashtagSets', e.target.value)}
                  placeholder={'#kopisenja #specialtycoffee #slowliving #coffeemalaysia\n#coffeelover #kualalumpur #coffeeculture #thirdwave'}
                  rows={4}
                />
              </div>
              {form.hashtagSets.trim() && (
                <div>
                  <p className="text-[11px] text-muted-foreground mb-2">Preview:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {form.hashtagSets.split('\n').filter(Boolean).slice(0, 2).map((line, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] font-normal">
                        Set {i + 1}: {line.trim().split(/\s+/).slice(0, 4).join(' ')}...
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: preview & tips */}
        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Live Preview
              </CardTitle>
              <CardDescription className="text-xs">How the AI sees your brand.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg border" style={{ borderColor: `${form.primaryColor}40`, backgroundColor: `${form.primaryColor}08` }}>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="h-8 w-8 rounded-md flex items-center justify-center font-bold text-white"
                    style={{ backgroundColor: form.primaryColor }}
                  >
                    {form.name?.[0]?.toUpperCase() || 'B'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{form.name || 'Your Brand'}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{form.industry || 'Industry'}</div>
                  </div>
                </div>
                {form.tagline && <p className="text-xs italic text-muted-foreground">"{form.tagline}"</p>}
              </div>

              <div className="space-y-2 text-xs">
                <PreviewItem label="Audience" value={form.targetAudience} icon={Target} />
                <PreviewItem label="Voice" value={form.brandVoice} icon={MessageSquare} />
                <PreviewItem label="Tone" value={form.toneKeywords} icon={Sparkles} />
              </div>

              <Separator />

              <div className="space-y-1.5">
                <p className="text-[11px] font-medium">Tips for better AI output:</p>
                <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4">
                  <li>Be specific about language style (e.g. "mix BM-English", "professional English")</li>
                  <li>State what to avoid (e.g. "no hard selling", "no slang")</li>
                  <li>Mention audience pain points and aspirations</li>
                  <li>Update voice when your brand evolves</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function PreviewItem({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</div>
        <div className="text-xs leading-relaxed line-clamp-3">{value}</div>
      </div>
    </div>
  )
}
