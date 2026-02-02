import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  const startDate = new Date(start)
  const endDate = new Date(end)

  const sameMonth = startDate.getMonth() === endDate.getMonth() &&
                    startDate.getFullYear() === endDate.getFullYear()

  if (sameMonth) {
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.getDate()}, ${endDate.getFullYear()}`
  }

  return `${formatDate(start)} - ${formatDate(end)}`
}

export function calculateNights(start: Date | string, end: Date | string): number {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateDeviceFingerprint(
  userAgent: string | null,
  ip: string | null
): string {
  // Simple heuristic: hash of user agent + IP substring
  const ua = userAgent || 'unknown'
  const ipPrefix = ip?.split('.').slice(0, 2).join('.') || 'unknown'
  return Buffer.from(`${ua}:${ipPrefix}`).toString('base64').slice(0, 32)
}
