'use client'

import Link from 'next/link'
import { ChevronLeft, MoreHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileHeaderProps {
  title?: string
  showBack?: boolean
  onBack?: () => void
  backHref?: string
  showClose?: boolean
  onClose?: () => void
  rightAction?: React.ReactNode
  className?: string
}

export function MobileHeader({
  title,
  showBack = false,
  onBack,
  backHref,
  showClose = false,
  onClose,
  rightAction,
  className,
}: MobileHeaderProps) {
  return (
    <header className={cn('sticky top-0 z-40 bg-white border-b border-gray-200', className)}>
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left side */}
        <div className="flex items-center gap-2 min-w-[60px]">
          {showBack && (
            backHref ? (
              <Link href={backHref} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </Link>
            ) : (
              <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>
            )
          )}
          {!showBack && !title && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Verto</span>
            </Link>
          )}
        </div>

        {/* Title */}
        {title && (
          <h1 className="text-lg font-semibold text-gray-900 absolute left-1/2 -translate-x-1/2">
            {title}
          </h1>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 min-w-[60px] justify-end">
          {rightAction}
          {showClose && (
            <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-gray-100">
              <X className="w-6 h-6 text-gray-700" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
