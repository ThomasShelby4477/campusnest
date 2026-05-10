# CampusNest 🏠

**Student Housing & Roommate Finder for NFSU**

CampusNest is a full-stack web application designed for NFSU (National Forensic Sciences University) students to find housing, PGs, and compatible roommates. It features verified student profiles, real-time chat, Tinder-style roommate matching, and an interactive map-based property search.

---

## 🛠 Tech Stack

| Layer        | Technology                         |
|--------------|-------------------------------------|
| Framework    | Next.js 16 (App Router + Turbopack)|
| Language     | TypeScript                         |
| Styling      | Tailwind CSS v4 + shadcn/ui v4     |
| Backend      | Supabase (Auth, DB, Realtime, Storage, Edge Functions) |
| Maps         | Google Maps via `@vis.gl/react-google-maps` |
| State        | Zustand                            |
| Forms        | React Hook Form + Zod              |
| Animations   | react-spring + use-gesture         |
| Notifications| Firebase Cloud Messaging (FCM)     |
| Email        | Resend                             |
| Package Mgr  | **pnpm** (exclusively)             |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, signup, email verification
│   │   └── signup/steps/ # Multi-step onboarding wizard
│   ├── admin/            # Admin dashboard (users, listings, reports, verifications)
│   ├── api/              # Route handlers (listings, profile, roommates, notifications)
│   ├── chat/[matchId]/   # Real-time chat with matched roommates
│   ├── create-listing/   # Multi-step listing creation wizard
│   ├── listings/[id]/    # Listing detail pages
│   ├── my-listings/      # User's own listings management
│   ├── notifications/    # Notification center
│   ├── profile/          # User profile with buddy toggle
│   ├── roommates/        # Roommate feed (swipe cards) + quiz
│   ├── saved/            # Saved/bookmarked listings
│   ├── search/           # Map + list property search
│   ├── about/            # About page (MDX)
│   ├── terms/            # Terms of service (MDX)
│   ├── privacy/          # Privacy policy (MDX)
│   ├── guidelines/       # Community guidelines (MDX)
│   ├── page.tsx          # Landing page
│   ├── layout.tsx        # Root layout (fonts, providers, navbar, consent)
│   ├── not-found.tsx     # Custom 404
│   ├── global-error.tsx  # Global error boundary
│   └── globals.css       # Design tokens + custom utilities
├── components/
│   ├── ui/               # shadcn/ui primitives
│   ├── navbar.tsx         # Desktop header + mobile bottom tab bar
│   ├── listing-card.tsx   # Property card with save/unsave
│   ├── roommate-card.tsx  # Swipeable roommate card (react-spring)
│   ├── roommate-feed.tsx  # Feed container with match overlay
│   ├── matches-list.tsx   # Chat inbox / matches list
│   ├── notifications-bell.tsx # Header notification badge
│   ├── consent-banner.tsx # GDPR/cookie consent
│   ├── empty-state.tsx    # Reusable empty states with SVG illustrations
│   └── error-boundary.tsx # Reusable React error boundary
├── lib/
│   └── supabase/          # Client, server, admin, middleware helpers
├── stores/
│   ├── auth-store.ts      # Zustand auth state
│   ├── listing-store.ts   # Multi-step listing form state
│   └── feed-store.ts      # Roommate feed state
└── types/
    └── database.ts        # Supabase generated types
```

---

## 🚀 Local Setup

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Supabase account (free tier works)
- Google Maps API key (Maps JavaScript API enabled)

### 1. Clone & Install

```bash
git clone <repo-url>
cd campusnest
pnpm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
```

Fill in your values:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key
NEXT_PUBLIC_NFSU_CAMPUS_LAT=23.2156
NEXT_PUBLIC_NFSU_CAMPUS_LNG=72.6369

# Firebase (FCM push notifications)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
FIREBASE_ADMIN_PRIVATE_KEY=...
FIREBASE_ADMIN_CLIENT_EMAIL=...

# Resend (transactional email)
RESEND_API_KEY=re_...

# Feature flags
AUTO_APPROVE_LISTINGS=false
```

### 3. Setup Supabase Database

