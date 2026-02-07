'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Calendar, Repeat, MessageSquare, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/explore', label: 'Hosts', icon: Home },
  { href: '/trips', label: 'Stays', icon: Calendar },
  { href: '/swaps', label: 'Swaps', icon: Repeat },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname?.startsWith(`${tab.href}/`)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive ? 'text-primary' : 'text-gray-400'
              )}
            >
              <tab.icon className={cn('w-6 h-6', isActive && 'stroke-[2.5]')} />
              <span className={cn('text-xs', isActive ? 'font-semibold' : 'font-medium')}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
