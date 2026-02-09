import { useState, useEffect } from "react";
import { BellRing, CloseRemind, CalendarThirtyTwo, MessageOne, Star, VolumeNotice } from "@icon-park/react";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NotificationPrefs {
  bookingReminders: boolean;
  messages: boolean;
  promotions: boolean;
  newListings: boolean;
  sessionUpdates: boolean;
}

const STORAGE_KEY = "fitbook_notification_prefs";

function loadPrefs(): NotificationPrefs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    bookingReminders: true,
    messages: true,
    promotions: false,
    newListings: true,
    sessionUpdates: true,
  };
}

export default function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const toggle = (key: keyof NotificationPrefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const allOff = !prefs.bookingReminders && !prefs.messages && !prefs.promotions && !prefs.newListings && !prefs.sessionUpdates;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 pt-2 max-h-[85vh] overflow-y-auto">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" />
        <SheetHeader className="text-left mb-5">
          <SheetTitle className="text-xl font-extrabold text-foreground">Notifications</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Choose what you want to be notified about
          </SheetDescription>
        </SheetHeader>

        {allOff && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-destructive/5 p-4">
            <CloseRemind theme="two-tone" size={20} fill={["hsl(var(--destructive))", "hsl(var(--destructive) / 0.2)"]} />
            <p className="text-xs font-medium text-destructive">All notifications are off. You may miss important updates.</p>
          </div>
        )}

        <div className="space-y-1">
          <NotifRow
            icon={<CalendarThirtyTwo theme="two-tone" size={20} fill={["hsl(var(--primary))", "hsl(var(--primary) / 0.2)"]} />}
            iconBg="bg-primary/10"
            title="Booking Reminders"
            description="Get reminded before your sessions start"
            checked={prefs.bookingReminders}
            onChange={() => toggle("bookingReminders")}
          />
          <NotifRow
            icon={<MessageOne theme="two-tone" size={20} fill={["hsl(210 100% 50%)", "hsl(210 100% 50% / 0.2)"]} />}
            iconBg="bg-blue-500/10"
            title="Messages"
            description="New messages from trainers and gyms"
            checked={prefs.messages}
            onChange={() => toggle("messages")}
          />
          <NotifRow
            icon={<BellRing theme="two-tone" size={20} fill={["hsl(152 60% 45%)", "hsl(152 60% 45% / 0.2)"]} />}
            iconBg="bg-emerald-500/10"
            title="Session Updates"
            description="Changes to your booked sessions"
            checked={prefs.sessionUpdates}
            onChange={() => toggle("sessionUpdates")}
          />
          <NotifRow
            icon={<Star theme="two-tone" size={20} fill={["hsl(38 92% 50%)", "hsl(38 92% 50% / 0.2)"]} />}
            iconBg="bg-amber-500/10"
            title="New Listings"
            description="Sessions matching your interests"
            checked={prefs.newListings}
            onChange={() => toggle("newListings")}
          />
          <NotifRow
            icon={<VolumeNotice theme="two-tone" size={20} fill={["hsl(270 60% 55%)", "hsl(270 60% 55% / 0.2)"]} />}
            iconBg="bg-purple-500/10"
            title="Promotions & Offers"
            description="Deals and special offers from partners"
            checked={prefs.promotions}
            onChange={() => toggle("promotions")}
          />
        </div>

        <p className="mt-5 text-center text-[11px] text-muted-foreground">
          Push notifications require browser permission. Preferences are saved locally.
        </p>
      </SheetContent>
    </Sheet>
  );
}

function NotifRow({
  icon,
  iconBg,
  title,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-muted/30">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-[11px] text-muted-foreground truncate">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
