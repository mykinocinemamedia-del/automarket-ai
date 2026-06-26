'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { AppSidebar } from '@/components/app-sidebar'
import { DashboardSection } from '@/components/sections/dashboard-section'
import { ContentStudioSection } from '@/components/sections/content-studio-section'
import { BrandSection } from '@/components/sections/brand-section'
import { CalendarSection } from '@/components/sections/calendar-section'
import { AssetsSection } from '@/components/sections/assets-section'
import { AnalyticsSection } from '@/components/sections/analytics-section'
import { AutopilotSection } from '@/components/sections/autopilot-section'

export default function Home() {
  const activeSection = useAppStore((s) => s.activeSection)

  // Scroll to top when section changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [activeSection])

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {activeSection === 'dashboard' && <DashboardSection />}
        {activeSection === 'studio' && <ContentStudioSection />}
        {activeSection === 'brand' && <BrandSection />}
        {activeSection === 'calendar' && <CalendarSection />}
        {activeSection === 'assets' && <AssetsSection />}
        {activeSection === 'analytics' && <AnalyticsSection />}
        {activeSection === 'autopilot' && <AutopilotSection />}
      </main>
    </div>
  )
}
