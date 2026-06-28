'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from '@/components/section-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useProject } from '@/hooks/use-project'
import { useAppStore } from '@/lib/store'
import { FolderKanban, Plus, Trash2, Edit3, Loader2, Building2, Briefcase, FolderKanban as FolderIcon, Check, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_OPTIONS = [
  { id: 'company', label: 'Company', icon: Building2, desc: 'Your own business' },
  { id: 'client', label: 'Client', icon: Briefcase, desc: 'Client project' },
  { id: 'project', label: 'Project', icon: FolderIcon, desc: 'Specific campaign' },
]

const COLOR_OPTIONS = ['#f5e642', '#00e060', '#4d9fff', '#e8180a', '#8B5A3C', '#0a0a0a', '#ff6b9d', '#7c3aed']
const EMOJI_OPTIONS = ['☕', '💪', '🚀', '🎨', '🍔', '📸', '💼', '🎯', '🔥', '⭐', '🎵', '🌿', '👗', '💻', '🏥', '📚']

export function ProjectsSection() {
  const { projects, activeProjectId, setActiveProject, refresh, loading } = useProject()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const { toast } = useToast()
  const setSection = useAppStore((s) => s.setSection)

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (project: any) => {
    setEditing(project)
    setDialogOpen(true)
  }

  const handleSave = async (data: any) => {
    try {
      const method = editing ? 'PATCH' : 'POST'
      const body = editing ? { id: editing.id, ...data } : data
      const res = await fetch('/api/projects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      const { project } = await res.json()

      // If new project, set it as active
      if (!editing && project) {
        setActiveProject(project.id)
      }
      toast({ title: editing ? 'Project updated' : 'Project created' })
      setDialogOpen(false)
      await refresh()
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will permanently delete ALL posts, assets, rules, and analytics for this project. This cannot be undone.`)) return
    try {
      await fetch(`/api/projects?id=${id}`, { method: 'DELETE' })
      toast({ title: 'Project deleted', description: 'All related data has been removed.' })
      // If we deleted the active project, switch to first available
      if (activeProjectId === id) {
        const remaining = projects.filter((p) => p.id !== id)
        if (remaining.length > 0) {
          setActiveProject(remaining[0].id)
        } else {
          setActiveProject(null)
        }
      }
      await refresh()
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
      <SectionHeader
        title="Projects"
        description="Manage all your companies, clients, and campaigns. Each project has its own brand, content, and analytics — completely separate from each other."
        icon={FolderKanban}
        actions={
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-black/60 py-12">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <Card className="bg-[var(--brutal-yellow)]">
          <CardContent className="py-12 text-center">
            <FolderKanban className="h-12 w-12 mx-auto mb-3" />
            <p className="font-display text-2xl mb-2">NO PROJECTS YET</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-black/60 mb-4">
              Create your first project to get started
            </p>
            <Button onClick={openNew} size="sm" className="gap-2 bg-black text-[var(--brutal-yellow)]">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const TypeIcon = TYPE_OPTIONS.find((t) => t.id === project.type)?.icon || FolderIcon
            const isActive = project.id === activeProjectId
            return (
              <Card
                key={project.id}
                className={cn(
                  'hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all',
                  isActive && 'ring-[3px] ring-black ring-offset-2 ring-offset-background'
                )}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="h-12 w-12 flex items-center justify-center text-2xl shrink-0 border-[3px] border-black"
                      style={{ backgroundColor: project.color || '#f5e642' }}
                    >
                      {project.emoji || '📁'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-2xl leading-none tracking-wide truncate">
                        {project.name}
                      </div>
                      <Badge variant="outline" className="mt-1 gap-1">
                        <TypeIcon className="h-2.5 w-2.5" />
                        {TYPE_OPTIONS.find((t) => t.id === project.type)?.label || 'Project'}
                      </Badge>
                    </div>
                    {isActive && (
                      <div className="bg-[var(--brutal-green)] text-black px-2 py-1 text-[9px] font-bold uppercase tracking-widest border-[2px] border-black">
                        <Check className="h-3 w-3 inline mr-0.5" />
                        Active
                      </div>
                    )}
                  </div>

                  {project.description && (
                    <p className="text-xs font-medium text-black/70 mb-4 border-l-[3px] border-[var(--brutal-red)] pl-3 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1 pt-3 border-t-[3px] border-black">
                    {!isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => {
                          setActiveProject(project.id)
                          toast({ title: `Switched to ${project.name}` })
                          setSection('dashboard')
                        }}
                      >
                        <ArrowRight className="h-3 w-3" />
                        Switch
                      </Button>
                    )}
                    {isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => setSection('dashboard')}
                      >
                        View Dashboard
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1 ml-auto"
                      onClick={() => openEdit(project)}
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1 text-destructive"
                      onClick={() => handleDelete(project.id, project.name)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        project={editing}
        onSave={handleSave}
      />
    </div>
  )
}

function ProjectDialog({
  open,
  onOpenChange,
  project,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  project: any | null
  onSave: (data: any) => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState('company')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#f5e642')
  const [emoji, setEmoji] = useState('📁')
  const [saving, setSaving] = useState(false)

  // Reset form when dialog opens or project changes
  useEffect(() => {
    if (!open) return
    if (project) {
      setName(project.name || '')
      setType(project.type || 'company')
      setDescription(project.description || '')
      setColor(project.color || '#f5e642')
      setEmoji(project.emoji || '📁')
    } else {
      setName('')
      setType('company')
      setDescription('')
      setColor('#f5e642')
      setEmoji('📁')
    }
  }, [open, project])

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave({ name, type, description, color, emoji })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit Project' : 'New Project'}</DialogTitle>
          <DialogDescription>
            {project ? 'Update project details.' : 'Create a new project for a company, client, or campaign.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="proj-name">Project Name <span className="text-destructive">*</span></Label>
            <Input
              id="proj-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kopi Senja, Acme Corp, Q1 Launch"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Project Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const active = type === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={() => setType(opt.id)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 border-[3px] transition-all',
                      active ? 'bg-black text-[var(--brutal-yellow)] border-black shadow-brutal-sm' : 'border-black hover:bg-[var(--brutal-yellow)]'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-display text-sm tracking-wide">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="proj-desc">Description</Label>
            <Textarea
              id="proj-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this project..."
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    'h-9 w-9 border-[3px] border-black transition-all',
                    color === c && 'shadow-brutal-sm scale-110'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Emoji</Label>
            <div className="flex flex-wrap gap-1.5">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={cn(
                    'h-9 w-9 flex items-center justify-center text-lg border-[3px] border-black transition-all',
                    emoji === e ? 'bg-[var(--brutal-yellow)] shadow-brutal-sm scale-110' : 'bg-white hover:bg-muted'
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 border-[3px] border-black bg-muted">
            <div className="text-[10px] font-bold uppercase tracking-widest text-black/60 mb-2">Preview</div>
            <div className="flex items-center gap-2">
              <div
                className="h-10 w-10 flex items-center justify-center text-xl border-[3px] border-black"
                style={{ backgroundColor: color }}
              >
                {emoji}
              </div>
              <div>
                <div className="font-display text-lg leading-none tracking-wide">{name || 'Project Name'}</div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-black/60 mt-0.5">
                  {TYPE_OPTIONS.find((t) => t.id === type)?.label}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !name.trim()} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {project ? 'Save Changes' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
