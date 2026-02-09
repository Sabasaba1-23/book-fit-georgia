import { useState } from "react";
import { ArrowLeft, Bell, Eye, Globe, FileText, Trash2, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import { cn } from "@/lib/utils";

interface Props {
  onBack: () => void;
}

export default function PartnerSettings({ onBack }: Props) {
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);

  // Placeholder toggle states
  const [notifications, setNotifications] = useState({
    sessions: true,
    bookings: true,
    messages: true,
    payouts: false,
  });
  const [privacy, setPrivacy] = useState({
    showPhone: false,
    showLocation: true,
  });

  return (
    <div className="relative z-10 px-5 pt-4 pb-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-card transition-colors hover:bg-muted active:scale-95"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="text-[20px] font-semibold text-foreground">Settings</h2>
      </div>

      {/* Notifications */}
      <SettingsSection icon={<Bell className="h-4 w-4" />} title="Notifications">
        <ToggleRow label="Session reminders" checked={notifications.sessions} onChange={(v) => setNotifications(p => ({ ...p, sessions: v }))} />
        <ToggleRow label="New bookings" checked={notifications.bookings} onChange={(v) => setNotifications(p => ({ ...p, bookings: v }))} />
        <ToggleRow label="Messages" checked={notifications.messages} onChange={(v) => setNotifications(p => ({ ...p, messages: v }))} />
        <ToggleRow label="Payout updates" checked={notifications.payouts} onChange={(v) => setNotifications(p => ({ ...p, payouts: v }))} />
      </SettingsSection>

      {/* Privacy */}
      <SettingsSection icon={<Eye className="h-4 w-4" />} title="Privacy & Visibility">
        <ToggleRow label="Show phone number publicly" checked={privacy.showPhone} onChange={(v) => setPrivacy(p => ({ ...p, showPhone: v }))} />
        <ToggleRow label="Show location publicly" checked={privacy.showLocation} onChange={(v) => setPrivacy(p => ({ ...p, showLocation: v }))} />
      </SettingsSection>

      {/* Language */}
      <SettingsSection icon={<Globe className="h-4 w-4" />} title="Language">
        <div className="px-4 py-3">
          <p className="text-sm text-muted-foreground">Language preferences are managed from the main app settings.</p>
        </div>
      </SettingsSection>

      {/* Legal */}
      <SettingsSection icon={<FileText className="h-4 w-4" />} title="Legal">
        <LinkRow label="Terms & Conditions" onClick={() => navigate("/terms")} />
        <LinkRow label="Privacy Policy" onClick={() => navigate("/privacy")} />
      </SettingsSection>

      {/* Account */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Account</p>
        <button
          onClick={() => setShowDelete(true)}
          className="flex w-full items-center gap-3 rounded-2xl bg-destructive/5 p-4 transition-colors hover:bg-destructive/10 active:scale-[0.98]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10">
            <Trash2 className="h-4 w-4 text-destructive" />
          </div>
          <p className="text-[15px] font-semibold text-destructive">Delete Account</p>
        </button>
      </div>

      <DeleteAccountDialog open={showDelete} onOpenChange={setShowDelete} />
    </div>
  );
}

function SettingsSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{icon}</span>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">{title}</p>
      </div>
      <div className="rounded-2xl bg-card overflow-hidden divide-y divide-border/30">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <p className="text-[15px] text-foreground">{label}</p>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function LinkRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between px-4 py-3.5 transition-colors hover:bg-muted/30">
      <p className="text-[15px] text-foreground">{label}</p>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
    </button>
  );
}
