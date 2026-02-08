

## Fix: Bottom Navigation Safe-Area Spacing for PWA/Native

The core issue is that the bottom navigation's `paddingBottom` uses `env(safe-area-inset-bottom)` via a `style` attribute, but this CSS function doesn't work reliably when set through inline styles in all environments. Additionally, the Bookings page uses a static `pb-24` instead of the dynamic safe-area calculation.

### Changes

**1. `src/index.css` -- Add safe-area bottom padding to `#root`**

Add `padding-bottom: env(safe-area-inset-bottom, 0px)` to the `#root` element. This ensures the entire app layout respects the home indicator area globally, so the background color fills behind it and no white strip appears.

**2. `src/components/BottomNav.tsx` -- Use CSS variable for safe-area padding**

Replace the inline `style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}` with `pb-[env(safe-area-inset-bottom,0px)]` as a Tailwind class (or use the CSS custom property `var(--sab)` already defined in the CSS). This ensures the value is properly resolved by the CSS engine rather than potentially being ignored as an inline style.

**3. `src/pages/Home.tsx` -- Use CSS variable for bottom padding**

Replace the inline style `paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0px))'` with `pb-[calc(60px+var(--sab))]` using the existing `--sab` CSS variable, ensuring consistent resolution.

**4. `src/pages/Bookings.tsx` -- Apply same bottom padding pattern**

Replace `pb-24` with the same dynamic `style={{ paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}` (or Tailwind equivalent) so Bookings has the same correct spacing.

### Technical Detail

The CSS variables `--sab`, `--sat`, etc. are already defined in `index.css` `:root`. Using `var(--sab)` through Tailwind arbitrary values is more reliable cross-browser than putting `env()` in inline styles, which some WebKit versions ignore.
