'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { useProject } from '@/hooks/use-project'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ChevronDown, Plus, Building2, Briefcase, FolderKanban, Check, Settings2 } from 'lucide-react'

const TYPE_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  company: { label: 'Company', icon: Building2 },
  client: { label: 'Client', icon: Briefcase },
  project: { label: 'Project', icon: FolderKanban },
}

export function ProjectSwitcher() {
  const { projects, activeProject, activeProjectId, setActiveProject, loading } = useProject()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const setSection = useAppStore((s) => s.setSection)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (loading) {
    return (
      <div className="px-3 py-3 border-b-[3px] border-black bg-white">
        <div className="h-10 bg-muted animate-pulse" />
      </div>
    )
  }

  if (projects.length === 0) {
    return (
      <div className="px-3 py-3 border-b-[3px] border-black bg-[var(--brutal-yellow)]">
        <div className="text-[10px] font-bold uppercase tracking-widest text-black/60 mb-1">No projects yet</div>
        <Button
          size="sm"
          className="w-full bg-black text-[var(--brutal-yellow)]"
          onClick={() => setSection('projects')}
        >
          <Plus className="h-4 w-4" />
          Create Project
        </Button>
      </div>
    )
  }

  return (
    <div ref={dropdownRef} className="relative px-3 py-3 border-b-[3px] border-black bg-white">
      <div className="text-[10px] font-bold uppercase tracking-widest text-black/60 mb-1.5 px-1">
        Active Project
      </div>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-2 p-2 border-[3px] border-black bg-card shadow-brutal-sm transition-all',
          'hover:shadow-brutal hover:-translate-x-0.5 hover:-translate-y-0.5',
          open && 'shadow-brutal -translate-x-0.5 -translate-y-0.5'
        )}
      >
        <div
          className="h-8 w-8 flex items-center justify-center text-lg shrink-0 border-[2px] border-black"
          style={{ backgroundColor: activeProject?.color || '#f5e642' }}
        >
          {activeProject?.emoji || '📁'}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="font-display text-lg leading-none tracking-wide truncate">
            {activeProject?.name || 'Select project'}
          </div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-black/60 mt-0.5">
            {TYPE_META[activeProject?.type || 'company']?.label || 'Project'}
          </div>
        </div>
        <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-white border-[3px] border-black shadow-brutal z-50 max-h-80 overflow-y-auto scrollbar-thin">
          <div className="text-[10px] font-bold uppercase tracking-widest text-black/60 px-3 py-2 border-b-[3px] border-black bg-[var(--brutal-yellow)]">
            Switch Project ({projects.length})
          </div>
          <div className="py-1">
            {projects.map((project) => {
              const TypeIcon = TYPE_META[project.type]?.icon || FolderKanban
              const isActive = project.id === activeProjectId
              return (
                <button
                  key={project.id}
                  onClick={() => {
                    setActiveProject(project.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors border-b-[1px] border-black/10',
                    isActive ? 'bg-black text-[var(--brutal-yellow)]' : 'hover:bg-[var(--brutal-yellow)]'
                  )}
                >
                  <div
                    className="h-7 w-7 flex items-center justify-center text-sm shrink-0 border-[2px] border-black"
                    style={{ backgroundColor: project.color || '#f5e642' }}
                  >
                    {project.emoji || '📁'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-base leading-none tracking-wide truncate">
                      {project.name}
                    </div>
                    <div className={cn(
                      'text-[9px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1',
                      isActive ? 'text-[var(--brutal-yellow)]/70' : 'text-black/50'
                    )}>
                      <TypeIcon className="h-2.5 w-2.5" />
                      {TYPE_META[project.type]?.label || 'Project'}
                    </div>
                  </div>
                  {isActive && <Check className="h-4 w-4 shrink-0" />}
                </button>
              )
            })}
          </div>
          <div className="border-t-[3px] border-black">
            <button
              onClick={() => {
                setOpen(false)
                setSection('projects')
              }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-black hover:text-[var(--brutal-yellow)] transition-colors"
            >
              <Settings2 className="h-4 w-4" />
              <span className="font-display text-base tracking-wide">MANAGE PROJECTS</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
