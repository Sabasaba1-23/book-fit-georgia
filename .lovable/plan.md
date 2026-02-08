

# Partner Dashboard Payments, Profile Improvements, User Menu & Advanced Filters

This plan covers four major areas of work across the platform.

---

## 1. Partner Payments Section (Dashboard)

**What changes:**
- Add a new "Payments" tab to the partner dashboard bottom nav (replacing or alongside "Insights")
- Create a `PartnerPaymentsTab` component with three sub-sections:
  - **Bank Account Details**: Form to add/edit bank name, account holder name, IBAN/account number. Stored in a new `partner_payouts` database table
  - **Card for Payouts**: Placeholder section (marked "Coming Soon") for card-based payouts since Stripe Connect isn't set up yet
  - **Payout History**: Table/list showing payout records (empty state for now with "No payouts yet" message)

**Database changes:**
- New table `partner_payouts` with columns: `id`, `partner_id`, `bank_name`, `account_holder`, `iban`, `created_at`, `updated_at`
- RLS: Partners can insert/update/view their own records; admins can view all

---

## 2. Trainer Profile Improvements

**What changes in `PartnerProfile.tsx`:**

- **Remove all fake/placeholder data**: Delete the hardcoded `BIOS`, `CERTIFICATIONS`, `SPECIALTIES`, `LOCATIONS`, `COVER_IMAGES`, `AVATAR_IMAGES`, `GALLERY_IMAGES` arrays and the `seededRandom` logic
- **Show only real data**: Display bio, sports, location, rating, review count only if they exist in the database
- **Age display**: Add `date_of_birth` to the partner verification data query; calculate and display age on the profile if available
- **Gym associations**: Query `training_listings` for distinct `gym_name` values where `location_type = 'gym'`; show one gym name if single, list all if multiple
- **Reviews section**: Fetch real reviews from the `reviews` table (joined through bookings and listings). If no reviews exist, hide the entire Reviews section -- no placeholder, no fake reviews
- **Stats**: Show rating and review count only when `review_count > 0`. Remove fabricated "Years", "Clients" stats unless real data exists

---

## 3. User Menu (Top-Right Initials Button)

**What changes in `Home.tsx`:**

- Replace the current initials button (which navigates to `/profile`) with a `DropdownMenu` from the existing Radix UI components
- Menu items:
  - User's display name (non-clickable header)
  - "View Profile" -- navigates to `/profile`
  - "Settings" -- navigates to `/profile` (scrolled to settings) or opens a settings sheet
  - "Log Out" -- calls `signOut()` from AuthContext
- For non-authenticated users, the button still navigates to `/auth`

---

## 4. Home Page Filter Improvements

All changes happen in `FilterOverlay.tsx` and related filter state.

### 4a. Activity/Sport Filter (Top Priority)
- Show only the top 10 most popular sports by default (subset of the SPORTS constant)
- Add a "Show more" button that expands to show all sports
- Add a search input above the sport chips to filter the list by typing
- Ensure the section stays compact when collapsed

### 4b. Date and Time Filters (Separate)
- Split the current "Date & Time" section into two distinct sections
- **Date**: Keep the existing 7-day date picker
- **Time**: Add a time range selector with two dropdowns or sliders (e.g., "From 08:00" / "To 22:00") in 30-minute increments
- Add `timeRange: [string, string] | null` to `FilterState` (e.g., `["17:00", "20:00"]`)
- Apply time filtering in `Home.tsx` by comparing `scheduled_at` hour/minute

### 4c. Gender Filter
- Add a "Gender" section with chips: "Male", "Female", "Any"
- Add `trainerGender: string | null` to `FilterState`
- **Database**: Add `gender` column (text, nullable) to `profiles` table and `partner_profiles` table
- **Registration**: Add gender selection during user and partner registration in `Auth.tsx`
- Filter listings by joining `partner_profiles.gender` when applying filters

### 4d. Location Filter (Georgia-Specific)
- Restructure the `CITIES` constant into a more detailed hierarchy with regions and neighborhoods
- Add more districts for Tbilisi (e.g., Mtatsminda, Chugureti, Samgori, Dighomi, Varketili)
- Add a search input for locations so users can type to find their area
- Make the UI a two-step flow: select city first, then district chips appear below

### 4e. Goals Filter
- Add a "Goals" section with selectable chips:
  - Muscle Gain, Weight Loss, Speed & Performance, General Health, Mobility / Recovery
- Add `goals: string[]` to `FilterState`
- **Database**: Add `goals` column (text array, nullable) to `training_listings` and `training_packages`
- Partners can tag their listings with goals during creation
- Filter by checking if listing goals overlap with selected filter goals

---

## Technical Details

### New Database Migration
```text
- Add table: partner_payouts (id, partner_id, bank_name, account_holder, iban, timestamps, RLS)
- Add column: partner_profiles.gender (text, nullable)
- Add column: profiles.gender (text, nullable)
- Add column: training_listings.goals (text[], nullable)
- Add column: training_packages.goals (text[], nullable)
```

### Files to Create
- `src/components/PartnerPaymentsTab.tsx` -- payments management UI

### Files to Modify
- `src/pages/PartnerDashboard.tsx` -- add Payments tab
- `src/pages/PartnerProfile.tsx` -- remove fake data, show real reviews, age, gym associations
- `src/pages/Home.tsx` -- replace initials button with dropdown menu
- `src/components/FilterOverlay.tsx` -- all filter improvements (sport search, time range, gender, goals, better locations)
- `src/pages/Auth.tsx` -- add gender field to registration forms
- `src/components/CreateListingSheet.tsx` -- add goals selection during listing creation
- `src/integrations/supabase/types.ts` -- update types for new columns/tables
- `src/i18n/translations.ts` -- new translation keys for all added UI elements

### Execution Order
1. Database migration (new table + new columns)
2. Update Supabase types
3. Partner Payments tab (new component + dashboard integration)
4. Trainer profile cleanup (remove fake data, add real reviews/age/gyms)
5. User menu dropdown on Home page
6. Filter improvements (sport search, time range, gender, goals, locations)
7. Registration gender field
8. Translation keys

