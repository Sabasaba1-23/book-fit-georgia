import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";
import PaymentMethodsPanel from "@/components/PaymentMethodsPanel";
import NotificationsPanel from "@/components/NotificationsPanel";
import HelpSupportPanel from "@/components/HelpSupportPanel";
import {
  Pencil,
  CreditCard,
  Bell,
  HelpCircle,
  ChevronRight,
  LogOut,
  Plus,
  X,
  Camera,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const AVAILABLE_INTERESTS = [
  "Yoga", "Boxing", "HIIT", "Tennis", "Swimming", "CrossFit",
  "Pilates", "Running", "Cycling", "Basketball", "Football", "Martial Arts",
  "Dance", "Weightlifting", "Stretching", "Meditation",
];

interface ProfileData {
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface BookmarkWithPartner {
  id: string;
  partner_id: string;
  partner_profiles: {
    id: string;
    display_name: string;
    logo_url: string | null;
    partner_type: string;
  };
}

interface Stats {
  sessions: number;
  studios: number;
  hours: number;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<Stats>({ sessions: 0, studios: 0, hours: 0 });
  const [bookmarks, setBookmarks] = useState<BookmarkWithPartner[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadProfile(), loadStats(), loadBookmarks(), loadInterests()]);
    setLoading(false);
  }

  async function loadProfile() {
    const { data } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, created_at")
      .eq("user_id", user!.id)
      .maybeSingle();
    if (data) {
      setProfile(data);
      setNameInput(data.full_name || "");
    }
  }

  async function loadStats() {
    // Get completed bookings with listing + partner data
    const { data } = await supabase
      .from("bookings")
      .select(`
        id, booking_status,
        training_listings (
          duration_minutes, partner_id,
          partner_profiles ( partner_type )
        )
      `)
      .eq("user_id", user!.id)
      .eq("booking_status", "confirmed");

    if (data) {
      // Also count completed (past) confirmed bookings
      const allBookings = data as any[];
      const sessions = allBookings.length;
      const uniqueGyms = new Set(
        allBookings
          .filter((b) => b.training_listings?.partner_profiles?.partner_type === "gym")
          .map((b) => b.training_listings?.partner_id)
      );
      const totalMinutes = allBookings.reduce(
        (sum, b) => sum + (b.training_listings?.duration_minutes || 0),
        0
      );
      setStats({
        sessions,
        studios: uniqueGyms.size,
        hours: Math.round(totalMinutes / 60),
      });
    }
  }

  async function loadBookmarks() {
    const { data } = await supabase
      .from("bookmarks")
      .select("id, partner_id, partner_profiles(id, display_name, logo_url, partner_type)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setBookmarks(data as unknown as BookmarkWithPartner[]);
  }

  async function loadInterests() {
    const { data } = await supabase
      .from("user_interests")
      .select("tag")
      .eq("user_id", user!.id);
    if (data) setInterests(data.map((d) => d.tag));
  }

  async function handleSaveName() {
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: nameInput.trim() })
      .eq("user_id", user!.id);
    if (!error) {
      setProfile((p) => p ? { ...p, full_name: nameInput.trim() } : p);
      setEditingName(false);
      toast({ title: "Name updated" });
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", variant: "destructive" });
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
    setProfile((p) => p ? { ...p, avatar_url: avatarUrl } : p);
    toast({ title: "Avatar updated" });
  }

  async function addInterest(tag: string) {
    const { error } = await supabase
      .from("user_interests")
      .insert({ user_id: user!.id, tag });
    if (!error) {
      setInterests((prev) => [...prev, tag]);
    }
  }

  async function removeInterest(tag: string) {
    const { error } = await supabase
      .from("user_interests")
      .delete()
      .eq("user_id", user!.id)
      .eq("tag", tag);
    if (!error) {
      setInterests((prev) => prev.filter((t) => t !== tag));
    }
  }

  async function removeBookmark(bookmarkId: string) {
    await supabase.from("bookmarks").delete().eq("id", bookmarkId);
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
  }

  const memberSince = profile?.created_at
    ? format(new Date(profile.created_at), "yyyy")
    : new Date().getFullYear().toString();

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "User";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background pb-24">
      {/* Subtle gradient */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-secondary/[0.06]" />

      {/* Avatar section */}
      <div className="relative z-10 flex flex-col items-center pt-10 pb-4">
        <div className="relative">
          <div className="rounded-full p-[3px] bg-gradient-to-br from-primary to-secondary">
            <Avatar className="h-28 w-28 border-4 border-background">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-3xl font-bold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-transform active:scale-90"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>

        {/* Name */}
        {editingName ? (
          <div className="mt-3 flex items-center gap-2">
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-1.5 text-center text-lg font-bold text-foreground outline-none focus:border-primary"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
            />
            <button onClick={handleSaveName} className="text-xs font-bold text-primary">
              Save
            </button>
            <button onClick={() => setEditingName(false)} className="text-xs text-muted-foreground">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="mt-3 flex items-center gap-1.5 group"
          >
            <h1 className="text-2xl font-extrabold text-foreground">{displayName}</h1>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
        <p className="text-sm text-muted-foreground">Member since {memberSince}</p>
      </div>

      {/* Stats card */}
      <div className="relative z-10 mx-5 mb-6">
        <div className="flex rounded-2xl bg-card ios-shadow divide-x divide-border">
          <div className="flex-1 py-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{stats.sessions}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sessions</p>
          </div>
          <div className="flex-1 py-4 text-center">
            <p className="text-2xl font-extrabold text-foreground">{stats.studios}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Studios</p>
          </div>
          <div className="flex-1 py-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{stats.hours}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Hours</p>
          </div>
        </div>
      </div>

      {/* Bookmarked */}
      <div className="relative z-10 px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">Bookmarked</h2>
          {bookmarks.length > 4 && (
            <button className="text-sm font-bold text-primary">View all</button>
          )}
        </div>
        {bookmarks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No bookmarked trainers or gyms yet. Bookmark them from their profiles!
          </p>
        ) : (
          <div className="flex gap-4 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
            {bookmarks.slice(0, 6).map((bm) => {
              const partner = bm.partner_profiles;
              return (
                <button
                  key={bm.id}
                  onClick={() => navigate(`/partner/${partner.id}`)}
                  className="flex flex-col items-center gap-1.5 shrink-0 min-w-[64px]"
                >
                  <Avatar className="h-14 w-14 border-2 border-border/50">
                    {partner.logo_url ? <AvatarImage src={partner.logo_url} /> : null}
                    <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                      {partner.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[11px] font-medium text-foreground truncate max-w-[64px]">
                    {partner.display_name.split(" ")[0]}
                    {partner.display_name.split(" ")[1] ? ` ${partner.display_name.split(" ")[1].charAt(0)}.` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Fitness Interests */}
      <div className="relative z-10 px-5 mb-6">
        <h2 className="text-lg font-bold text-foreground mb-3">Fitness Interests</h2>
        <div className="flex flex-wrap gap-2">
          {interests.map((tag) => (
            <button
              key={tag}
              onClick={() => removeInterest(tag)}
              className="group flex items-center gap-1 rounded-full border-2 border-primary/30 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary transition-all hover:border-destructive hover:bg-destructive/5 hover:text-destructive"
            >
              {tag}
              <X className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
          <button
            onClick={() => setShowInterestPicker(!showInterestPicker)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Interest picker */}
        {showInterestPicker && (
          <div className="mt-3 flex flex-wrap gap-2 rounded-2xl bg-card ios-shadow p-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {AVAILABLE_INTERESTS.filter((t) => !interests.includes(t)).map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  addInterest(tag);
                  if (interests.length >= AVAILABLE_INTERESTS.length - 2) setShowInterestPicker(false);
                }}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-primary hover:text-primary active:scale-95"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Account Settings */}
      <div className="relative z-10 px-5 mb-6">
        <h2 className="text-lg font-bold text-foreground mb-3">Account Settings</h2>
        <div className="rounded-2xl bg-card ios-shadow overflow-hidden divide-y divide-border">
          <SettingsRow
            icon={<CreditCard className="h-5 w-5" />}
            iconBg="bg-primary/10 text-primary"
            label="Payment Methods"
            onClick={() => setShowPayment(true)}
          />
          <SettingsRow
            icon={<Bell className="h-5 w-5" />}
            iconBg="bg-blue-500/10 text-blue-500"
            label="Notifications"
            onClick={() => setShowNotifications(true)}
          />
          <SettingsRow
            icon={<HelpCircle className="h-5 w-5" />}
            iconBg="bg-emerald-500/10 text-emerald-500"
            label="Help & Support"
            onClick={() => setShowHelp(true)}
          />
        </div>
      </div>

      {/* Settings panels */}
      <PaymentMethodsPanel open={showPayment} onOpenChange={setShowPayment} />
      <NotificationsPanel open={showNotifications} onOpenChange={setShowNotifications} />
      <HelpSupportPanel open={showHelp} onOpenChange={setShowHelp} />

      {/* Language + Log out */}
      <div className="relative z-10 px-5 mb-6 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={() => setLang("en")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
              lang === "en" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLang("ka")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
              lang === "ka" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            ქართული
          </button>
        </div>

        <button
          onClick={signOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-destructive/20 py-3 text-sm font-bold text-destructive transition-all hover:bg-destructive/5 active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" />
          {t("logOut")}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

function SettingsRow({
  icon,
  iconBg,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30 active:bg-muted/50">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <span className="flex-1 text-left text-sm font-semibold text-foreground">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
