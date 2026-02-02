import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create 10 users
  const passwordHash = await hash('password123', 12)

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@verto.app',
        passwordHash,
        name: 'Admin User',
        bio: 'Verto platform administrator',
        city: 'San Francisco, CA',
        modeInterest: 'SWAPPER',
        emailVerified: true,
        phoneVerified: true,
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      },
    }),
    prisma.user.create({
      data: {
        email: 'alice@example.com',
        passwordHash,
        name: 'Alice Chen',
        bio: 'Remote software engineer who loves to travel. Looking for quiet spaces to work and explore new cities.',
        city: 'San Francisco, CA',
        workIndustry: 'Software Engineer at TechCorp',
        modeInterest: 'SWAPPER',
        emailVerified: true,
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.user.create({
      data: {
        email: 'bob@example.com',
        passwordHash,
        name: 'Bob Martinez',
        bio: 'Freelance designer traveling the world. I keep places tidy and respect house rules.',
        city: 'New York, NY',
        workIndustry: 'Freelance Product Designer',
        modeInterest: 'GUEST',
        emailVerified: true,
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.user.create({
      data: {
        email: 'carol@example.com',
        passwordHash,
        name: 'Carol Johnson',
        bio: 'Marketing consultant with a cozy apartment to share when I travel.',
        city: 'San Francisco, CA',
        workIndustry: 'Marketing Consultant',
        modeInterest: 'HOST',
        emailVerified: true,
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.user.create({
      data: {
        email: 'david@example.com',
        passwordHash,
        name: 'David Kim',
        bio: 'Startup founder who values flexibility. Great at recommendations for local spots!',
        city: 'New York, NY',
        workIndustry: 'Founder & CEO at StartupX',
        modeInterest: 'SWAPPER',
        emailVerified: true,
        createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.user.create({
      data: {
        email: 'emma@example.com',
        passwordHash,
        name: 'Emma Wilson',
        bio: 'Content creator exploring new places. I document my travels and appreciate unique spaces.',
        city: 'San Francisco, CA',
        workIndustry: 'Content Creator',
        modeInterest: 'GUEST',
        emailVerified: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.user.create({
      data: {
        email: 'frank@example.com',
        passwordHash,
        name: 'Frank Thompson',
        bio: 'Remote data scientist. Looking for quiet, well-equipped spaces with good WiFi.',
        city: 'New York, NY',
        workIndustry: 'Senior Data Scientist',
        modeInterest: 'SWAPPER',
        emailVerified: true,
        createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.user.create({
      data: {
        email: 'grace@example.com',
        passwordHash,
        name: 'Grace Lee',
        bio: 'UX researcher who loves meeting new people. My apartment is cozy and well-located.',
        city: 'San Francisco, CA',
        workIndustry: 'UX Researcher at DesignCo',
        modeInterest: 'HOST',
        emailVerified: true,
        createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.user.create({
      data: {
        email: 'henry@example.com',
        passwordHash,
        name: 'Henry Brown',
        bio: 'Writer looking for inspiring spaces to work on my next book.',
        city: 'New York, NY',
        workIndustry: 'Author & Freelance Writer',
        modeInterest: 'GUEST',
        emailVerified: true,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.user.create({
      data: {
        email: 'ivy@example.com',
        passwordHash,
        name: 'Ivy Patel',
        bio: 'Product manager with a passion for travel. Always happy to share local tips!',
        city: 'San Francisco, CA',
        workIndustry: 'Product Manager at TechStartup',
        modeInterest: 'SWAPPER',
        emailVerified: true,
        createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
      },
    }),
  ])

  console.log(`Created ${users.length} users`)

  // Give users initial credits
  for (const user of users) {
    await prisma.creditLedgerEntry.create({
      data: {
        userId: user.id,
        amount: 10,
        type: 'INITIAL_CREDIT',
        note: 'Welcome to Verto!',
      },
    })
  }

  console.log('Added initial credits')

  // Create vouches
  const vouches = [
    { from: 1, to: 2, type: 'COWORKER', note: 'Worked together at TechCorp. Very reliable!' },
    { from: 2, to: 1, type: 'COWORKER', note: 'Great colleague, always professional.' },
    { from: 3, to: 4, type: 'FRIEND', note: 'Known Carol for years. Trustworthy!' },
    { from: 4, to: 3, type: 'FRIEND', note: "Bob's a great guy, always respectful." },
    { from: 5, to: 6, type: 'FRIEND', note: 'Met at a conference, very cool person.' },
    { from: 7, to: 8, type: 'COWORKER', note: 'Former teammates, highly recommend.' },
    { from: 8, to: 7, type: 'COWORKER', note: 'Frank is reliable and considerate.' },
    { from: 9, to: 1, type: 'FRIEND', note: 'Known the admin team for a while.' },
    { from: 1, to: 9, type: 'FRIEND', note: 'Ivy is fantastic, highly vouch!' },
    { from: 2, to: 5, type: 'OTHER', note: 'Met through mutual friends.' },
    { from: 6, to: 3, type: 'FRIEND', note: 'Bob helped me when I was traveling.' },
    { from: 4, to: 7, type: 'COWORKER', note: 'Collaborated on a project together.' },
  ]

  for (const vouch of vouches) {
    await prisma.vouch.create({
      data: {
        fromUserId: users[vouch.from].id,
        toUserId: users[vouch.to].id,
        relationshipType: vouch.type as 'FRIEND' | 'COWORKER' | 'FAMILY' | 'OTHER',
        note: vouch.note,
      },
    })
  }

  console.log(`Created ${vouches.length} vouches`)

  // Create listings (8 listings across SF and NYC)
  const listings = await Promise.all([
    // San Francisco listings
    prisma.listing.create({
      data: {
        hostId: users[1].id, // Alice
        title: 'Sunny Mission District Studio',
        city: 'San Francisco, CA',
        neighborhood: 'Mission District',
        fullAddress: '456 Valencia St, Apt 3B, San Francisco, CA 94110',
        spaceType: 'ENTIRE_PLACE',
        creditsPerNight: 2,
        maxGuests: 2,
        amenities: ['wifi', 'kitchen', 'workspace', 'washer', 'ac'],
        houseRules: 'No smoking. Quiet hours after 10pm. No parties.',
        keyAccessMethod: 'SMART_LOCK',
        keyInstructions: 'Code will be sent via message 24 hours before check-in.',
        safetyAck: true,
      },
    }),
    prisma.listing.create({
      data: {
        hostId: users[3].id, // Carol
        title: 'Cozy Room in Pacific Heights',
        city: 'San Francisco, CA',
        neighborhood: 'Pacific Heights',
        fullAddress: '1234 Pacific Ave, San Francisco, CA 94109',
        spaceType: 'ROOM',
        creditsPerNight: 1,
        maxGuests: 1,
        amenities: ['wifi', 'workspace', 'kitchen', 'heating'],
        houseRules: 'Shared kitchen. Clean up after yourself. Respect quiet hours.',
        keyAccessMethod: 'IN_PERSON',
        keyInstructions: "I'll meet you at check-in to give you the keys.",
        safetyAck: true,
      },
    }),
    prisma.listing.create({
      data: {
        hostId: users[7].id, // Grace
        title: 'Modern SOMA Loft with City Views',
        city: 'San Francisco, CA',
        neighborhood: 'SOMA',
        fullAddress: '789 Brannan St, Unit 501, San Francisco, CA 94107',
        spaceType: 'ENTIRE_PLACE',
        creditsPerNight: 3,
        maxGuests: 4,
        amenities: ['wifi', 'kitchen', 'workspace', 'washer', 'dryer', 'gym', 'parking'],
        houseRules: 'No smoking. Building has 24/7 security. Parking included.',
        keyAccessMethod: 'DOORMAN',
        keyInstructions: 'Check in with the front desk. They have a key for you.',
        safetyAck: true,
      },
    }),
    prisma.listing.create({
      data: {
        hostId: users[9].id, // Ivy
        title: 'Charming Victorian in Haight',
        city: 'San Francisco, CA',
        neighborhood: 'Haight-Ashbury',
        fullAddress: '567 Haight St, San Francisco, CA 94117',
        spaceType: 'ROOM',
        creditsPerNight: 1,
        maxGuests: 2,
        amenities: ['wifi', 'kitchen', 'heating', 'tv'],
        houseRules: 'Historic building - please be gentle with fixtures. No pets.',
        keyAccessMethod: 'LOCKBOX',
        keyInstructions: 'Lockbox is on the left side of the front door. Code: 4521',
        safetyAck: true,
      },
    }),
    // New York listings
    prisma.listing.create({
      data: {
        hostId: users[4].id, // David
        title: 'Bright Brooklyn Brownstone Apartment',
        city: 'New York, NY',
        neighborhood: 'Park Slope',
        fullAddress: '321 7th Ave, Apt 2, Brooklyn, NY 11215',
        spaceType: 'ENTIRE_PLACE',
        creditsPerNight: 2,
        maxGuests: 3,
        amenities: ['wifi', 'kitchen', 'workspace', 'washer', 'heating', 'ac'],
        houseRules: 'No smoking. Take off shoes inside. Recycling is mandatory.',
        keyAccessMethod: 'SMART_LOCK',
        keyInstructions: 'August lock code will be shared before arrival.',
        safetyAck: true,
      },
    }),
    prisma.listing.create({
      data: {
        hostId: users[6].id, // Frank
        title: 'Private Room in Williamsburg',
        city: 'New York, NY',
        neighborhood: 'Williamsburg',
        fullAddress: '456 Bedford Ave, Brooklyn, NY 11249',
        spaceType: 'ROOM',
        creditsPerNight: 1,
        maxGuests: 1,
        amenities: ['wifi', 'workspace', 'kitchen', 'washer'],
        houseRules: 'Shared spaces. Please clean up after yourself.',
        keyAccessMethod: 'IN_PERSON',
        keyInstructions: "Flexible check-in. I'll coordinate via message.",
        safetyAck: true,
      },
    }),
    prisma.listing.create({
      data: {
        hostId: users[4].id, // David (second listing)
        title: 'Manhattan Studio near Central Park',
        city: 'New York, NY',
        neighborhood: 'Upper West Side',
        fullAddress: '789 Amsterdam Ave, Apt 12C, New York, NY 10025',
        spaceType: 'ENTIRE_PLACE',
        creditsPerNight: 3,
        maxGuests: 2,
        amenities: ['wifi', 'kitchen', 'workspace', 'gym', 'doorman'],
        houseRules: 'Doorman building. No smoking. No loud music.',
        keyAccessMethod: 'DOORMAN',
        keyInstructions: 'Tell the doorman your name. Key will be at the front desk.',
        safetyAck: true,
      },
    }),
    prisma.listing.create({
      data: {
        hostId: users[6].id, // Frank (second listing)
        title: 'Cozy Queens Apartment',
        city: 'New York, NY',
        neighborhood: 'Astoria',
        fullAddress: '30-15 Steinway St, Apt 4A, Astoria, NY 11103',
        spaceType: 'ENTIRE_PLACE',
        creditsPerNight: 2,
        maxGuests: 2,
        amenities: ['wifi', 'kitchen', 'tv', 'washer', 'ac'],
        houseRules: 'Family neighborhood. Please be respectful of noise levels.',
        keyAccessMethod: 'LOCKBOX',
        keyInstructions: 'Lockbox is hanging on the building entrance gate. Code: 7890',
        safetyAck: true,
      },
    }),
  ])

  console.log(`Created ${listings.length} listings`)

  // Create some bookings
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const bookings = await Promise.all([
    // Completed booking
    prisma.bookingRequest.create({
      data: {
        listingId: listings[0].id,
        guestId: users[2].id, // Bob
        hostId: users[1].id, // Alice
        startDate: oneMonthAgo,
        endDate: new Date(oneMonthAgo.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: 'COMPLETED',
        creditsTotal: 14,
        guestMessage: 'Looking forward to exploring SF!',
        purpose: 'WORK',
      },
    }),
    // Another completed booking
    prisma.bookingRequest.create({
      data: {
        listingId: listings[4].id,
        guestId: users[5].id, // Emma
        hostId: users[4].id, // David
        startDate: twoWeeksAgo,
        endDate: oneWeekAgo,
        status: 'COMPLETED',
        creditsTotal: 14,
        guestMessage: 'Need a quiet place to create content.',
        purpose: 'WORK',
      },
    }),
    // Confirmed upcoming booking
    prisma.bookingRequest.create({
      data: {
        listingId: listings[2].id,
        guestId: users[4].id, // David
        hostId: users[7].id, // Grace
        startDate: oneWeekFromNow,
        endDate: twoWeeksFromNow,
        status: 'CONFIRMED',
        creditsTotal: 21,
        guestMessage: 'Excited to stay in SOMA!',
        purpose: 'TRAVEL',
      },
    }),
    // Requested booking
    prisma.bookingRequest.create({
      data: {
        listingId: listings[5].id,
        guestId: users[1].id, // Alice
        hostId: users[6].id, // Frank
        startDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
        status: 'REQUESTED',
        creditsTotal: 7,
        guestMessage: 'Would love to check out Williamsburg!',
        purpose: 'WORK',
      },
    }),
    // Cancelled booking
    prisma.bookingRequest.create({
      data: {
        listingId: listings[1].id,
        guestId: users[8].id, // Henry
        hostId: users[3].id, // Carol
        startDate: oneWeekAgo,
        endDate: now,
        status: 'CANCELLED',
        creditsTotal: 7,
        guestMessage: 'Looking for a quiet writing retreat.',
        purpose: 'WORK',
      },
    }),
  ])

  console.log(`Created ${bookings.length} bookings`)

  // Create reviews for completed bookings
  await prisma.review.create({
    data: {
      bookingId: bookings[0].id,
      reviewerId: users[2].id, // Bob reviewing Alice
      revieweeId: users[1].id,
      rating: 5,
      text: 'Amazing host! The apartment was exactly as described and Alice was super helpful with local recommendations.',
    },
  })

  await prisma.review.create({
    data: {
      bookingId: bookings[0].id,
      reviewerId: users[1].id, // Alice reviewing Bob
      revieweeId: users[2].id,
      rating: 5,
      text: 'Bob was a great guest! Left the place spotless and was very respectful.',
    },
  })

  await prisma.review.create({
    data: {
      bookingId: bookings[1].id,
      reviewerId: users[5].id, // Emma reviewing David
      revieweeId: users[4].id,
      rating: 4,
      text: 'Great location and David was responsive. WiFi was a bit slow but overall good stay.',
    },
  })

  await prisma.review.create({
    data: {
      bookingId: bookings[1].id,
      reviewerId: users[4].id, // David reviewing Emma
      revieweeId: users[5].id,
      rating: 5,
      text: 'Emma was fantastic! Very clean and communicative. Would host again.',
    },
  })

  console.log('Created reviews')

  // Create some messages
  await prisma.message.createMany({
    data: [
      {
        bookingId: bookings[0].id,
        senderId: users[2].id,
        body: 'Hi Alice! Looking forward to staying at your place.',
        createdAt: new Date(oneMonthAgo.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        bookingId: bookings[0].id,
        senderId: users[1].id,
        body: 'Hi Bob! Excited to host you. Let me know if you have any questions.',
        createdAt: new Date(oneMonthAgo.getTime() - 1.5 * 24 * 60 * 60 * 1000),
      },
      {
        bookingId: bookings[2].id,
        senderId: users[4].id,
        body: 'Hi Grace! Your loft looks amazing. Is the workspace setup good for video calls?',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        bookingId: bookings[2].id,
        senderId: users[7].id,
        body: "Absolutely! There's a dedicated desk area with great lighting and fast WiFi.",
        createdAt: new Date(now.getTime() - 2.5 * 24 * 60 * 60 * 1000),
      },
    ],
  })

  console.log('Created messages')

  // Process credit transfers for completed and confirmed bookings
  // Completed booking 1
  await prisma.creditLedgerEntry.createMany({
    data: [
      {
        userId: users[2].id, // Bob paid
        amount: -14,
        type: 'BOOKING_CONFIRMED_DEBIT',
        bookingId: bookings[0].id,
      },
      {
        userId: users[1].id, // Alice received
        amount: 14,
        type: 'BOOKING_CONFIRMED_CREDIT',
        bookingId: bookings[0].id,
      },
      // Completed booking 2
      {
        userId: users[5].id, // Emma paid
        amount: -14,
        type: 'BOOKING_CONFIRMED_DEBIT',
        bookingId: bookings[1].id,
      },
      {
        userId: users[4].id, // David received
        amount: 14,
        type: 'BOOKING_CONFIRMED_CREDIT',
        bookingId: bookings[1].id,
      },
      // Confirmed booking
      {
        userId: users[4].id, // David paid
        amount: -21,
        type: 'BOOKING_CONFIRMED_DEBIT',
        bookingId: bookings[2].id,
      },
      {
        userId: users[7].id, // Grace received
        amount: 21,
        type: 'BOOKING_CONFIRMED_CREDIT',
        bookingId: bookings[2].id,
      },
    ],
  })

  console.log('Processed credit transfers')

  // Create a referral
  await prisma.referral.create({
    data: {
      referrerId: users[1].id, // Alice referred
      referredId: users[5].id, // Emma
      status: 'COMPLETED',
      awardedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    },
  })

  // Award referral bonuses
  await prisma.creditLedgerEntry.createMany({
    data: [
      {
        userId: users[1].id,
        amount: 1,
        type: 'REFERRAL_BONUS',
        note: 'Referral bonus - referred user completed requirements',
      },
      {
        userId: users[5].id,
        amount: 1,
        type: 'REFERRAL_BONUS',
        note: 'Referral bonus - welcome credit',
      },
    ],
  })

  console.log('Created referral with bonuses')

  // Create a sample report
  await prisma.report.create({
    data: {
      reporterId: users[8].id,
      targetType: 'LISTING',
      targetId: listings[7].id,
      category: 'inaccurate',
      details: 'The photos seem outdated and the actual space looks different.',
      status: 'PENDING',
    },
  })

  console.log('Created sample report')

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
