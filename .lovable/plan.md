
# Capacitor Native App Setup for FitBook Georgia

## What This Does
This plan wraps your existing FitBook web app inside a native shell using **Capacitor**, so it can be published on the **Apple App Store** and **Google Play Store** while still working as a web app in the browser. Your existing code stays the same -- Capacitor simply packages it into a native container.

## What Changes in the Code

### 1. Install Capacitor Dependencies
Add the following packages:
- `@capacitor/core` (runtime)
- `@capacitor/cli` (dev dependency)
- `@capacitor/ios` and `@capacitor/android` (platform targets)
- `@capacitor/status-bar` and `@capacitor/splash-screen` (native UI polish)
- `@capacitor/haptics` (tactile feedback for a native feel)

### 2. Create Capacitor Config File
Create `capacitor.config.ts` with:
- **App ID**: `app.lovable.0f39d5b9e35d4113beb4e383909c1d7f`
- **App Name**: `book-fit-georgia`
- **Web Dir**: `dist` (Vite's build output)
- **Live Reload Server**: Points to the Lovable preview URL for development

### 3. Native UI Polish
- **Status Bar**: Add a helper that detects Capacitor and styles the native status bar (transparent overlay, light/dark text)
- **Splash Screen**: Auto-hide after app loads
- **Safe Areas**: Update CSS to respect device notches and home indicators (iPhone safe areas)
- **Bottom Nav**: Adjust padding to sit above the home indicator on modern phones
- **Haptic Feedback**: Add subtle vibration on button taps for a native feel

### 4. Platform Detection Utility
Create a small `src/lib/platform.ts` helper:
- `isNative()` -- returns true when running inside Capacitor
- `isIOS()` / `isAndroid()` -- platform checks
- Used to conditionally apply native-only behaviors (status bar, haptics)

### 5. CSS Adjustments for Native Feel
- Add `env(safe-area-inset-*)` padding to header and bottom nav
- Disable text selection and context menus in native mode (feels more app-like)
- Ensure the glassmorphism bottom nav clears the iPhone home bar

## What You Need To Do After (on your computer)

1. **Export to GitHub** using the button in Lovable
2. Clone the repo and run `npm install`
3. Run `npx cap add ios` and/or `npx cap add android`
4. Run `npm run build && npx cap sync`
5. Open in Xcode (`npx cap open ios`) or Android Studio (`npx cap open android`)
6. Build and submit to the App Store / Google Play

For development with live reload, the config points to your Lovable preview URL so changes appear instantly on your phone.

## Technical Details

### Files Created
| File | Purpose |
|------|---------|
| `capacitor.config.ts` | Capacitor project configuration |
| `src/lib/platform.ts` | Platform detection utilities |
| `src/lib/native.ts` | Status bar, splash screen, haptics initialization |

### Files Modified
| File | Change |
|------|--------|
| `package.json` | Add Capacitor dependencies |
| `src/main.tsx` | Initialize native plugins on app start |
| `src/index.css` | Add safe-area padding, native-feel CSS |
| `src/components/BottomNav.tsx` | Safe-area bottom padding |
| `src/pages/Home.tsx` | Safe-area top padding for header |

### No Breaking Changes
- The web app continues to work exactly as before in the browser
- Native-only code is guarded by `isNative()` checks
- All existing functionality (bookings, profiles, payments, reviews) is untouched

For the full guide on building and deploying, read: [Lovable Capacitor Blog Post](https://docs.lovable.dev)
