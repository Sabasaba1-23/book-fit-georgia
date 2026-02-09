import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Camera, ExternalLink, UserPen, ImageIcon, Award, LayoutDashboard,
  Settings, CreditCard, HelpCircle, LogOut, ChevronRight, ShieldCheck, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import HelpSupportPanel from "@/components/HelpSupportPanel";
import { User } from "@supabase/supabase-js";

export type ProfileSubScreen = "hub" | "edit" | "media" | "badges" | "settings" | "payments" | "trainers";

interface PartnerProfile {
  id: string;
  display_name: string;
  logo_url: string | null;
  partner_type: string;
  approved: boolean;
  bio: string | null;
  sports: string[] | null;
  location: string | null;
  languages: string[] | null;
  phone_number: string | null;
  verification_status: string;
}

interface Props {
  profile: PartnerProfile;
  user: User;
  onRefetch: () => void;
  onSignOut: () => Promise<void>;
  onNavigate: (screen: ProfileSubScreen) => void;
  onSwitchTab: (tab: string) => void;
  onOpenVerification: () => void;
}

export default function PartnerProfileHub({ profile, user, onRefetch, onSignOut, onNavigate, onSwitchTab, onOpenVerification }: Props) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/logo_${Date.now()}.${ext}`;
    if (profile.logo_url) {
      await supabase.storage.from("avatars").remove([profile.logo_url]);
    }
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("partner_profiles").update({ logo_url: publicUrl }).eq("id", profile.id);
    toast({ title: "Photo updated!" });
    onRefetch();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const menuItems: {
    icon: React.ReactNode;
    label: string;
    subtitle: string;
    action: () => void;
    destructive?: boolean;
    showChevron?: boolean;
  }[] = [
    {
      icon: <UserPen className="h-5 w-5" />,
      label: "Edit Public Profile",
      subtitle: "Name, bio, sports, location",
      action: () => onNavigate("edit"),
      showChevron: true,
    },
    {
      icon: <ImageIcon className="h-5 w-5" />,
      label: "Photos & Media",
      subtitle: "Manage your gallery",
      action: () => onNavigate("media"),
      showChevron: true,
    },
    {
      icon: <Award className="h-5 w-5" />,
      label: "Badges & Achievements",
      subtitle: "View earned and available badges",
      action: () => onNavigate("badges"),
      showChevron: true,
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      label: "Identity Verification",
      subtitle: profile.verification_status === "verified" ? "Verified" : "Verify your identity",
      action: onOpenVerification,
      showChevron: true,
    },
    ...(profile.partner_type === "gym" ? [{
      icon: <Users className="h-5 w-5" />,
      label: "Manage Trainers",
      subtitle: "Add or remove trainers at your gym",
      action: () => onNavigate("trainers"),
      showChevron: true,
    }] : []),
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Sessions & Listings",
      subtitle: "Manage your active trainings",
      action: () => onSwitchTab("dashboard"),
      showChevron: true,
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      subtitle: "Notifications, privacy, language",
      action: () => onNavigate("settings"),
      showChevron: true,
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: "Payments",
      subtitle: "Bank details and payouts",
      action: () => onNavigate("payments"),
      showChevron: true,
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      label: "Support & Help",
      subtitle: "FAQs, contact us",
      action: () => setShowHelp(true),
      showChevron: true,
    },
    {
      icon: <LogOut className="h-5 w-5" />,
      label: "Log Out",
      subtitle: "",
      action: onSignOut,
      destructive: true,
      showChevron: false,
    },
  ];

  return (
    <div className="relative z-10 px-5 pt-6 pb-8 space-y-8">
      {/* Identity Card */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className="h-28 w-28 border-[3px] border-primary/20 shadow-lg">
            {profile.logo_url ? <AvatarImage src={profile.logo_url} /> : null}
            <AvatarFallback className="bg-primary/10 text-3xl font-bold text-primary">
              {profile.display_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-90"
          >
            {uploading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>

        <div className="text-center space-y-1.5">
          <h2 className="text-[22px] font-semibold text-foreground leading-tight">{profile.display_name}</h2>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary capitalize">
            {profile.partner_type === "gym" ? "Studio" : "Individual Trainer"}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              profile.approved
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                : "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
            )}>
              {profile.approved ? "Approved" : "Pending"}
            </span>
            {profile.verification_status === "verified" && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Preview Public Profile CTA */}
        <button
          onClick={() => navigate(`/partner/${profile.id}`)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary/20 bg-primary/5 py-3.5 text-sm font-bold text-primary transition-all hover:bg-primary/10 active:scale-[0.98]"
        >
          <ExternalLink className="h-4 w-4" />
          Preview Public Profile
        </button>
      </div>

      {/* Menu Items */}
      <div className="space-y-1.5">
        {menuItems.map((item, i) => (
          <button
            key={i}
            onClick={item.action}
            className={cn(
              "flex w-full items-center gap-4 rounded-2xl p-4 transition-colors active:scale-[0.98]",
              item.destructive
                ? "bg-destructive/5 hover:bg-destructive/10 mt-4"
                : "bg-card hover:bg-muted/50"
            )}
          >
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              item.destructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
            )}>
              {item.icon}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className={cn(
                "text-[15px] font-semibold",
                item.destructive ? "text-destructive" : "text-foreground"
              )}>
                {item.label}
              </p>
              {item.subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</p>
              )}
            </div>
            {item.showChevron && (
              <ChevronRight className="h-5 w-5 text-muted-foreground/40 shrink-0" />
            )}
          </button>
        ))}
      </div>

      <HelpSupportPanel open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
}
