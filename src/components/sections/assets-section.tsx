'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from '@/components/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'
import { Images, Plus, Trash2, Loader2, Search, ExternalLink, Image as ImageIcon, Video, FileText, Music } from 'lucide-react'

interface Asset {
  id: string
  name: string
  type: string
  url: string
  tags?: string | null
  createdAt: string
}

const TYPE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  image: { icon: ImageIcon, label: 'Image' },
  video: { icon: Video, label: 'Video' },
  audio: { icon: Music, label: 'Audio' },
  document: { icon: FileText, label: 'Document' },
}

export function AssetsSection() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const activeProjectId = useAppStore((s) => s.activeProjectId)

  const load = async () => {
    if (!activeProjectId) {
      setAssets([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/assets?projectId=${activeProjectId}`)
      const data = await res.json()
      setAssets(data.assets || [])
    } catch (e: any) {
      toast({ title: 'Failed to load assets', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [activeProjectId])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return
    try {
      await fetch(`/api/assets?id=${id}`, { method: 'DELETE' })
      toast({ title: 'Asset deleted' })
      await load()
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' })
    }
  }

  const filtered = assets.filter((a) => {
    if (filter !== 'all' && a.type !== filter) return false
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.tags?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts: Record<string, number> = { all: assets.length }
  for (const t of Object.keys(TYPE_META)) counts[t] = assets.filter((a) => a.type === t).length

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
      <SectionHeader
        title="Asset Library"
        description="Centralize your images, videos, and templates so you can reuse them across posts."
        icon={Images}
        actions={
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-1">
          {['all', ...Object.keys(TYPE_META)].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                filter === t ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent'
              }`}
            >
              {t === 'all' ? 'All' : TYPE_META[t].label}
              <span className="ml-1.5 opacity-70">({counts[t] || 0})</span>
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-12">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading assets...
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Images className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium mb-1">No assets yet</p>
            <p className="text-xs text-muted-foreground">Add images, videos, or templates by URL to build your library.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((asset) => {
            const meta = TYPE_META[asset.type] || TYPE_META.image
            const Icon = meta.icon
            return (
              <Card key={asset.id} className="overflow-hidden group hover:shadow-sm transition-shadow">
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {asset.type === 'image' ? (
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Icon className="h-10 w-10" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(asset.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="text-[10px] h-5 capitalize">
                      <Icon className="h-2.5 w-2.5 mr-1" />
                      {asset.type}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{asset.name}</p>
                      {asset.tags && (
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{asset.tags}</p>
                      )}
                    </div>
                    <a
                      href={asset.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AddAssetDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={load} projectId={activeProjectId} />
    </div>
  )
}

function AddAssetDialog({
  open,
  onOpenChange,
  onSaved,
  projectId,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSaved: () => void
  projectId: string | null
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState('image')
  const [url, setUrl] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const save = async () => {
    if (!name.trim() || !url.trim()) {
      toast({ title: 'Name and URL required', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, url, tags, projectId }),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: 'Asset added' })
      setName('')
      setUrl('')
      setTags('')
      setType('image')
      onOpenChange(false)
      onSaved()
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Asset</DialogTitle>
          <DialogDescription>Add an image, video, or document by URL.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="asset-name">Name <span className="text-destructive">*</span></Label>
            <Input id="asset-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Latte art rosetta" />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Tabs value={type} onValueChange={setType}>
              <TabsList className="grid w-full grid-cols-4">
                {Object.entries(TYPE_META).map(([k, v]) => (
                  <TabsTrigger key={k} value={k} className="text-xs">
                    {v.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="asset-url">URL <span className="text-destructive">*</span></Label>
            <Input id="asset-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="asset-tags">Tags (comma-separated)</Label>
            <Input id="asset-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="coffee, latte, art" />
          </div>
          {type === 'image' && url && (
            <div className="rounded-lg border border-border overflow-hidden aspect-video bg-muted">
              <img src={url} alt="preview" className="w-full h-full object-cover" onError={(e) => ((e.target as HTMLImageElement).style.opacity = '0.2')} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Asset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
