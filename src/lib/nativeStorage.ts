import { Capacitor } from '@capacitor/core';

/**
 * A localStorage-compatible adapter backed by @capacitor/preferences
 * for native platforms. This ensures auth sessions persist even when
 * the WebView's localStorage is cleared by the OS.
 */
let PreferencesPlugin: typeof import('@capacitor/preferences').Preferences | null = null;

// Eagerly load the plugin on native
if (Capacitor.isNativePlatform()) {
  import('@capacitor/preferences').then(m => {
    PreferencesPlugin = m.Preferences;
  });
}

// In-memory cache so getItem can be synchronous (required by Supabase)
const cache = new Map<string, string>();

// Pre-load all Supabase keys into cache on startup
export async function initNativeStorage() {
  if (!Capacitor.isNativePlatform()) return;
  const { Preferences } = await import('@capacitor/preferences');
  PreferencesPlugin = Preferences;

  // Load the known Supabase auth key
  const key = `sb-${import.meta.env.VITE_SUPABASE_PROJECT_ID}-auth-token`;
  const { value } = await Preferences.get({ key });
  if (value) {
    cache.set(key, value);
  }
}

export const nativeStorage = {
  getItem(key: string): string | null {
    return cache.get(key) ?? null;
  },
  setItem(key: string, value: string): void {
    cache.set(key, value);
    PreferencesPlugin?.set({ key, value });
  },
  removeItem(key: string): void {
    cache.delete(key);
    PreferencesPlugin?.remove({ key });
  },
};
