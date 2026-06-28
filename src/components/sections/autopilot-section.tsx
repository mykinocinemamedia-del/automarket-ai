'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from '@/components/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'
import { Bot, Plus, Trash2, Edit3, Loader2, Zap, Clock, Calendar, RefreshCw, Sparkles, Play, AlertCircle } from 'lucide-react'
import { PLATFORMS } from '@/lib/platforms'

interface Rule {
  id: string
  name: string
  description?: string | null
  trigger: string
  action: string
  config: string
  active: boolean
  lastRunAt?: string | null
  createdAt: string
}

const TRIGGER_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; desc: string }> = {
  daily: { label: 'Daily', icon: Clock, desc: 'Runs every day at a set time' },
  weekly: { label: 'Weekly', icon: Calendar, desc: 'Runs on a specific day each week' },
  on_event: { label: 'On Event', icon: Zap, desc: 'Triggered by another action' },
  content_added: { label: 'Content Added', icon: Plus, desc: 'When new content is added' },
}

const ACTION_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; desc: string }> = {
  generate_post: { label: 'Generate Post', icon: Sparkles, desc: 'AI generates a new post' },
  repurpose: { label: 'Repurpose', icon: RefreshCw, desc: 'Adapt content for other platforms' },
  schedule: { label: 'Schedule', icon: Calendar, desc: 'Queue a post for publishing' },
}

