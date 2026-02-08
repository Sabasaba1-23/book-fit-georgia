

# Verification System Redesign

## Overview

Replace the current flat, bureaucratic verification form (buried in Settings) with a modern, step-based verification flow on its own dedicated dashboard tab. The flow will be role-aware (different for Individual Trainers vs Gyms), progressive, skippable, and motivating rather than pressuring.

## What Changes

### 1. Dashboard Navigation Restructure

- Rename the "Settings" tab to "Profile" (personal settings, display info, account)
- Move verification OUT of Settings into a new dedicated tab or a prominent card on the Dashboard home
- Add a "Verification" card on the Dashboard home tab that shows current status with a clear CTA
- The verification flow opens as a full-screen overlay/sheet when tapped

### 2. Soft Nudge Popup (First Login + Weekly)

- On dashboard load, check `localStorage` for `verification_nudge_dismissed_at`
- If partner is unverified AND (first visit OR last dismissal > 7 days ago), show a friendly dialog:
  - Title: "Build trust with your clients"
  - Body: "Verified profiles get more bookings and appear more trustworthy to users."
  - Buttons: **"Get Verified"** (primary) | **"Maybe Later"** (ghost)
- Never blocks navigation; dismisses on any click outside

### 3. Verification Status Card on Dashboard Home

A compact card always visible on the dashboard home tab:

```text
+--------------------------------------------------+
|  [Shield icon]   Identity Verification            |
|  Status: Unverified / In Progress / Verified      |
|  "Complete 2 more steps to get verified"           |
|  [Get Verified ->]  or  [View Details ->]          |
+--------------------------------------------------+
```

For Gyms, show dual status:
- Representative: Verified / Pending
- Business: Verified / Pending

### 4. Individual Trainer Verification Flow (3 Steps)

Opens as a sheet/overlay with a progress bar at top.

**Step 1 -- About You**
- Full name (pre-filled from display_name)
- Country / City (maps to existing `address` field)
- Short professional bio/description (new field, stored in partner_verifications or partner_profiles.bio)

**Step 2 -- Your Experience**
- Trainer type chips (Personal Trainer, Group Instructor, Coach, etc.)
- Years of experience (dropdown: <1, 1-3, 3-5, 5-10, 10+)
- Specializations (multi-select checkboxes from sports list)
- Certificate upload (clearly marked OPTIONAL with friendly copy)

**Step 3 -- Identity Confirmation**
- Document type selector (ID Card / Passport / Driver's License)
- Upload area with drag-drop feel
- Privacy note: "Only visible to our admin team. Never shown publicly."
- Submit button

Each step has Next / Back buttons. Progress saves to DB after each step so users can return later (stored via existing `partner_verifications` table with new columns).

### 5. Gym / Business Verification Flow (2 Parts)

Same sheet overlay, but with two clearly labeled sections and independent progress:

**Part 1 -- Representative**
- Full name
- Role at business (Owner / Manager / Representative) -- new field
- Personal ID upload
- Status badge shown independently

**Part 2 -- Business Details**
- Business name (pre-filled from display_name)
- Business type (Gym / Studio / Sports Club / Other)
- City / Address
- Business registration document (OPTIONAL)
- Website or social link (OPTIONAL)
- Status badge shown independently

### 6. Database Changes

Add new columns to `partner_verifications`:

| Column | Type | Notes |
|--------|------|-------|
| full_name | text | Pre-filled from profile |
| country_city | text | Replaces address semantically |
| professional_description | text | Short bio |
| trainer_type | text | e.g. "personal_trainer" |
| years_experience | text | e.g. "3-5" |
| specializations | text[] | Array of sports |
| business_type | text | For gyms only |
| representative_role | text | For gyms only |
| website_social | text | For gyms only |
| verification_step | integer | Tracks progress (1, 2, 3) |
| rep_status | text | For gyms: representative verification status |
| biz_status | text | For gyms: business verification status |

No existing columns removed -- backward compatible migration.

### 7. New Components

| Component | Purpose |
|-----------|---------|
| `VerificationSheet.tsx` | Main overlay container with step navigation and progress bar |
| `TrainerVerificationFlow.tsx` | 3-step flow for individual trainers |
| `GymVerificationFlow.tsx` | 2-part flow for gyms/studios |
| `VerificationStatusCard.tsx` | Dashboard home card showing status + CTA |
| `VerificationNudgeDialog.tsx` | Soft popup for unverified partners |

### 8. Files Modified

| File | Change |
|------|--------|
| `PartnerDashboard.tsx` | Add VerificationStatusCard to home tab; remove verification from Settings; rename Settings to Profile |
| `PartnerVerificationForm.tsx` | Replaced entirely by the new flow components |
| `supabase/migrations/[new].sql` | Add new columns to partner_verifications |
| `integrations/supabase/types.ts` | Auto-updated with new schema |

### 9. UX Copy Guidelines

All copy will follow these principles:
- Friendly, encouraging tone: "Help clients trust you" not "You must verify"
- Benefits-focused: "Verified profiles are more likely to get bookings"
- No false promises: Will NOT claim ranking boosts unless implemented
- Privacy reassurance on document uploads: "Only visible to admins"
- Clear progress: "Step 2 of 3" with visual progress bar

### 10. What Will NOT Change

- Auth logic remains untouched
- Documents remain in private `partner-documents` storage bucket
- Admin approve/reject flow stays the same
- RLS policies unchanged
- Existing `partner_documents` table and upload logic reused
- Account deletion already cascades via foreign keys

