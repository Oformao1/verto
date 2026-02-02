import { prisma } from './prisma'
import { LedgerEntryType } from '@prisma/client'

export async function getUserCreditBalance(userId: string): Promise<number> {
  const result = await prisma.creditLedgerEntry.aggregate({
    where: { userId },
    _sum: { amount: true },
  })
  return result._sum.amount || 0
}

export async function getCreditHistory(userId: string) {
  return prisma.creditLedgerEntry.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
}

export async function addCredits(
  userId: string,
  amount: number,
  type: LedgerEntryType,
  bookingId?: string,
  note?: string
) {
  return prisma.creditLedgerEntry.create({
    data: {
      userId,
      amount,
      type,
      bookingId,
      note,
    },
  })
}

export async function debitCredits(
  userId: string,
  amount: number,
  type: LedgerEntryType,
  bookingId?: string,
  note?: string
) {
  return prisma.creditLedgerEntry.create({
    data: {
      userId,
      amount: -amount,
      type,
      bookingId,
      note,
    },
  })
}

export async function processBookingCredits(
  guestId: string,
  hostId: string,
  bookingId: string,
  creditsTotal: number
) {
  // Debit from guest
  await debitCredits(
    guestId,
    creditsTotal,
    LedgerEntryType.BOOKING_CONFIRMED_DEBIT,
    bookingId
  )

  // Credit to host
  await addCredits(
    hostId,
    creditsTotal,
    LedgerEntryType.BOOKING_CONFIRMED_CREDIT,
    bookingId
  )
}

export async function reverseBookingCredits(
  guestId: string,
  hostId: string,
  bookingId: string,
  creditsTotal: number
) {
  // Reverse: credit back to guest
  await addCredits(
    guestId,
    creditsTotal,
    LedgerEntryType.BOOKING_CANCELLED_REVERSAL,
    bookingId
  )

  // Reverse: debit from host
  await debitCredits(
    hostId,
    creditsTotal,
    LedgerEntryType.BOOKING_CANCELLED_REVERSAL,
    bookingId
  )
}

export async function awardReferralBonus(
  referrerId: string,
  referredId: string,
  bonusAmount: number
) {
  await addCredits(
    referrerId,
    bonusAmount,
    LedgerEntryType.REFERRAL_BONUS,
    undefined,
    'Referral bonus - referred user completed requirements'
  )

  await addCredits(
    referredId,
    bonusAmount,
    LedgerEntryType.REFERRAL_BONUS,
    undefined,
    'Referral bonus - welcome credit'
  )
}

export async function adminAdjustCredits(
  userId: string,
  amount: number,
  note: string
) {
  return prisma.creditLedgerEntry.create({
    data: {
      userId,
      amount,
      type: LedgerEntryType.ADMIN_ADJUSTMENT,
      note,
    },
  })
}
