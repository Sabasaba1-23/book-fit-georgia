import { useEffect, useState } from 'react';
import { isNative } from '@/lib/platform';
import { WifiOff } from 'lucide-react';

export default function NetworkStatus() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    // Web fallback
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);

    if (!navigator.onLine) setOffline(true);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    // Native: use Capacitor Network plugin
    let removeListener: (() => void) | undefined;
    if (isNative()) {
      import('@capacitor/network').then(({ Network }) => {
        Network.getStatus().then((s) => setOffline(!s.connected));
        Network.addListener('networkStatusChange', (s) => setOffline(!s.connected)).then(
          (handle) => { removeListener = () => handle.remove(); }
        );
      }).catch(() => {});
    }

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      removeListener?.();
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-destructive-foreground text-sm font-medium"
      style={{ paddingTop: `calc(var(--safe-top, 0px) + 8px)` }}>
      <WifiOff className="h-4 w-4" />
      No internet connection
    </div>
  );
}
