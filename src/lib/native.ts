import { isNative, isIOS } from './platform';

export async function initNativePlugins() {
  if (!isNative()) return;

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

  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide();
  } catch (e) {
    console.warn('SplashScreen plugin not available:', e);
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
