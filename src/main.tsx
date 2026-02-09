import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@icon-park/react/styles/index.css";
import { IconProvider, DEFAULT_ICON_CONFIGS } from "@icon-park/react";
import { initNativePlugins } from "./lib/native";
import { Capacitor } from "@capacitor/core";

const IconConfig = { ...DEFAULT_ICON_CONFIGS, strokeWidth: 3, strokeLinecap: "round" as const, theme: "outline" as const };

// Initialize native plugins (no-op on web)
initNativePlugins();

// Unregister PWA service workers inside native shell to avoid caching conflicts
if (Capacitor.isNativePlatform() && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById("root")!).render(
  <IconProvider value={IconConfig}>
    <App />
  </IconProvider>
);
