import { isNative, isIOS, isAndroid } from './platform';

let backPressedOnce = false;

export async function initNativePlugins() {
  if (!isNative()) return;

  // Status bar
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setOverlaysWebView({ overlay: true });
    if (isIOS()) {
      await StatusBar.setBackgroundColor({ color: '#00000000' });
    }
  } catch (e) {
    console.warn('StatusBar plugin not available:', e);
  }

  // Splash screen
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch (e) {
    console.warn('SplashScreen plugin not available:', e);
  }

  // Android back button
  if (isAndroid()) {
    try {
      const { App: CapApp } = await import('@capacitor/app');
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          if (backPressedOnce) {
            CapApp.exitApp();
          } else {
            backPressedOnce = true;
            // Show a brief toast-like message (uses DOM for simplicity)
            const toast = document.createElement('div');
            toast.textContent = 'Press back again to exit';
            Object.assign(toast.style, {
              position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
              background: 'hsl(220 20% 14% / 0.9)', color: '#fff', padding: '8px 20px',
              borderRadius: '20px', fontSize: '14px', zIndex: '99999', fontFamily: 'Lexend, sans-serif',
            });
            document.body.appendChild(toast);
            setTimeout(() => { backPressedOnce = false; toast.remove(); }, 2000);
          }
        }
      });
    } catch (e) {
      console.warn('App plugin not available:', e);
    }
  }

  // Deep link handling
  try {
    const { App: CapApp } = await import('@capacitor/app');
    CapApp.addListener('appUrlOpen', ({ url }) => {
      try {
        const parsed = new URL(url);
        const path = parsed.pathname + parsed.search + parsed.hash;
        if (path && path !== '/') {
          window.location.href = path;
        }
      } catch {
        // ignore malformed URLs
      }
    });
  } catch (e) {
    // App plugin not available
  }
}

export async function triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (!isNative()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] });
  } catch (e) {
    // Haptics not available
  }
}
