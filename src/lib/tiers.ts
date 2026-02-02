import { prisma } from './prisma'
import { config, getHostTier } from './config'
import { BookingStatus } from '@prisma/client'

export async function getCompletedHostingsCount(
  userId: string,
  windowDays: number = config.hostTierWindowDays
): Promise<number> {
  const windowStart = new Date()
  windowStart.setDate(windowStart.getDate() - windowDays)

  const count = await prisma.bookingRequest.count({
    where: {
      hostId: userId,
      status: BookingStatus.COMPLETED,
      endDate: {
        gte: windowStart,
      },
    },
  })

  return count
}

export async function getUserHostTier(userId: string): Promise<number> {
  const completedHostings = await getCompletedHostingsCount(userId)
  return getHostTier(completedHostings)
}

export function getTierBadge(tier: number): { label: string; color: string } {
  switch (tier) {
    case 3:
      return { label: 'Super Host', color: 'bg-yellow-100 text-yellow-800' }
    case 2:
      return { label: 'Experienced Host', color: 'bg-primary-100 text-primary-800' }
    case 1:
      return { label: 'Active Host', color: 'bg-green-100 text-green-800' }
    default:
      return { label: 'New Host', color: 'bg-gray-100 text-gray-600' }
  }
}
