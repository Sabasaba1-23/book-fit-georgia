

## Profile Screen Premium Typography and Spacing Overhaul

Only the Profile screen (`src/pages/Profile.tsx`) will be modified. No global theme, color, font, or icon changes.

### Step 1 -- Typography Hierarchy

Apply a strict type scale to all text on the Profile screen:

| Element | Current | New |
|---|---|---|
| Profile name (H1) | `text-2xl font-bold` | `text-[30px] font-semibold tracking-[-0.3px] leading-[1.15]` |
| Subtitle ("Member since") | `text-sm text-primary-foreground/70` | `text-[14px] font-normal opacity-65 mt-2` |
| Section titles (Bookmarked, Fitness Interests, Account Settings) | `text-lg font-bold` | `text-[20px] font-semibold leading-[1.2] mb-4` |
| Body text / labels | various | `text-[15px] font-normal opacity-80` where applicable |

### Step 2 -- Spacing Rhythm

- Header area: increase `pt-6` to `pt-10` and `pb-20` to `pb-24` for breathing room
- Gap between hero bottom and stats card: keep the `-mt-12` overlap but add `mb-8` after stats (was `mb-6`)
- Gap between major sections (Bookmarked, Fitness Interests, Account Settings): increase from `mb-6` to `mb-10`
- Section title to content: `mb-4` (16px)
- Page horizontal padding: ensure consistent `px-5` (20px) everywhere (already done)

### Step 3 -- Stats Card Polish

- Numbers: `text-[27px] font-semibold leading-[1.1]` (was `text-2xl font-bold`)
- Labels: `text-[12px] font-medium uppercase tracking-[0.08em] opacity-55` (was `text-[10px] font-semibold`)
- Card: keep `rounded-2xl`, use `shadow-md` (softer), add `p-1` internal breathing room
- Dividers: add `divide-border/20` (lower contrast, ~0.2 opacity)
- Cell padding: increase from `py-5` to `py-6`

### Step 4 -- Bookmarked Header Row

- "Bookmarked" uses the new section title style (20px/600)
- "View all" becomes `text-[14px] font-medium opacity-75` (was `text-sm font-bold`)
- Row alignment: already flex with `justify-between` -- just update spacing below to `mb-4`

### Step 5 -- Account Settings List Rows

- Row height: increase padding from `py-3.5` to `py-4` (achieving ~62px row height)
- Left icon container: keep `h-10 w-10 rounded-xl` (already 40px, radius ~12px)
- Main label: `text-[16px] font-semibold` (was `text-sm font-semibold`)
- Chevron: add `opacity-50` (was full opacity muted-foreground)
- Row horizontal padding: increase from `px-4` to `px-[18px]`
- Card outer padding: add `p-3` wrapper around the list
- Dividers: already using `divide-y divide-border`, will soften to `divide-border/20`

### Step 6 -- Scope Guard

Only `src/pages/Profile.tsx` is modified. No changes to:
- Global CSS / index.css
- tailwind.config.ts
- Any other page or component
- Color theme or icon set

### Technical Details

All changes are inline Tailwind classes within `src/pages/Profile.tsx`. The `SettingsRow` sub-component at the bottom of the file will also be updated for row sizing and chevron opacity.

