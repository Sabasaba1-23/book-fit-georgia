

# Full Trainer Profile Overhaul

A complete visual and structural redesign of `src/pages/PartnerProfile.tsx` to create a premium, dense, conversion-focused public profile.

---

## Overview

Replace the current gradient-background + circular-avatar layout with a bold hero-image-first design. Compress all sections, eliminate empty space, and optimize every scroll pixel for information density and booking conversion.

---

## 1. Hero Section (Replace Current)

**Remove:** The gradient background div + circular Avatar + centered text identity block (lines 262-321).

**Replace with:**

- Full-width hero image using `partner.logo_url` (or first featured media item as fallback), displayed as a tall `aspect-[3/4]` or fixed `h-[420px]` image with `object-cover`
- If no image exists, fall back to the current gradient
- Bottom gradient overlay (from transparent to background) on the lower 40% of the hero
- Overlay card anchored to bottom of hero containing:
  - Trainer name (24px, font-extrabold) with verified checkmark icon inline (not a separate badge)
  - Role/specialization label (uppercase, 11px, tracking-wide, primary color)
  - Compact stats row: rating with star + review count, years experience, location -- all on one line separated by dots
- Two action buttons floating at bottom-right of hero:
  - Primary: "Book a Session" (full-width below hero, or prominent CTA)
  - Secondary: Bookmark icon button (rounded-full, glass background)

**Remove:** The separate circular avatar entirely. The hero image IS the identity visual.

---

## 2. Quick Stats Row (Remove Separate Section)

**Remove:** The current 3-column `StatBlock` grid (Section 2, lines 323-336). This data moves into the hero overlay card as inline text, eliminating an entire section of vertical space.

---

## 3. CTA Row (Simplified)

**Keep** the CTA area but move it directly below the hero overlay, tight spacing. Remove the standalone bookmark and chat circle buttons from this row -- bookmark moves to hero, chat stays in contact section.

Layout:
- Full-width "Book a Session" button (rounded-2xl, primary bg, bold uppercase)
- No surrounding padding bloat

---

## 4. Badges (Icon Row Under Name)

**Move** badges from below the identity text into the hero overlay card, displayed as a compact row of small badge icons (just icons, no text pills) directly under the name/role line. Tapping opens the existing `BadgesModal` for full details.

**Remove** the current `ProfileBadges` pill-style component from the identity section. Replace with a minimal icon-only row using `BadgeIcon` at `size="sm"`.

---

## 5. About Section (Condensed)

**Keep** but tighten:
- Remove the `bg-card border` wrapper card. Bio text renders directly with no card container.
- Max 3 lines visible (change `line-clamp-4` to `line-clamp-3`)
- "Read more" link inline, smaller
- Reduce top margin from `mt-10` to `mt-6`
- Section title stays but uses tighter spacing

---

## 6. Photos and Videos (Already Built - Minor Tweaks)

**Keep** the existing carousel section. Minor adjustments:
- Reduce top margin from `mt-10` to `mt-6`
- Keep current behavior (carousel, lightbox on tap)

---

## 7. Experience and Details (Keep Collapsible, Tighter)

**Keep** the collapsible pattern but compress:
- Reduce margin from `mt-8` to `mt-6`
- Keep collapsed summary showing years, type, sports count, languages count
- Expanded content stays the same (credential rows, chips)
- No structural changes needed -- already well-built

---

## 8. Sessions List (Conversion-Optimized)

**Redesign** the listings section:
- Rename section title: "Available Sessions"
- Highlight the soonest session with a subtle accent border or "Next Available" badge
- Keep the current card layout but add:
  - Sport name as a small chip/label
  - Availability indicator: "Next" badge on first listing, "Limited" on low-spot listings
- Price stays right-aligned, bold
- Remove the icon rotation (Zap/Dumbbell/Trophy) -- use a consistent calendar or activity icon instead

---

## 9. Contact Section (Tighter)

**Keep** but reduce padding. Remove outer card wrapper for the unlocked state -- show icons directly. Locked state stays as-is.

---

## 10. Reviews (Keep, Minor Tightening)

**Keep** current layout. Reduce `mt-10` to `mt-6`.

---

## 11. Sticky Bottom CTA (Keep, Refine)

**Keep** the fixed bottom bar. Ensure it has glass blur and shows "From X GEL per session" with "Book Now" button.

---

## 12. Visual Style Changes (Global)

Applied throughout:
- All section margins reduced from `mt-10` to `mt-6` for density
- Remove redundant `bg-card border` wrappers where content is simple (bio, contact)
- Keep card wrappers only for grouped data (details, sessions, reviews)
- Section titles stay uppercase/tracked but with tighter bottom margin

---

## Technical Details

### File Modified

`src/pages/PartnerProfile.tsx` -- single file, full rewrite of the render section.

### Hero Image Logic

```text
heroImage = partner.logo_url
  || (mediaItems.length > 0 ? mediaItems[0].image_url : null)

If heroImage exists: render full-width image with gradient overlay
If not: render current gradient fallback (but with overlay card still)
```

### Removed Sub-components
- `StatBlock` -- data moves to hero overlay inline text
- `ProfileBadges` usage replaced with inline badge icon row

### Kept Sub-components
- `SectionTitle`, `CredentialRow`, `DetailChipRow` -- reused as-is
- `MediaLightbox` -- unchanged

### No Database Changes
No schema or RLS changes needed.

### No New Files
All changes are within the existing `PartnerProfile.tsx`.

---

## What This Does NOT Change

- No changes to data fetching logic (all queries stay identical)
- No changes to `MediaLightbox.tsx`
- No changes to badge hooks or components
- No changes to routing or navigation
- No business logic changes
- Partner Dashboard remains untouched

