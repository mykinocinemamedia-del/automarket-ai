'use client'

import { useState, useEffect } from 'react'
import { SectionHeader } from '@/components/section-header'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { useBrand } from '@/hooks/use-brand'
import { useAppStore } from '@/lib/store'
import { CalendarDays, Plus, Clock, Trash2, Edit3, Loader2, List, LayoutGrid, ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react'
import { PLATFORMS, POST_STATUSES, getPlatformMeta, getStatusMeta, formatDateTime, timeAgo, timeUntil } from '@/lib/platforms'

interface Post {
  id: string
  title: string
  body: string
  platform: string
  status: string
  hashtags?: string | null
  scheduledAt?: string | null
  publishedAt?: string | null
  createdAt: string
}

export function CalendarSection() {
  const [tab, setTab] = useState('list')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Post | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const activeProjectId = useAppStore((s) => s.activeProjectId)

  const load = async () => {
    if (!activeProjectId) {
      setPosts([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/posts?projectId=${activeProjectId}`)
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (e: any) {
      toast({ title: 'Failed to load posts', description: e.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [activeProjectId])

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (post: Post) => {
    setEditing(post)
    setDialogOpen(true)
  }

  const handleSave = async (post: Partial<Post>) => {
    try {
      const method = post.id ? 'PATCH' : 'POST'
      const res = await fetch('/api/posts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      })
      if (!res.ok) throw new Error('Failed')
      toast({ title: post.id ? 'Post updated' : 'Post created' })
      setDialogOpen(false)
      await load()
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return
    try {
      await fetch(`/api/posts?id=${id}`, { method: 'DELETE' })
      toast({ title: 'Post deleted' })
      await load()
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' })
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch('/api/posts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, publishedAt: status === 'published' ? new Date().toISOString() : undefined }),
      })
      toast({ title: `Marked as ${status}` })
      await load()
    } catch (e: any) {
      toast({ title: 'Update failed', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-7xl mx-auto">
      <SectionHeader
        title="Content Calendar"
        description="Plan, schedule, and track every post across all your platforms."
        icon={CalendarDays}
        actions={
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list" className="gap-1.5">
            <List className="h-3.5 w-3.5" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5">
            <LayoutGrid className="h-3.5 w-3.5" />
            Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4">
          <PostList
            posts={posts}
            loading={loading}
            onEdit={openEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <CalendarView posts={posts} loading={loading} onEdit={openEdit} />
        </TabsContent>
      </Tabs>

      <PostDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        post={editing}
        onSave={handleSave}
      />
    </div>
  )
}

function PostList({
  posts,
  loading,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  posts: Post[]
  loading: boolean
  onEdit: (p: Post) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, s: string) => void
}) {
  const [filter, setFilter] = useState<string>('all')

  const filtered = filter === 'all' ? posts : posts.filter((p) => p.status === filter)

  const counts: Record<string, number> = { all: posts.length }
  for (const s of POST_STATUSES) counts[s.id] = posts.filter((p) => p.status === s.id).length

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-12">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading posts...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {['all', ...POST_STATUSES.map((s) => s.id)].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filter === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent'
            }`}
          >
            {s === 'all' ? 'All' : getStatusMeta(s).label}
            <span className="ml-1.5 opacity-70">({counts[s] || 0})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium mb-1">No posts yet</p>
            <p className="text-xs text-muted-foreground">Tap "New Post" or generate one in the Content Studio.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((post) => {
            const platform = getPlatformMeta(post.platform)
            const status = getStatusMeta(post.status)
            const PlatformIcon = platform.icon
            return (
              <Card key={post.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${platform.color}20`, color: platform.color }}
                    >
                      <PlatformIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-medium text-sm truncate">{post.title}</h3>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{post.body}</p>
                      <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
                        {post.scheduledAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(post.scheduledAt)} ({timeUntil(post.scheduledAt)})
                          </span>
                        )}
                        {post.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Published {timeAgo(post.publishedAt)}
                          </span>
                        )}
                        {post.hashtags && (
                          <span className="truncate max-w-[200px]">{post.hashtags}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Select value={post.status} onValueChange={(v) => onStatusChange(post.id, v)}>
                        <SelectTrigger className="h-7 w-[100px] text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {POST_STATUSES.map((s) => (
                            <SelectItem key={s.id} value={s.id} className="text-xs">
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(post)}>
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(post.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CalendarView({ posts, loading, onEdit }: { posts: Post[]; loading: boolean; onEdit: (p: Post) => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startWeekday = firstDay.getDay() // 0 = Sunday

  const postsByDate: Record<string, Post[]> = {}
  for (const p of posts) {
    const date = p.scheduledAt || p.publishedAt || p.createdAt
    const d = new Date(date)
    // Only include posts from current month
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate()
      if (!postsByDate[key]) postsByDate[key] = []
      postsByDate[key].push(p)
    }
  }

  const today = new Date()
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))
  const goToday = () => setCurrentMonth(new Date())

  const monthName = currentMonth.toLocaleString('en-MY', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-12">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading calendar...
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">{monthName}</CardTitle>
          <CardDescription className="text-xs">{posts.filter((p) => {
            const d = new Date(p.scheduledAt || p.publishedAt || p.createdAt)
            return d.getFullYear() === year && d.getMonth() === month
          }).length} posts this month</CardDescription>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday} className="text-xs h-8">
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-[10px] font-medium text-muted-foreground text-center py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startWeekday }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square min-h-[60px] sm:min-h-[80px] rounded-md bg-muted/30" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayPosts = postsByDate[day] || []
            const today_ = isToday(day)
            return (
              <div
                key={day}
                className={`aspect-square min-h-[60px] sm:min-h-[80px] rounded-md border p-1 overflow-hidden flex flex-col gap-0.5 ${
                  today_ ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className={`text-[10px] font-medium ${today_ ? 'text-primary' : 'text-muted-foreground'}`}>
                  {day}
                </div>
                <div className="flex-1 space-y-0.5 overflow-hidden">
                  {dayPosts.slice(0, 3).map((post) => {
                    const platform = getPlatformMeta(post.platform)
                    const PlatformIcon = platform.icon
                    return (
                      <button
                        key={post.id}
                        onClick={() => onEdit(post)}
                        className="w-full flex items-center gap-1 px-1 py-0.5 rounded text-[9px] hover:bg-accent transition-colors text-left"
                        style={{ borderLeft: `2px solid ${platform.color}` }}
                      >
                        <PlatformIcon className="h-2.5 w-2.5 shrink-0" style={{ color: platform.color }} />
                        <span className="truncate">{post.title}</span>
                      </button>
                    )
                  })}
                  {dayPosts.length > 3 && (
                    <div className="text-[9px] text-muted-foreground px-1">+{dayPosts.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function PostDialog({
  open,
  onOpenChange,
  post,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  post: Post | null
  onSave: (p: Partial<Post>) => void
}) {
  const { brandId } = useBrand()
  const activeProjectId = useAppStore((s) => s.activeProjectId)
  const [form, setForm] = useState({
    title: '',
    body: '',
    platform: 'instagram',
    status: 'draft',
    hashtags: '',
    scheduledAt: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (post) {
      setForm({
        title: post.title,
        body: post.body,
        platform: post.platform,
        status: post.status,
        hashtags: post.hashtags || '',
        scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '',
      })
    } else {
      setForm({
        title: '',
        body: '',
        platform: 'instagram',
        status: 'draft',
        hashtags: '',
        scheduledAt: '',
      })
    }
  }, [post, open])

  const save = async () => {
    if (!form.title.trim() || !form.body.trim()) return
    setSaving(true)
    try {
      await onSave({
        id: post?.id,
        title: form.title,
        body: form.body,
        platform: form.platform,
        status: form.status,
        hashtags: form.hashtags || undefined,
        scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : undefined,
        brandId,
        projectId: activeProjectId,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? 'Edit Post' : 'New Post'}</DialogTitle>
          <DialogDescription>
            {post ? 'Update the post details.' : 'Create a new post for any platform.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="Internal title for your reference"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select value={form.platform} onValueChange={(v) => setForm((p) => ({ ...p, platform: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POST_STATUSES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="body">Caption / Body <span className="text-destructive">*</span></Label>
            <Textarea
              id="body"
              value={form.body}
              onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
              rows={6}
              placeholder="Write or paste your caption here..."
            />
            <div className="text-[11px] text-muted-foreground text-right">{form.body.length} characters</div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hashtags">Hashtags</Label>
            <Input
              id="hashtags"
              value={form.hashtags}
              onChange={(e) => setForm((p) => ({ ...p, hashtags: e.target.value }))}
              placeholder="#hashtag1 #hashtag2 ..."
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="scheduled">Schedule for</Label>
            <Input
              id="scheduled"
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm((p) => ({ ...p, scheduledAt: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.title.trim() || !form.body.trim()} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {post ? 'Save Changes' : 'Create Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
