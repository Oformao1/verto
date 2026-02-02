import Image from 'next/image'
import { cn, getInitials } from '@/lib/utils'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name)

  if (src) {
    return (
      <div className={cn('relative rounded-full overflow-hidden', sizes[size], className)}>
        <Image
          src={src}
          alt={name || 'Avatar'}
          fill
          className="object-cover"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary-100 text-primary-700 font-medium',
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  )
}
