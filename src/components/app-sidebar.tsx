'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type SectionId } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet'
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
} from 'lucide-react'

interface NavItem {
  id: SectionId
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Overview & quick stats' },
  { id: 'agent', label: 'AI Campaign Agent', icon: MessageSquare, description: 'Chat & auto-generate month' },
  { id: 'studio', label: 'AI Content Studio', icon: Sparkles, description: 'Generate captions & ideas' },
  { id: 'brand', label: 'Brand Memory', icon: Building2, description: 'Brand voice & audience' },
  { id: 'calendar', label: 'Content Calendar', icon: CalendarDays, description: 'Schedule & queue posts' },
  { id: 'assets', label: 'Asset Library', icon: Images, description: 'Images, videos & templates' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Performance insights' },
  { id: 'autopilot', label: 'Auto-Pilot Rules', icon: Bot, description: 'Automation workflows' },
]

function BrandHeader() {
  const [brand, setBrand] = useState<any>(null)

  useEffect(() => {
    fetch('/api/brand')
      .then((r) => r.json())
      .then((data) => {
        if (data.brands?.length) setBrand(data.brands[0])
      })
      .catch(() => {})
  }, [])

  const initials = brand?.name
    ? brand.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'AM'

  return (
    <div className="flex items-center gap-3 px-3 py-4">
      <div className="relative">
        <Avatar className="h-10 w-10 border border-border bg-primary/10">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold truncate text-foreground">
          {brand?.name || 'No brand yet'}
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {brand?.industry || 'Set up your brand →'}
        </div>
      </div>
    </div>
  )
}

function NavList() {
  const activeSection = useAppStore((s) => s.activeSection)
  const setSection = useAppStore((s) => s.setSection)

  return (
    <nav className="flex flex-col gap-1 px-3 py-2 flex-1 overflow-y-auto scrollbar-thin">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = activeSection === item.id
        return (
          <button
            key={item.id}
            onClick={() => setSection(item.id)}
            className={cn(
              'group flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all',
              'hover:bg-accent hover:text-accent-foreground',
              active && 'bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground'
            )}
          >
            <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', !active && 'text-muted-foreground group-hover:text-foreground')} />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium leading-tight">{item.label}</div>
              <div className={cn(
                'text-[11px] leading-tight mt-0.5 truncate',
                active ? 'text-primary-foreground/80' : 'text-muted-foreground'
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
    <div className="px-3 py-3 border-t border-border space-y-2">
      <Button
        size="sm"
        className="w-full justify-start gap-2"
        onClick={() => setSection('studio')}
      >
        <Plus className="h-4 w-4" />
        New Content
      </Button>
      <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
        <Zap className="h-3 w-3 text-primary" />
        <span>AutoMarket AI v0.1</span>
        <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1.5 py-0">Beta</Badge>
      </div>
    </div>
  )
}

function SidebarContent() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
            A
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">AutoMarket AI</div>
            <div className="text-[11px] text-muted-foreground">1-Man Marketing Hub</div>
          </div>
        </div>
      </div>
      <BrandHeader />
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

  // Wrap buttons to also close mobile sheet
  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
            A
          </div>
          <span className="font-semibold">AutoMarket AI</span>
        </div>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            <MobileNavContent onSelect={handleSectionSelect} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-sidebar/50 backdrop-blur sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Spacer for mobile top bar */}
      <div className="lg:hidden h-14" />
    </>
  )
}

function MobileNavContent({ onSelect }: { onSelect: (s: SectionId) => void }) {
  const activeSection = useAppStore((s) => s.activeSection)
  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
            A
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">AutoMarket AI</div>
            <div className="text-[11px] text-muted-foreground">1-Man Marketing Hub</div>
          </div>
        </div>
      </div>
      <nav className="flex flex-col gap-1 px-3 py-3 flex-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all',
                'hover:bg-accent hover:text-accent-foreground',
                active && 'bg-primary text-primary-foreground shadow-sm'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-tight">{item.label}</div>
                <div className={cn(
                  'text-[11px] leading-tight mt-0.5 truncate',
                  active ? 'text-primary-foreground/80' : 'text-muted-foreground'
                )}>
                  {item.description}
                </div>
              </div>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