```bash
# Install Supabase CLI
pnpm add -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Deploy edge functions
supabase functions deploy compute-compatibility
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🗄 Supabase Schema Overview

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User data (name, role, year, branch, gender, verified_status, looking_for_buddy) |
| `listings` | Property listings (rent, deposit, room_type, amenities, location) |
| `listing_images` | Images for each listing (url, order, is_primary) |
| `user_preferences` | Lifestyle quiz results (sleep, smoking, food, budget, etc.) |
| `roommate_likes` | Like/pass actions for matching |
| `matches` | Mutual likes → match (chat_type: ROOMMATE or BUDDY) |
| `messages` | Chat messages within matches |
| `saved_listings` | User bookmarks |
| `id_verifications` | ID card upload for admin verification |
| `notifications` | In-app notifications |
| `reports` | User-submitted reports |
| `audit_logs` | Action audit trail |

### Key RLS Policies

- Users can only read their own profile, preferences, and notifications
- Listings are publicly readable when `is_active = true AND is_verified = true`
- Messages are only accessible by match participants
- Admin role can read/write all records

### Edge Functions

- `compute-compatibility` — Calculates match score between two users based on preferences

---

## 🎨 Design System

### Color Tokens (in `globals.css`)

| Token | Value | Usage |
|-------|-------|-------|
| `--navy` | `#1B2A4A` | Primary brand, headings |
| `--coral` | `#E8593C` | CTAs, accents, likes |
| `--success` | `#10B981` | Verified, positive |
| `--warning` | `#F59E0B` | Pending states |
| `--danger` | `#EF4444` | Errors, bans |
| `--muted-bg` | `#F8FAFC` | Page backgrounds |
| `--text-primary` | `#1E293B` | Body text |
| `--text-muted` | `#64748B` | Secondary text |

### Responsive Breakpoints

- **Mobile-first** design: all pages tested at 375px viewport
- Bottom tab bar: visible on `< 640px` (Search, Match, Saved, Profile)
- Search page: switches from dual-panel (map+list) to single-panel below 1024px
- Cards, grids, and typography scale responsively via Tailwind `sm:` / `lg:` prefixes

---

## 📱 Key Features

### 1. Verified Student Authentication
- Email + password signup with OTP verification
- Multi-step onboarding: role → email → profile → ID upload
- Admin reviews ID cards before granting verified status

### 2. Property Listings
- Multi-step creation wizard (basic info → amenities → images → location via Google Maps)
- Filterable search with interactive map
- Save/bookmark listings
- Contact poster (verified users only)

### 3. Roommate Matching (Buddy Up)
- 8-question lifestyle quiz (budget, sleep, smoking, food, personality, etc.)
- Tinder-style swipeable cards with react-spring animations
- Compatibility score algorithm (via Supabase Edge Function)
- **Buddy Up mode**: Toggle in profile to find house-hunting partners (separate feed tab)
- Mutual match → real-time chat room created

### 4. Real-time Chat
- Supabase Realtime subscriptions
- Typing indicators (broadcast)
- Read receipts
- Unread count badges

### 5. Admin Dashboard
- KPI cards (total users, listings, pending verifications)
- User management (ban/unban, force verify, promote admin)
- Listing moderation (verify/unverify, activate/deactivate)
- ID verification review
- Report resolution

### 6. Push Notifications
- Firebase Cloud Messaging integration
- In-app notification center with mark-all-read
- Notification types: match, message, verification, listing approval

---

## 🚢 Deployment (Vercel + Supabase)

### Vercel

1. Push to GitHub/GitLab
2. Import project in [vercel.com](https://vercel.com)
3. Set all environment variables from `.env.local.example`
4. Deploy

> **Note:** For `FIREBASE_ADMIN_PRIVATE_KEY`, replace `\n` with actual newlines in Vercel UI, or use the `\n` literal format.

### Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Run migrations: `supabase db push`
3. Deploy edge functions: `supabase functions deploy compute-compatibility`
4. Enable Realtime on: `messages`, `matches`, `notifications`
5. Configure Auth providers (email enabled by default)
6. Set up Storage bucket `id-cards` for verification uploads

### Post-Deploy Checklist

- [ ] Verify Supabase RLS policies are active
- [ ] Test email OTP flow end-to-end
- [ ] Confirm Google Maps API key restrictions
- [ ] Verify FCM push notifications work
- [ ] Test admin dashboard access control
- [ ] Run through signup → quiz → match → chat flow

---

## 📝 License

MIT — Built for NFSU students.
