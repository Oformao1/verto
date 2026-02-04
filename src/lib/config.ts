export const config = {
  // Vouch settings
  vouchMinAccountAgeDays: parseInt(process.env.VOUCH_MIN_ACCOUNT_AGE_DAYS || '3'),

  // Referral settings
  referralBonusCredits: parseInt(process.env.REFERRAL_BONUS_CREDITS || '1'),

  // Host tier settings
  hostTierWindowDays: parseInt(process.env.HOST_TIER_WINDOW_DAYS || '90'),

  // Cancellation settings
  cancellationWindowHours: parseInt(process.env.CANCELLATION_WINDOW_HOURS || '48'),

  // Admin email
  adminEmail: process.env.ADMIN_EMAIL || 'admin@verto.app',

  // Space type credits
  defaultCredits: {
    ROOM: 1,
    ENTIRE_PLACE: 2,
  },

  // Credits bounds
  minCreditsPerNight: 1,
  maxCreditsPerNight: 3,

  // Host tier thresholds
  tierThresholds: {
    0: 0,
    1: 1,
    2: 3,
    3: 6,
  } as Record<number, number>,
}

export function getHostTier(completedHostings: number): number {
  if (completedHostings >= config.tierThresholds[3]) return 3
  if (completedHostings >= config.tierThresholds[2]) return 2
  if (completedHostings >= config.tierThresholds[1]) return 1
  return 0
}
