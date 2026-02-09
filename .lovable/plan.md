

# Partner Dashboard Redesign

A structural and visual overhaul transforming the Partner Dashboard from a tab-based panel into a clean, premium, role-focused control center with the Profile as the central hub.

---

## Overview

The current Partner Dashboard uses a 5-tab bottom navigation (Home, Schedule, Messages, Payments, Profile) with the Profile tab containing inline-editable form fields. This redesign restructures navigation to 4 tabs, elevates the Profile into a hub with menu-based entry points, and creates dedicated sub-screens for editing, media, badges, payments, and settings.

---

## Part 1: Navigation Restructure

**Current:** 5 bottom tabs -- Home, Schedule, Messages, Payments, Profile

**New:** 4 bottom tabs -- Home, Schedule, Messages, Profile

- Remove "Payments" from the bottom nav `tabs` array in `PartnerDashboard.tsx`
- Payments becomes a menu item inside the Profile hub
- Update the `Tab` type to remove `"payments"`

---

## Part 2: Profile Hub (New Design)

Replace the current `PartnerProfileTab` component (inline form fields) with a new hub layout.

**Top section (identity card):**
- Large centered profile photo with camera upload button
- Display name, partner type label
- Status indicators: Approved/Pending badge, Verified badge
- "Preview Public Profile" CTA button

**Menu section below (card-based list items):**
Each item is a tappable row with icon, label, subtitle, and chevron:

1. **Edit Public Profile** -- Opens a dedicated editing screen
2. **Photos and Media** -- Opens gallery management screen
3. **Badges and Achievements** -- Opens badges screen
4. **Sessions and Listings** -- Navigates to Home/Dashboard tab
5. **Settings** -- Opens settings screen
6. **Payments** -- Opens payments screen
7. **Support / Help** -- Opens the existing `HelpSupportPanel` sheet
8. **Log Out** -- Signs out (destructive style, no chevron)

**New file:** `src/components/partner/PartnerProfileHub.tsx`

---

## Part 3: Edit Public Profile (Dedicated Screen)

Extract and refine the current inline editing from `PartnerProfileTab` into a focused, full-screen editor.

**Fields:**
- Display Name
- Bio / About (textarea)
- Location
- Phone Number
- Sports / Specializations (tag picker, reuses `EditableTagsField` logic)
- Languages (tag picker)

Each field renders as a clean card-style row. Tapping opens an inline edit mode (same pattern as current `ProfileField`). The screen has a back button to return to the Profile hub.

**New file:** `src/components/partner/PartnerEditProfile.tsx`

---

## Part 4: Photos and Media Screen

A new dedicated screen for managing partner media.

**MVP scope:**
- Grid layout displaying uploaded photos (3-column grid)
- Upload button to add new photos (uses existing `avatars` storage bucket or a new `partner-media` bucket)
- Delete individual photos
- First 3-4 photos are marked as "featured" and shown on the public profile
- Empty state with upload prompt

**Database:** Requires a new `partner_media` table:
- `id` (uuid, primary key)
- `partner_id` (uuid, references partner_profiles)
- `image_url` (text)
- `sort_order` (integer, default 0)
- `is_featured` (boolean, default false)
- `created_at` (timestamptz)

RLS: Partners can manage their own media. Public read for approved partners.

**New files:**
- `src/components/partner/PartnerPhotosMedia.tsx`

**Note:** Drag-to-reorder and albums are deferred to a future iteration. The initial build focuses on upload, grid display, featured selection, and delete.

---

## Part 5: Badges and Achievements Screen

Move the existing `PartnerBadgesSection` component into a standalone screen accessible from the Profile hub.

**Layout:**
- Section 1: "Earned Badges" -- list of active badges with icon, title, description, "Earned" status
- Section 2: "Available to Earn" -- locked badges with reduced opacity, "Locked" status
- Motivational footer text: "Complete sessions, verify your profile, and maintain ratings to earn badges."
- Back button to return to Profile hub

**New file:** `src/components/partner/PartnerBadgesScreen.tsx`
(Reuses existing `useBadges`, `useAllBadgeDefinitions`, and `BadgeIcon` components)

---

## Part 6: Payments Screen (Inside Profile)

Move the existing `PartnerPaymentsTab` component as-is into a sub-screen accessible from the Profile hub menu. No functional changes -- only the entry point moves from bottom nav to Profile hub.

---

## Part 7: Settings Screen

A new grouped settings screen inside the Profile hub.

**Sections:**

1. **Notifications** (placeholder toggles)
   - Session reminders
   - New bookings
   - Messages
   - Payout updates

2. **Privacy and Visibility**
   - Show phone number publicly (toggle)
   - Show location publicly (toggle)

3. **Language Preferences**
   - Language selector (English / Georgian)

4. **Legal**
   - Terms and Conditions (links to `/terms`)
   - Privacy Policy (links to `/privacy`)

5. **Account**
   - Delete Account (destructive, opens existing `DeleteAccountDialog`)

**New file:** `src/components/partner/PartnerSettings.tsx`

---

## Part 8: Visual Design Upgrade

Applied across all new and refactored partner screens:

- Section spacing increased to 32-40px (`space-y-8` to `space-y-10`)
- Menu items use borderless card grouping with subtle `bg-card` backgrounds
- Consistent rounded corners (`rounded-2xl`)
- Premium shadow (`shadow-sm` or custom premium-shadow)
- Typography hierarchy: section headers at 20-22px/600 weight, body at 15-16px/400
- Icons use consistent lucide-react style, 20px size in menu items
- Green gradient ambient orbs retained in background (already implemented)
- No raw "form dump" layouts -- everything is card-based with clear tap targets

---

## Part 9: Sub-Screen Navigation Architecture

Instead of adding new routes to `App.tsx`, sub-screens will be managed as internal state within `PartnerDashboard.tsx`. The Profile tab will track which sub-screen is active:

```text
Profile Hub
  |-- Edit Public Profile (sub-screen)
  |-- Photos & Media (sub-screen)
  |-- Badges & Achievements (sub-screen)
  |-- Settings (sub-screen)
  |-- Payments (sub-screen)
```

A `profileSubScreen` state variable in `PartnerDashboard.tsx` controls which view renders when `activeTab === "profile"`. Each sub-screen has a back button that returns to the hub.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/partner/PartnerProfileHub.tsx` | Profile hub with identity card and menu |
| `src/components/partner/PartnerEditProfile.tsx` | Dedicated public profile editor |
| `src/components/partner/PartnerPhotosMedia.tsx` | Photo gallery management |
| `src/components/partner/PartnerBadgesScreen.tsx` | Badges and achievements screen |
| `src/components/partner/PartnerSettings.tsx` | Settings screen |

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/PartnerDashboard.tsx` | Remove Payments tab, add `profileSubScreen` state, render new hub/sub-screens, update bottom nav to 4 items |
| `src/components/PartnerProfileTab.tsx` | Deprecated / replaced by new hub components |

## Database Migration

- Create `partner_media` table with RLS policies for the Photos and Media feature

---

## What This Does NOT Change

- No changes to business logic, permissions, or existing Supabase queries
- No changes to the public-facing `PartnerProfile.tsx` page
- No changes to admin panel structure
- Existing components (`PartnerPaymentsTab`, `PartnerScheduleTab`, `PartnerMessagesTab`, `PartnerBadgesSection`) are reused, not rewritten
- The Home (dashboard) tab content remains the same

