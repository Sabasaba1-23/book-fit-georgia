

# Store-Ready: iOS and Android Improvements

Your app has a solid Capacitor foundation. Here's what needs to change before submitting to the Apple App Store and Google Play Store.

---

## 1. Switch Capacitor to Local Bundle (Critical)

Right now your app loads from a remote URL (`https://fitbook.my`). Both Apple and Google **will reject** apps that are just web wrappers pointing to a website. The app must load from the local `dist/` bundle.

**What changes:**
- Remove the `server.url` from `capacitor.config.ts` so the app loads from the built-in `dist/` folder
- Keep a separate dev config or environment variable for development hot-reload

---

## 2. Disable PWA Service Worker in Native Builds

The PWA service worker conflicts with Capacitor's native WebView. It can cause caching issues, stale content, and update problems inside the native shell.

**What changes:**
- Conditionally disable `vite-plugin-pwa` registration when running inside Capacitor
- In `main.tsx`, skip service worker registration when `Capacitor.isNativePlatform()` is true

---

## 3. Android Back Button Handling

Android users expect the hardware/gesture back button to navigate back in-app, not close the app. Without handling this, the app feels broken.

**What changes:**
- Install `@capacitor/app` plugin
- Listen for `backButton` events in `native.ts`
- If there's browser history, go back; otherwise show a "Press again to exit" toast or minimize

---

## 4. Deep Linking Setup

For sharing trainer profiles, bookings, etc. via links that open directly in the app.

**What changes:**
- Add intent filters in `AndroidManifest.xml` for `fitbook.my` domain
- Add Associated Domains configuration for iOS (requires Apple Developer account setup)
- Configure Capacitor App plugin to handle incoming URLs and route them to the correct page

---

## 5. Push Notifications (Recommended)

Users and trainers need to be notified about bookings, messages, and session confirmations even when the app is closed.

**What changes:**
- Install `@capacitor/push-notifications`
- Request notification permission on first login
- Store device tokens in Supabase
- Create a Supabase Edge Function to send notifications via Firebase Cloud Messaging (FCM for both Android and iOS)

---

## 6. Splash Screen and App Icon Polish

The current splash screen and icons use Capacitor defaults. Stores require proper branding.

**What changes:**
- Replace all `splash.png` variants with branded FitBook splash images matching the coral theme
- Replace all `ic_launcher` / mipmap icons with the FitBook logo
- For iOS: generate proper `AppIcon.appiconset` with all required sizes
- Configure splash screen auto-hide timing in `capacitor.config.ts` with a smooth fade

---

## 7. App Metadata for Store Listings

Update strings and metadata that appear in the stores.

**What changes:**
- `android/app/src/main/res/values/strings.xml`: Change `app_name` from "book-fit-georgia" to "FitBook Georgia"
- Set proper `versionCode` and `versionName` in `android/app/build.gradle` (e.g., versionCode 1, versionName "1.0.0")
- Add a privacy policy URL (you already have `/privacy` page -- just need the hosted URL for store submission)

---

## 8. Network & Offline Handling

Native apps should gracefully handle network loss instead of showing blank screens.

**What changes:**
- Add a `NetworkStatus` component using `@capacitor/network` plugin
- Show a non-intrusive banner ("No internet connection") when offline
- Queue failed API calls for retry when connection returns

---

## 9. Keyboard Handling Improvements

Ensure forms don't get hidden behind the keyboard on both platforms.

**What changes:**
- Add `"keyboard": { "resize": "body", "style": "dark" }` to `capacitor.config.ts`
- The existing `interactive-widget=resizes-content` viewport meta tag is good -- this reinforces it natively

---

## 10. Safe Area and Notch Handling Review

Ensure the app respects notches, Dynamic Island (iPhone), and Android punch-hole cameras.

**What changes:**
- Verify all fixed headers/footers use `env(safe-area-inset-*)` padding (already partially done)
- Add `viewport-fit=cover` to the viewport meta tag if not present
- Test edge-to-edge rendering on both platforms

---

## Technical Details

### Files to Modify
- `capacitor.config.ts` -- remove remote URL, add keyboard/splash config
- `src/main.tsx` -- conditionally skip PWA service worker in native
- `src/lib/native.ts` -- add back button handler, network listener
- `android/app/src/main/AndroidManifest.xml` -- deep link intent filters
- `android/app/src/main/res/values/strings.xml` -- fix app display name
- `android/app/build.gradle` -- version code/name
- `index.html` -- viewport-fit=cover

### New Files
- `src/components/NetworkStatus.tsx` -- offline banner component

### New Dependencies
- `@capacitor/app` -- back button and deep links
- `@capacitor/network` -- connectivity detection
- `@capacitor/push-notifications` -- (optional, for notifications)

### What You Need To Do Outside Lovable
- Generate branded splash screens and app icons (tools like capacitor-assets can auto-generate all sizes)
- Set up Firebase project for push notifications (FCM)
- Create Apple Developer account and configure signing
- Create Google Play Developer account and configure signing
- After each code change: `git pull`, `npm install`, `npx cap sync`, then build

### Execution Order
1. Capacitor config fix (local bundle + keyboard + splash settings)
2. PWA disable in native + back button handling
3. App name and version metadata
4. Network/offline handling component
5. Deep linking setup
6. Push notifications (can be a separate phase)

