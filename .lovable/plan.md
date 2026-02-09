

## Add IconPark React Icon Library

### What
Install the `@icon-park/react` package and integrate its icons across the app to elevate the visual style. IconPark offers 2000+ icons with 4 themes (outline, filled, two-tone, multi-color), giving the UI a richer, more distinctive look compared to using only Lucide.

### Steps

**1. Install the package**
- Add `@icon-park/react` as a dependency
- Import IconPark's base stylesheet (`@icon-park/react/styles/index.css`) in `src/main.tsx`

**2. Set up a global IconProvider (optional but recommended)**
- Wrap the app with `IconProvider` in `src/main.tsx` to set default props like `strokeWidth: 3`, `strokeLinecap: 'round'`, and `theme: 'outline'` so all IconPark icons have a consistent style matching the app's rounded aesthetic

**3. Replace select icons across key components**
Swap specific Lucide icons for IconPark equivalents where the richer style adds visual value:

| Component | Current (Lucide) | New (IconPark) | Theme |
|---|---|---|---|
| **BottomNav** | `Home`, `CalendarCheck`, `MessageSquareMore` | `Home`, `CalendarThirtyTwo`, `ChatDot` | outline |
| **Home header** | `Search`, `Bell`, `SlidersHorizontal` | `Search`, `BellRing`, `SlidersHorizontal` | outline |
| **Profile page** | `Pencil`, `CreditCard`, `Bell`, `HelpCircle`, `LogOut`, `Camera`, `Trash2` | `EditTwo`, `BankCard`, `Remind`, `HeadsetOne`, `Logout`, `Camera`, `Delete` | outline |
| **NotificationsPanel** | `Bell`, `BellOff`, `Calendar`, `MessageCircle`, `Star`, `Megaphone` | `BellRing`, `CloseRemind`, `CalendarThirtyTwo`, `MessageOne`, `Star`, `VolumeNotice` | two-tone |
| **PaymentMethodsPanel** | `CreditCard`, `Smartphone`, `ChevronRight` | `BankCard`, `PhoneTwo`, `Right` | outline |

**4. Files to modify**
- `src/main.tsx` -- add CSS import and IconProvider wrapper
- `src/components/BottomNav.tsx` -- swap 3 nav icons
- `src/pages/Home.tsx` -- swap header icons
- `src/pages/Profile.tsx` -- swap profile menu icons
- `src/components/NotificationsPanel.tsx` -- swap notification row icons
- `src/components/PaymentMethodsPanel.tsx` -- swap payment icons

### Technical Notes
- IconPark icons render as `<span>` wrappers around SVGs, so sizing uses the `size` prop (e.g., `size={22}`) instead of className `h-5 w-5`
- Color is controlled via the `fill` prop (accepts a string or array for multi-color themes)
- Lucide will remain installed for any icons not available in IconPark
- The two-tone theme on notification icons will add visual richness using the app's primary/secondary colors
