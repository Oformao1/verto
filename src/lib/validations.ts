import { z } from 'zod'

export const signUpSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export const signInSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  city: z.string().optional(),
  workIndustry: z.string().optional(),
  socialsLink: z.string().url().optional().or(z.literal('')),
  modeInterest: z.enum(['GUEST', 'HOST', 'SWAPPER']),
})

export const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  city: z.string().min(2, 'City is required'),
  neighborhood: z.string().optional(),
  fullAddress: z.string().min(5, 'Full address is required'),
  spaceType: z.enum(['ROOM', 'ENTIRE_PLACE']),
  creditsPerNight: z.number().min(1).max(5),
  maxGuests: z.number().min(1).max(3),
  amenities: z.array(z.string()),
  houseRules: z.string().max(1000).optional(),
  keyAccessMethod: z.enum(['SMART_LOCK', 'LOCKBOX', 'IN_PERSON', 'DOORMAN']),
  keyInstructions: z.string().max(500).optional(),
  safetyAck: z.boolean().refine((v) => v === true, 'You must acknowledge safety rules'),
})

export const bookingRequestSchema = z.object({
  listingId: z.string(),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
  guestMessage: z.string().max(500).optional(),
  purpose: z.enum(['WORK', 'TRAVEL', 'OTHER']),
})

export const vouchSchema = z.object({
  toUserId: z.string(),
  relationshipType: z.enum(['FRIEND', 'COWORKER', 'FAMILY', 'OTHER']),
  note: z.string().max(200).optional(),
})

export const reviewSchema = z.object({
  bookingId: z.string(),
  rating: z.number().min(1).max(5),
  text: z.string().max(500).optional(),
})

export const reportSchema = z.object({
  targetType: z.enum(['USER', 'LISTING']),
  targetId: z.string(),
  category: z.string().min(1, 'Category is required'),
  details: z.string().max(1000).optional(),
})

export const messageSchema = z.object({
  bookingId: z.string(),
  body: z.string().min(1, 'Message cannot be empty').max(2000),
})