export function AutopilotSection() {
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Rule | null>(null)
  const { toast } = useToast()
  const activeProjectId = useAppStore((s) => s.activeProjectId)

  const load = async () => {
    if (!activeProjectId) {
      setRules([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/rules?projectId=${activeProjectId}`)
      const data = await res.json()
      setRules(data.rules || [])
    } catch (e: any) {
      toast({ title: 'Failed to load rules', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [activeProjectId])

  const toggleActive = async (rule: Rule) => {
    try {
      await fetch('/api/rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rule.id, active: !rule.active }),
      })
      toast({ title: `Rule ${!rule.active ? 'activated' : 'paused'}` })
      await load()
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rule?')) return
    try {
      await fetch(`/api/rules?id=${id}`, { method: 'DELETE' })
      toast({ title: 'Rule deleted' })
      await load()
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    }
  }

  const handleSave = async (rule: Partial<Rule>) => {
    try {
      const method = rule.id ? 'PATCH' : 'POST'
      const res = await fetch('/api/rules', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rule, projectId: activeProjectId }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: rule.id ? 'Rule updated' : 'Rule created' })
      setDialogOpen(false)
      await load()
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' })
    }
  }

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (rule: Rule) => {
    setEditing(rule)
    setDialogOpen(true)
  }

  const activeCount = rules.filter((r) => r.active).length

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
      <SectionHeader
        title="Auto-Pilot Rules"
        description="Automate repetitive marketing tasks. Set triggers, define actions, and let the system work while you sleep."
        icon={Bot}
        actions={
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            New Rule
          </Button>
        }
      />

      {/* Status banner */}
      <Card className="mb-6 border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">
              {activeCount} active automation{activeCount !== 1 ? 's' : ''}
            </div>
            <div className="text-xs text-muted-foreground">
              {activeCount > 0
                ? 'Auto-pilot is running. You can review or pause rules anytime.'
                : 'No active automations. Create your first rule to start automating.'}
            </div>
          </div>
          <Badge variant={activeCount > 0 ? 'default' : 'secondary'} className="gap-1">
            <span className={`h-1.5 w-1.5 rounded-full ${activeCount > 0 ? 'bg-emerald-400 animate-soft-pulse' : 'bg-muted-foreground'}`} />
            {activeCount > 0 ? 'Active' : 'Idle'}
          </Badge>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-12">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading rules...
        </div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bot className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium mb-1">No rules yet</p>
            <p className="text-xs text-muted-foreground mb-4">Create your first automation to start saving time.</p>
            <Button onClick={openNew} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => {
            const trigger = TRIGGER_META[rule.trigger] || TRIGGER_META.daily
            const action = ACTION_META[rule.action] || ACTION_META.generate_post
            const TriggerIcon = trigger.icon
            const ActionIcon = action.icon
            let config: any = {}
            try { config = JSON.parse(rule.config) } catch {}

            return (
              <Card key={rule.id} className={rule.active ? 'border-primary/30' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${rule.active ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      <ActionIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">{rule.name}</h3>
                        <Switch
                          checked={rule.active}
                          onCheckedChange={() => toggleActive(rule)}
                          className="scale-75 -mr-1"
                        />
                      </div>
                      {rule.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{rule.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <TriggerIcon className="h-2.5 w-2.5" />
                      {trigger.label}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <ActionIcon className="h-2.5 w-2.5" />
                      {action.label}
                    </Badge>
                    {config.platform && (
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {config.platform}
                      </Badge>
                    )}
                    {config.time && (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {config.time}
                      </Badge>
                    )}
                  </div>

                  {rule.lastRunAt && (
                    <div className="text-[10px] text-muted-foreground mb-2">
                      Last run: {new Date(rule.lastRunAt).toLocaleString('en-MY')}
                    </div>
                  )}

                  <div className="flex items-center gap-1 pt-2 border-t border-border">
                    <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={() => openEdit(rule)}>
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 gap-1 ml-auto text-destructive"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Templates */}
      <Card className="mt-6 bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Quick Templates
          </CardTitle>
          <CardDescription className="text-xs">Pre-built rules you can add in one click.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TEMPLATES.map((tpl) => {
            const Icon = ACTION_META[tpl.action]?.icon || Sparkles
            return (
              <button
                key={tpl.name}
                onClick={() => handleSave(tpl)}
                className="text-left p-3 rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-medium text-xs">{tpl.name}</span>
                  <Plus className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{tpl.description}</p>
              </button>
            )
          })}
        </CardContent>
      </Card>

      <RuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rule={editing}
        onSave={handleSave}
      />
    </div>
  )
}

const TEMPLATES = [
  {
    name: 'Morning Quote',
    description: 'Auto-generate motivation quote every morning at 8 AM for Instagram',
    trigger: 'daily',
    action: 'generate_post',
    config: JSON.stringify({ time: '08:00', platform: 'instagram', prompt: 'morivation quote related to your niche' }),
    active: true,
  },
  {
    name: 'Weekly Recap',
    description: 'Generate a weekly recap post every Monday at 10 AM',
    trigger: 'weekly',
    action: 'generate_post',
    config: JSON.stringify({ day: 'monday', time: '10:00', platform: 'linkedin' }),
    active: false,
  },
  {
    name: 'Repurpose to LinkedIn',
    description: 'When a new blog is added, auto-repurpose it for LinkedIn',
    trigger: 'on_event',
    action: 'repurpose',
    config: JSON.stringify({ source: 'blog', target: 'linkedin' }),
    active: true,
  },
  {
    name: 'Twitter Thread',
    description: 'Turn long-form content into a Twitter thread',
    trigger: 'content_added',
    action: 'repurpose',
    config: JSON.stringify({ source: 'long_form', target: 'twitter' }),
    active: false,
  },
  {
    name: 'Daily Story',
    description: 'Generate Instagram Story copy every evening at 6 PM',
    trigger: 'daily',
    action: 'generate_post',
    config: JSON.stringify({ time: '18:00', platform: 'instagram', format: 'story' }),
    active: false,
  },
  {
    name: 'Engagement Reply',
    description: 'Auto-draft replies to comments for your approval',
    trigger: 'on_event',
    action: 'generate_post',
    config: JSON.stringify({ trigger: 'comment_received', auto_draft_reply: true }),
    active: false,
  },
]

function RuleDialog({
  open,
  onOpenChange,
  rule,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  rule: Rule | null
  onSave: (r: Partial<Rule>) => void
}) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    trigger: 'daily',
    action: 'generate_post',
    config: '{\n  "time": "08:00",\n  "platform": "instagram"\n}',
    active: true,
  })
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (rule) {
      let prettyConfig = rule.config
      try {
        prettyConfig = JSON.stringify(JSON.parse(rule.config), null, 2)
      } catch {}
      setForm({
        name: rule.name,
        description: rule.description || '',
        trigger: rule.trigger,
        action: rule.action,
        config: prettyConfig,
        active: rule.active,
      })
    } else {
      setForm({
        name: '',
        description: '',
        trigger: 'daily',
        action: 'generate_post',
        config: '{\n  "time": "08:00",\n  "platform": "instagram"\n}',
        active: true,
      })
    }
  }, [rule, open])

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' })
      return
    }
    // Validate JSON
    try {
      JSON.parse(form.config)
    } catch {
      toast({ title: 'Invalid JSON in config', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      await onSave({
        id: rule?.id,
        name: form.name,
        description: form.description || undefined,
        trigger: form.trigger,
        action: form.action,
        config: form.config,
        active: form.active,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rule ? 'Edit Rule' : 'New Automation Rule'}</DialogTitle>
          <DialogDescription>
            Define when this rule runs and what it does.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="rule-name">Rule name <span className="text-destructive">*</span></Label>
            <Input
              id="rule-name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Morning motivation post"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rule-desc">Description</Label>
            <Textarea
              id="rule-desc"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="What does this rule do?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Trigger</Label>
              <Select value={form.trigger} onValueChange={(v) => setForm((p) => ({ ...p, trigger: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TRIGGER_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">{TRIGGER_META[form.trigger]?.desc}</p>
            </div>
            <div className="space-y-1.5">
              <Label>Action</Label>
              <Select value={form.action} onValueChange={(v) => setForm((p) => ({ ...p, action: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTION_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">{ACTION_META[form.action]?.desc}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rule-config">Configuration (JSON)</Label>
            <Textarea
              id="rule-config"
              value={form.config}
              onChange={(e) => setForm((p) => ({ ...p, config: e.target.value }))}
              rows={6}
              className="font-mono text-xs"
              placeholder='{\n  "time": "08:00",\n  "platform": "instagram"\n}'
            />
            <p className="text-[11px] text-muted-foreground">
              Common fields: <code>time</code> (HH:MM), <code>platform</code> (instagram/facebook/etc), <code>day</code> (monday), <code>prompt</code>
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
            <div>
              <Label htmlFor="active" className="text-sm font-medium">Active</Label>
              <p className="text-[11px] text-muted-foreground">Inactive rules won't run</p>
            </div>
            <Switch
              id="active"
              checked={form.active}
              onCheckedChange={(v) => setForm((p) => ({ ...p, active: v }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {rule ? 'Save Changes' : 'Create Rule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
