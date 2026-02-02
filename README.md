# Verto - Social Swapping Platform for Remote Workers

Verto is a social swapping and hosted-stays platform for remote workers and travelers who want short-to-medium stays (1 week to 3 months) without paying traditional rent twice.

## Features

- **Credit-based booking system** - Earn credits by hosting, spend them on stays
- **Trust through vouching** - Build credibility with vouches from friends, family, and coworkers
- **Host tier system** - Earn badges and ranking boosts through successful hosting
- **Referral program** - Invite friends and both receive bonus credits
- **In-app messaging** - Communicate with hosts and guests
- **Reviews** - Two-way rating system after completed stays
- **Admin panel** - Manage reports and adjust credits

## Tech Stack

- **Framework**: Next.js 14 (App Router) with TypeScript
- **Styling**: TailwindCSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd verto
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/verto?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Admin email (this user gets access to /admin)
ADMIN_EMAIL="admin@verto.app"

# App Config (optional - defaults shown)
VOUCH_MIN_ACCOUNT_AGE_DAYS=3
REFERRAL_BONUS_CREDITS=1
HOST_TIER_WINDOW_DAYS=90
CANCELLATION_WINDOW_HOURS=48
```

4. Generate Prisma client and push schema:
```bash
npm run db:generate
npm run db:push
```

5. (Optional) Seed the database with sample data:
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Database Schema

### Core Models

- **User** - User accounts with profiles
- **Listing** - Property listings with photos and availability
- **BookingRequest** - Stay requests between guests and hosts
- **Message** - In-app messaging per booking
- **Review** - Ratings and reviews after completed stays
- **Vouch** - Trust endorsements between users
- **Referral** - Referral tracking with bonus credits
- **CreditLedgerEntry** - Full audit trail of credit transactions
- **Report** - User/listing reports for moderation

### Credit System

Credits are tracked via a ledger system (not hardcoded balances):
- `INITIAL_CREDIT` - Welcome bonus on signup
- `BOOKING_CONFIRMED_DEBIT` - Guest pays for booking
- `BOOKING_CONFIRMED_CREDIT` - Host receives payment
- `BOOKING_CANCELLED_REVERSAL` - Refund on cancellation
- `REFERRAL_BONUS` - Bonus for referrals
- `ADMIN_ADJUSTMENT` - Manual admin changes

Default rates:
- 1 credit = 1 night (private room)
- 2 credits = 1 night (entire place)
- Hosts can set 1-5 credits per night

### Host Tier System

Based on completed hostings in the last 90 days:
- **Tier 0**: 0 completed stays (New Host)
- **Tier 1**: 1-2 stays (Active Host)
- **Tier 2**: 3-5 stays (Experienced Host)
- **Tier 3**: 6+ stays (Super Host)

Higher tiers get ranking boosts in search results.

## Seed Data

The seed script creates:
- 10 users (including admin@verto.app)
- 8 listings across San Francisco and New York
- Sample vouches between users
- Bookings in various statuses
- Reviews for completed stays
- Sample messages
- A referral with bonuses
- A pending report

**Default login credentials** (after seeding):
- Email: `admin@verto.app` / Password: `password123`
- Email: `alice@example.com` / Password: `password123`
- (All seeded users have password: `password123`)

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Create migration
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

## Project Structure

```
verto/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed data script
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── api/         # API routes
│   │   ├── admin/       # Admin panel
│   │   ├── dashboard/   # User dashboard
│   │   ├── explore/     # Browse listings
│   │   ├── listings/    # Listing pages
│   │   ├── messages/    # Message inbox
│   │   ├── profile/     # User profile
│   │   └── trips/       # Bookings management
│   ├── components/
│   │   ├── layout/      # Navbar, Footer
│   │   ├── providers/   # Context providers
│   │   └── ui/          # Reusable UI components
│   ├── lib/
│   │   ├── auth.ts      # NextAuth configuration
│   │   ├── config.ts    # App configuration
│   │   ├── credits.ts   # Credit ledger operations
│   │   ├── prisma.ts    # Prisma client
│   │   ├── tiers.ts     # Host tier system
│   │   ├── utils.ts     # Utility functions
│   │   └── validations.ts # Zod schemas
│   └── types/           # TypeScript types
├── public/              # Static assets
└── package.json
```

## Key Flows

### Booking Flow
1. Guest browses listings on `/explore`
2. Guest selects dates and requests stay
3. Host receives request and accepts/declines
4. On accept: credits transfer from guest to host
5. Guest gets access instructions
6. After stay: both parties leave reviews

### Cancellation Policy
- Cancel >48 hours before: full credit refund
- Cancel <48 hours before: no refund (host keeps credits)

### Vouch Requirements
- Voucher must have account for 3+ days
- Cannot vouch for yourself
- One vouch per person

### Referral Bonuses
- Both parties get 1 credit when:
  - Referred user completes profile (photo + bio)
  - AND has verified email or phone

## Branding

- **Primary color**: `#5e83c1` (Maximum Green/Blue)
- **Style**: Modern, clean, minimal
- **Typography**: Inter font family

## License

MIT
