'use client'

import { useState } from 'react'
import { useAppStore, type SectionId } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
import { ProjectSwitcher } from '@/components/project-switcher'
import {
  LayoutDashboard,
  Sparkles,
  Building2,
  CalendarDays,
  Images,
  BarChart3,
  Bot,
  Menu,
  Zap,
  Plus,
  MessageSquare,
  FolderKanban,
  TrendingUp,
} from 'lucide-react'

interface NavItem {
  id: SectionId
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & quick stats' },
  { id: 'projects', label: 'Projects', icon: FolderKanban, description: 'Manage all companies & clients' },
  { id: 'trends', label: 'Trend Agent', icon: TrendingUp, description: 'Autonomous trend monitoring' },
  { id: 'agent', label: 'AI Campaign Agent', icon: MessageSquare, description: 'Chat & auto-generate month' },
  { id: 'studio', label: 'AI Content Studio', icon: Sparkles, description: 'Generate captions & ideas' },
  { id: 'brand', label: 'Brand Memory', icon: Building2, description: 'Brand voice & audience' },
  { id: 'calendar', label: 'Content Calendar', icon: CalendarDays, description: 'Schedule & queue posts' },
  { id: 'assets', label: 'Asset Library', icon: Images, description: 'Images, videos & templates' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Performance insights' },
  { id: 'autopilot', label: 'Auto-Pilot Rules', icon: Bot, description: 'Automation workflows' },
]

function NavList({ onSelect }: { onSelect?: (s: SectionId) => void }) {
  const activeSection = useAppStore((s) => s.activeSection)
  const setSection = useAppStore((s) => s.setSection)

  const handleClick = (id: SectionId) => {
    setSection(id)
    onSelect?.(id)
  }

  return (
    <nav className="flex flex-col gap-1.5 px-3 py-3 flex-1 overflow-y-auto scrollbar-thin">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = activeSection === item.id
        return (
          <button
            key={item.id}
            onClick={() => handleClick(item.id)}
            className={cn(
              'group flex items-start gap-3 px-3 py-2.5 text-left transition-all border-[3px] border-transparent',
              active
                ? 'bg-black text-[var(--brutal-yellow)] border-black shadow-brutal-sm'
                : 'hover:bg-[var(--brutal-yellow)] hover:border-black'
            )}
          >
            <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', !active && 'text-black group-hover:text-black')} />
            <div className="min-w-0 flex-1">
              <div className="font-display text-base leading-none tracking-wide">
                {item.label}
              </div>
              <div className={cn(
                'text-[10px] font-semibold uppercase tracking-wider mt-1 truncate',
                active ? 'text-[var(--brutal-yellow)]/70' : 'text-black/50'
              )}>
                {item.description}
              </div>
            </div>
          </button>
        )
      })}
    </nav>
  )
}

function SidebarFooter() {
  const setSection = useAppStore((s) => s.setSection)
  return (
    <div className="px-3 py-3 border-t-[3px] border-black space-y-2">
      <Button
        size="sm"
        className="w-full justify-start gap-2"
        onClick={() => setSection('studio')}
      >
        <Plus className="h-4 w-4" />
        New Content
      </Button>
      <div className="flex items-center gap-2 px-1 text-[10px] font-bold uppercase tracking-widest text-black/60">
        <Zap className="h-3 w-3 text-[var(--brutal-red)]" />
        <span>Kino Social v2.0</span>
        <Badge variant="outline" className="ml-auto text-[9px] h-5 px-1.5 py-0 bg-[var(--brutal-green)] text-black border-black">LIVE</Badge>
      </div>
    </div>
  )
}

function SidebarContent() {
  return (
    <div className="flex flex-col h-full bg-[var(--brutal-cream)]">
      <div className="px-3 pt-4 pb-3 border-b-[3px] border-black">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-black text-[var(--brutal-yellow)] flex items-center justify-center font-display text-2xl border-[3px] border-black shadow-brutal-sm">
            K
          </div>
          <div>
            <div className="font-display text-2xl leading-none tracking-wide">KINO SOCIAL</div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-black/60 mt-0.5">MULTI-PROJECT MARKETING HUB</div>
          </div>
        </div>
      </div>
      <ProjectSwitcher />
      <NavList />
      <SidebarFooter />
    </div>
  )
}

export function AppSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSectionSelect = (s: SectionId) => {
    useAppStore.getState().setSection(s)
    setMobileOpen(false)
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 border-b-[3px] border-black bg-[var(--brutal-cream)]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-black text-[var(--brutal-yellow)] flex items-center justify-center font-display text-lg border-[2px] border-black">
            K
          </div>
          <span className="font-display text-lg tracking-wide">KINO SOCIAL</span>
        </div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="border-[3px] border-black shadow-brutal-sm">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 border-r-[3px] border-black">
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <div className="h-full">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r-[3px] border-black bg-[var(--brutal-cream)] sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Spacer for mobile top bar */}
      <div className="lg:hidden h-14" />
    </>
  )
}
