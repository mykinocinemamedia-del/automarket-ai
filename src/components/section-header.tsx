'use client'

import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  actions?: React.ReactNode
  className?: string
}

export function SectionHeader({ title, description, icon: Icon, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6', className)}>
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="h-12 w-12 bg-[var(--brutal-yellow)] text-black flex items-center justify-center shrink-0 border-[3px] border-black shadow-brutal-sm">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-4xl sm:text-5xl leading-none tracking-wide">{title}</h1>
          {description && (
            <p className="text-xs font-semibold uppercase tracking-widest text-black/60 mt-2 max-w-2xl">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
