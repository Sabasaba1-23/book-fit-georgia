import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

export default function InAppBrowserBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || (navigator as any).vendor || "";
    const isInApp =
      ua.includes("Instagram") ||
      ua.includes("FBAN") ||
      ua.includes("FBAV") ||
      ua.includes("Twitter") ||
      ua.includes("LinkedInApp") ||
      ua.includes("TikTok") ||
      ua.includes("Snapchat");

    if (isInApp) setShow(true);
  }, []);

  if (!show) return null;

  const currentUrl = window.location.href;

  const handleOpen = () => {
    // Attempt to open in external browser
    window.open(currentUrl, "_system");
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[9999] flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground shadow-lg">
      <ExternalLink className="h-5 w-5 shrink-0" />
      <p className="flex-1 text-sm font-medium leading-tight">
        For the best experience, open FitBook in your browser
      </p>
      <button
        onClick={handleOpen}
        className="shrink-0 rounded-lg bg-primary-foreground/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide backdrop-blur-sm"
      >
        Open
      </button>
      <button onClick={() => setShow(false)} className="shrink-0 p-1 opacity-70">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
