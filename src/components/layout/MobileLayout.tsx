'use client'

import { BottomNav } from '@/components/ui'

interface MobileLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
  showBottomNav?: boolean
}

export function MobileLayout({ children, header, showBottomNav = true }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {header}

      {/* Main content with bottom padding for nav */}
      <main className={showBottomNav ? 'pb-20' : ''}>
        {children}
      </main>

      {/* Bottom navigation */}
      {showBottomNav && <BottomNav />}
    </div>
  )
}
