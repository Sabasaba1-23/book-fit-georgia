

# Mini Media Feed on Public Partner Profile

Add an Instagram-style media gallery to the public trainer/gym profile page, positioned between the "About" bio section and the "Upcoming Sessions" section.

---

## What Gets Built

### 1. Media Carousel Section (on public profile)

A new section on `PartnerProfile.tsx` inserted after the Bio/About section and before the Experience & Details section.

- Section header: "Photos & Videos" with a subtle camera icon
- Shows featured media first, then remaining by sort_order
- Horizontal swipeable carousel using the existing Embla carousel components
- Each item is a rounded card with aspect-ratio 4:3
- Shows a "Swipe to see more" hint when more than 2 items exist
- Tapping any item opens the fullscreen viewer
- If no media exists, the section is hidden entirely (no empty state on public profile)

### 2. Fullscreen Media Viewer

A new component `MediaLightbox.tsx` that opens when a user taps a media item.

- Full-screen overlay with dark backdrop
- Horizontal swipe navigation between media items (Embla carousel, full-width)
- Media counter in top-center ("3 / 12")
- Close button (X) in top-right corner
- Clean transitions, no bouncy animations
- Tap outside or swipe down to close (via backdrop click)
- Supports images only for now (video support deferred)

### 3. Data Fetching

Inside `PartnerProfile.tsx`, add a query to fetch from `partner_media` table:
- Filter by `partner_id = id`
- Order by `is_featured DESC, sort_order ASC`
- Only fetch for approved partners (RLS already handles this)

---

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/partner/MediaLightbox.tsx` | **Create** | Fullscreen gallery viewer with swipe navigation and counter |
| `src/pages/PartnerProfile.tsx` | **Modify** | Add media state, fetch partner_media, render carousel section between Bio and Details |

---

## Technical Details

**PartnerProfile.tsx changes:**
- Add `mediaItems` state array
- Fetch from `partner_media` in the existing `load()` function
- New section between SECTION 3 (Bio) and SECTION 4 (Details), roughly around line 360
- Uses `Carousel`, `CarouselContent`, `CarouselItem` from `src/components/ui/carousel.tsx`
- Each carousel slide: rounded-2xl card, aspect-ratio 4:3, object-cover image, tap handler

**MediaLightbox.tsx:**
- Props: `items: {id, image_url}[]`, `initialIndex: number`, `onClose: () => void`
- Full-viewport fixed overlay (`fixed inset-0 z-50 bg-black/95`)
- Uses Embla carousel for swipe navigation (full-width slides)
- Counter display: `currentIndex + 1 / total`
- Close on X button click or backdrop tap
- Keyboard support: Escape to close, arrow keys to navigate

**No database changes needed** -- the `partner_media` table and RLS policies already exist from the previous implementation.

