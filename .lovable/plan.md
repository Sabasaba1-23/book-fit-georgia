

# FitBook Georgia — Fitness & Sports Training Marketplace

A clean, mobile-first PWA marketplace connecting users with individual trainers and gyms/studios across Georgia. Bilingual (English + Georgian), with in-app booking and payments via Stripe.

---

## Phase 1: Foundation & Authentication

### User Registration & Login
- Email/password authentication with Supabase Auth
- Two registration paths: **User** or **Partner** (trainer / gym)
- After login, users land directly on the Home feed — no onboarding walls
- Language toggle (EN / KA) accessible from profile settings

### Partner Registration
- Choose partner type: **Individual Trainer** or **Gym / Studio / Place**
- Individual trainers fill out a personal profile (name, photo, bio, sports, languages)
- Gyms fill out a brand profile (business name, logo, description, location)
- Partner profiles start in "pending" state, not visible to users until approved

---

## Phase 2: Partner Dashboard

### Listing Management
- Partners create training listings with: title, sport/activity type, description, date & time, duration, price, max spots (for group), background image, equipment/preparation notes
- Each listing has a status: **Draft → Pending → Approved / Rejected**
- New listings are submitted as applications (pending admin review)
- Editing an approved listing resets it to "pending"
- Partners see all their listings with clear status indicators

### Dashboard Views
- Overview of listings by status
- Booking management (once listings are approved and booked)
- Profile editing

---

## Phase 3: Admin Panel

### Separate Admin Route (`/admin`)
- Accessible only to users with an admin role
- Review queue for new partner profiles and training listings
- Approve or reject listings with optional notes
- View all partners, listings, and their statuses
- Simple, functional interface — not user-facing

---

## Phase 4: User Home Feed & Browsing

### Home Screen
- Mixed feed of approved listings from both trainers and gyms
- Each listing card shows: small profile photo/logo, background image, training name, sport type, date/time, price, available spots, verified badge
- Clean, consistent card design for both partner types

### Search & Filters
- Search bar at the top of the Home screen
- Filter by: sport/activity, date & time range, price range, training type (1-on-1, group, event), language
- Default view: all approved listings, no filters applied

### Inline Expansion
- Tapping a listing card expands it inline within the feed
- Expanded view shows: full description, trainer/gym bio, equipment notes, "Ask a Question" button, "Book" button
- Option to open full partner profile page from expanded view

---

## Phase 5: Booking & Payments

### Booking Flow
- Users book directly from the expanded listing view
- Select number of spots (for group sessions)
- Stripe-powered in-app payment
- Booking confirmation with details

### Bookings Tab
- Users see upcoming and past bookings
- Booking status tracking
- Partners see incoming bookings in their dashboard

---

## Phase 6: Messaging

### In-App Messaging
- Users can message partners via "Ask a Question" on listings
- Simple conversation threads between user and partner
- Real-time messaging using Supabase Realtime
- Accessible from the Messages tab in bottom navigation

---

## Phase 7: Navigation & PWA

### Bottom Navigation Bar (Users)
- **Home** — listing feed
- **Bookings** — user's bookings
- **Messages** — conversations
- **Profile** — settings, language, account

### PWA Setup
- Installable from mobile browser to home screen
- App icon, splash screen, offline shell
- Mobile-optimized responsive design throughout

---

## Phase 8: Bilingual Support (EN / KA)

### Internationalization
- All UI text available in English and Georgian
- Language toggle in profile/settings
- Partner listings support bilingual content (title, description)

