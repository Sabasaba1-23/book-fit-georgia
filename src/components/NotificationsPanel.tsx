import { useState, useEffect, useCallback } from "react";
import {
  Alarm, CloseRemind, CalendarThirtyTwo, MessageOne,
  Star, VolumeNotice, SettingTwo, Time, PreviewCloseOne,
} from "@icon-park/react";
import { Moon, ExternalLink, ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface NotificationPrefs {
  bookingReminders: boolean;
  sessionUpdates: boolean;
  messages: boolean;
  messagePreview: "full" | "sender" | "none";
  newListings: boolean;
  promotions: boolean;
  quietHours: boolean;
  quietFrom: string;
  quietTo: string;
}

type PermissionState = "granted" | "denied" | "default" | "unsupported";

const STORAGE_KEY = "fitbook_notification_prefs";

const DEFAULT_PREFS: NotificationPrefs = {
  bookingReminders: true,
  sessionUpdates: true,
  messages: false,
  messagePreview: "full",
  newListings: false,
  promotions: false,
  quietHours: false,
  quietFrom: "22:00",
  quietTo: "08:00",
};

function getStorageKey(userId?: string) {
  return userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
}

function loadPrefs(userId?: string): NotificationPrefs {
  try {
    const stored = localStorage.getItem(getStorageKey(userId));
    if (stored) return { ...DEFAULT_PREFS, ...JSON.parse(stored) };
  } catch {}
  return { ...DEFAULT_PREFS };
}

function getPermissionState(): PermissionState {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission as PermissionState;
}

export default function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(() => loadPrefs(user?.id));
  const [permission, setPermission] = useState<PermissionState>(getPermissionState);

  // Reload prefs when user changes
  useEffect(() => {
    setPrefs(loadPrefs(user?.id));
  }, [user?.id]);

  // Persist
  useEffect(() => {
    localStorage.setItem(getStorageKey(user?.id), JSON.stringify(prefs));
  }, [prefs, user?.id]);

  // Listen for permission changes
  useEffect(() => {
    if (!("permissions" in navigator)) return;
    let cleanup: (() => void) | undefined;
    navigator.permissions.query({ name: "notifications" as PermissionName }).then((status) => {
      const handler = () => setPermission(status.state as PermissionState);
      status.addEventListener("change", handler);
      cleanup = () => status.removeEventListener("change", handler);
    }).catch(() => {});
    return () => cleanup?.();
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result as PermissionState);
  }, []);

  const openSystemSettings = useCallback(() => {
    // On Android/Capacitor we could use App.openUrl, but for web we show a prompt
    // This is a best-effort approach
    if ("Notification" in window && Notification.permission === "default") {
      requestPermission();
    }
  }, [requestPermission]);

  const toggle = (key: keyof NotificationPrefs) => {
    if (typeof prefs[key] === "boolean") {
      setPrefs((p) => ({ ...p, [key]: !p[key] }));
    }
  };

  const blocked = permission === "denied";
  const unsupported = permission === "unsupported";
  const needsPrompt = permission === "default";

  const importantAllOff = !prefs.bookingReminders && !prefs.sessionUpdates;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-8 pt-2 max-h-[90vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-muted" />

        <SheetHeader className="text-left px-6 mb-5">
          <SheetTitle className="text-[22px] font-bold text-foreground tracking-[-0.3px]">
            Notifications
          </SheetTitle>
          <SheetDescription className="text-[14px] text-muted-foreground leading-relaxed">
            Control how and when you receive updates
          </SheetDescription>
        </SheetHeader>

        {/* System permission banner */}
        {(blocked || unsupported) && (
          <div className="mx-6 mb-5 flex items-start gap-3 rounded-2xl bg-destructive/5 border border-destructive/10 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
              <CloseRemind theme="two-tone" size={20} fill={["hsl(var(--destructive))", "hsl(var(--destructive) / 0.15)"]} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-destructive">
                {unsupported ? "Notifications not supported" : "Notifications blocked"}
              </p>
              <p className="text-[12px] text-destructive/70 mt-0.5 leading-relaxed">
                {unsupported
                  ? "Your browser or device doesn't support push notifications."
                  : "Notifications are disabled in your system settings. Enable them to receive alerts."}
              </p>
              {blocked && (
                <button
                  onClick={openSystemSettings}
                  className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-destructive/10 px-3 py-2 text-[12px] font-semibold text-destructive transition-colors hover:bg-destructive/15 active:scale-[0.97]"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open System Settings
                </button>
              )}
            </div>
          </div>
        )}

        {needsPrompt && (
          <div className="mx-6 mb-5 flex items-start gap-3 rounded-2xl bg-primary/5 border border-primary/10 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Alarm theme="two-tone" size={20} fill={["hsl(var(--primary))", "hsl(var(--primary) / 0.15)"]} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground">Enable push notifications</p>
              <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                Allow notifications to receive real-time booking reminders and session updates.
              </p>
              <button
                onClick={requestPermission}
                className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-[12px] font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97]"
              >
                Allow Notifications
              </button>
            </div>
          </div>
        )}

        {/* All important off warning */}
        {!blocked && !unsupported && importantAllOff && (
          <div className="mx-6 mb-4 flex items-center gap-3 rounded-2xl bg-amber-500/5 border border-amber-500/10 p-3.5">
            <CloseRemind theme="two-tone" size={18} fill={["hsl(38 92% 50%)", "hsl(38 92% 50% / 0.2)"]} />
            <p className="text-[12px] font-medium text-amber-700 dark:text-amber-400">
              Important notifications are off. You may miss booking updates.
            </p>
          </div>
        )}

        {/* ── IMPORTANT ── */}
        <SectionHeader label="Important" />
        <div className="px-4">
          <NotifRow
            icon={<CalendarThirtyTwo theme="two-tone" size={22} fill={["hsl(var(--primary))", "hsl(var(--primary) / 0.15)"]} />}
            iconBg="bg-primary/8"
            title="Booking Reminders"
            description="Reminders before your sessions start"
            checked={prefs.bookingReminders}
            onChange={() => toggle("bookingReminders")}
            disabled={blocked || unsupported}
          />
          <NotifRow
            icon={<Alarm theme="two-tone" size={22} fill={["hsl(152 60% 45%)", "hsl(152 60% 45% / 0.15)"]} />}
            iconBg="bg-emerald-500/8"
            title="Session Updates"
            description="Schedule changes, cancellations, and confirmations"
            checked={prefs.sessionUpdates}
            onChange={() => toggle("sessionUpdates")}
            disabled={blocked || unsupported}
          />
        </div>

        {/* ── COMMUNICATION ── */}
        <SectionHeader label="Communication" />
        <div className="px-4">
          <NotifRow
            icon={<MessageOne theme="two-tone" size={22} fill={["hsl(210 100% 50%)", "hsl(210 100% 50% / 0.15)"]} />}
            iconBg="bg-blue-500/8"
            title="Messages"
            description="New messages from trainers and gyms"
            checked={prefs.messages}
            onChange={() => toggle("messages")}
            disabled={blocked || unsupported}
          />
          {prefs.messages && !blocked && !unsupported && (
            <div className="ml-[60px] mr-2 mb-2 mt-0.5">
              <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-3">
                <div className="flex items-center gap-2.5">
                  <PreviewCloseOne theme="two-tone" size={16} fill={["hsl(var(--muted-foreground))", "hsl(var(--muted-foreground) / 0.2)"]} />
                  <span className="text-[13px] font-medium text-foreground">Preview level</span>
                </div>
                <Select
                  value={prefs.messagePreview}
                  onValueChange={(v) => setPrefs((p) => ({ ...p, messagePreview: v as NotificationPrefs["messagePreview"] }))}
                >
                  <SelectTrigger className="h-8 w-[110px] border-0 bg-background/80 text-[12px] font-semibold shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="sender">Sender only</SelectItem>
                    <SelectItem value="none">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* ── DISCOVERY ── */}
        <SectionHeader label="Discovery" />
        <div className="px-4">
          <NotifRow
            icon={<Star theme="two-tone" size={22} fill={["hsl(38 92% 50%)", "hsl(38 92% 50% / 0.15)"]} />}
            iconBg="bg-amber-500/8"
            title="New Listings"
            description="Sessions matching your fitness interests"
            checked={prefs.newListings}
            onChange={() => toggle("newListings")}
            disabled={blocked || unsupported}
          />
          <NotifRow
            icon={<VolumeNotice theme="two-tone" size={22} fill={["hsl(270 60% 55%)", "hsl(270 60% 55% / 0.15)"]} />}
            iconBg="bg-violet-500/8"
            title="Promotions & Offers"
            description="Deals and special offers from partners"
            checked={prefs.promotions}
            onChange={() => toggle("promotions")}
            disabled={blocked || unsupported}
          />
        </div>

        {/* ── QUIET HOURS ── */}
        <SectionHeader label="Schedule" />
        <div className="px-4">
          <NotifRow
            icon={<Moon className="h-[22px] w-[22px] text-indigo-500" />}
            iconBg="bg-indigo-500/8"
            title="Quiet Hours"
            description="Mute non-critical notifications during set hours"
            checked={prefs.quietHours}
            onChange={() => toggle("quietHours")}
            disabled={blocked || unsupported}
          />
          {prefs.quietHours && !blocked && !unsupported && (
            <div className="ml-[60px] mr-2 mb-2 mt-0.5 flex items-center gap-2">
              <TimeInput
                label="From"
                value={prefs.quietFrom}
                onChange={(v) => setPrefs((p) => ({ ...p, quietFrom: v }))}
              />
              <span className="text-muted-foreground/40 text-xs font-medium">→</span>
              <TimeInput
                label="To"
                value={prefs.quietTo}
                onChange={(v) => setPrefs((p) => ({ ...p, quietTo: v }))}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 mt-6 space-y-1.5">
          <p className="text-center text-[11px] text-muted-foreground/60 leading-relaxed">
            {user
              ? "Preferences are saved to your account."
              : "Preferences are saved to this device. Log in to sync across devices."}
          </p>
          {permission === "granted" && (
            <p className="text-center text-[11px] text-primary/60 font-medium">
              ✓ Push notifications enabled
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ── Section Header ── */
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-6 pt-5 pb-1.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50">
        {label}
      </p>
    </div>
  );
}

/* ── Notification Row ── */
function NotifRow({
  icon,
  iconBg,
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3.5 rounded-2xl px-3.5 py-4 transition-colors ${
        disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-muted/30 active:bg-muted/40"
      }`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-foreground leading-tight">{title}</p>
        <p className="text-[12px] text-muted-foreground/70 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <Switch
        checked={checked && !disabled}
        onCheckedChange={onChange}
        disabled={disabled}
        className="shrink-0"
      />
    </div>
  );
}

/* ── Time Input ── */
function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1 rounded-xl bg-muted/40 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1">{label}</p>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-[14px] font-semibold text-foreground outline-none [&::-webkit-calendar-picker-indicator]:opacity-50"
      />
    </div>
  );
}
