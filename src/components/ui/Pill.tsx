import { cn } from '@/lib/utils'

interface PillProps {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  variant?: 'default' | 'success' | 'primary'
  size?: 'sm' | 'md'
  className?: string
}

export function Pill({
  children,
  active = false,
  onClick,
  variant = 'default',
  size = 'md',
  className,
}: PillProps) {
  const baseStyles = 'inline-flex items-center rounded-full font-medium transition-colors whitespace-nowrap'

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  }

  const variantStyles = {
    default: active
      ? 'bg-gray-900 text-white'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    success: 'bg-primary-50 text-primary border border-primary-200',
    primary: active
      ? 'bg-primary text-white'
      : 'bg-primary-50 text-primary hover:bg-primary-100',
  }

  const Component = onClick ? 'button' : 'span'

  return (
    <Component
      onClick={onClick}
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </Component>
  )
}
