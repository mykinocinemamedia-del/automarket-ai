import {
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Music2,
} from 'lucide-react'

export const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: '#1877F2' },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
  { id: 'twitter', label: 'Twitter / X', icon: Twitter, color: '#1DA1F2' },
  { id: 'tiktok', label: 'TikTok', icon: Music2, color: '#000000' },
] as const

export type PlatformId = (typeof PLATFORMS)[number]['id']

export function getPlatformMeta(id: string) {
  return PLATFORMS.find((p) => p.id === id) || PLATFORMS[0]
}

export const POST_STATUSES = [
  { id: 'draft', label: 'Draft', color: 'bg-muted text-muted-foreground' },
  { id: 'scheduled', label: 'Scheduled', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { id: 'published', label: 'Published', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { id: 'failed', label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
] as const

export function getStatusMeta(id: string) {
  return POST_STATUSES.find((s) => s.id === id) || POST_STATUSES[0]
}

export function formatDate(d: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  })
}

export function formatDateTime(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleString('en-MY', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(date)
}

export function timeUntil(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const seconds = Math.floor((date.getTime() - Date.now()) / 1000)
  if (seconds < 0) return 'overdue'
  if (seconds < 3600) return `in ${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `in ${Math.floor(seconds / 3600)}h`
  return `in ${Math.floor(seconds / 86400)}d`
}
