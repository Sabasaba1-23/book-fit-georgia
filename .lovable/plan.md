

## Home / Discovery Feed — Premium Card Redesign

Only `ListingCard.tsx`, `PackageCard.tsx`, `Home.tsx`, and `FilterChips.tsx` will be modified. No global theme, color, or component changes.

---

### Step 1 — Card Layout: Image-First, Immersive

Redesign both `ListingCard` and `PackageCard` to be image-dominant:

- Image takes ~65% of card height (change from fixed `200px` to `clamp(220px, 55vw, 320px)`)
- Add a bottom gradient overlay on the image: `linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 40%)`
- Move the **title** and **category pill** onto the image, positioned at the bottom inside the gradient
- Remove the partner avatar row from below the image (move partner name as subtle text on the image, above the title)
- Below the image: only a slim content strip with one meta line + price + book button
- Card border-radius: `rounded-[22px]`
- Card gap in grid: `gap-7` (28px)
- No white background directly under image — use `bg-card` with minimal height

### Step 2 — Image Gradient Overlay

Add a `div` overlay inside the image container:

```
<div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
```

All text on the image uses `text-white` with appropriate drop-shadow for readability.

### Step 3 — Card Typography Hierarchy

**On the image (inside gradient):**

| Element | Style |
|---|---|
| Category pill | `text-[11px] font-semibold uppercase tracking-wide`, white/90 bg with backdrop-blur, positioned top-left |
| Title | `text-[22px] font-semibold leading-tight text-white line-clamp-2`, positioned bottom-left inside gradient |
| Partner name | `text-[13px] font-medium text-white/80`, just above the title |

**Below the image (slim strip):**

| Element | Style |
|---|---|
| One meta line | `text-[13px] font-normal text-muted-foreground opacity-80` — show only duration OR date, not both |
| Price | `text-[19px] font-semibold text-foreground` — visual anchor |
| Book button | Pill shape, `text-[14px] font-semibold`, secondary feel |

### Step 4 — Information Reduction

Per card, show ONLY:
- Category (pill on image)
- Title (on image)
- Partner name (on image, subtle)
- One meta detail below image (duration for packages, date for listings)
- Price
- Book button

Remove from collapsed card view:
- Location row
- Spots left indicator
- Star rating row
- Multiple meta items (clock + calendar + map)
- Partner avatar (keep name only)

All removed info remains in the expanded detail panel (no data loss).

### Step 5 — Spacing and Padding

- Card `rounded-[22px]` (was `rounded-2xl` / 16px)
- Feed grid gap: `gap-7` (was `gap-4`)
- Below-image content padding: `px-5 py-4` (generous, not tight)
- Section header ("Recommended") top spacing: `pt-5 pb-3`

### Step 6 — CTA Button Fix

- Book button: `rounded-full` pill shape (was `rounded-xl`)
- Size: `px-5 py-2.5 text-[14px] font-semibold`
- Visually secondary — not larger than the title
- Subtle hover: `hover:bg-primary/90`

### Step 7 — Top Area (Search + Filters) Cleanup

In `Home.tsx`:
- Increase header top padding: `pt-6` (was `pt-4`)
- Search bar: lighter border `border-border/40`, smaller height, `rounded-full` pill shape
- "Recommended" heading: `text-[17px] font-semibold` (slightly smaller, calmer)

In `FilterChips.tsx`:
- Smaller chips: `py-1 px-3.5 text-[12px]` (was `py-1.5 px-4 text-[13px]`)
- `rounded-full` (was `rounded-lg`)
- Selected state: keep primary bg but at `bg-primary/90`

### Step 8 — Scope Guard

Only these files are modified:
- `src/components/ListingCard.tsx` — card layout, gradient, typography, info reduction
- `src/components/PackageCard.tsx` — same treatment as ListingCard
- `src/pages/Home.tsx` — grid gap, header/search styling
- `src/components/FilterChips.tsx` — chip sizing

No changes to:
- Global CSS / tailwind.config.ts
- Color theme or icon set
- Any other page or component
- Expanded detail panel content (all info preserved there)

### Technical Notes

- The gradient overlay is a positioned `div` inside the existing image container — no new components
- `line-clamp-2` on title uses Tailwind's built-in utility
- Image height uses CSS `clamp()` via inline style for responsive scaling
- Partner avatar removed from collapsed view only; still visible in expanded panel
- Rating star moved to expanded panel only (shown when verified reviews exist)

