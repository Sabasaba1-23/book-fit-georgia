import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePartnerProfile } from "@/hooks/usePartnerProfile";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { PlusCircle, MoreHorizontal, LayoutDashboard, CalendarDays, User, MessageCircle } from "lucide-react";
import { Alarm } from "@icon-park/react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import CreateListingSheet from "@/components/CreateListingSheet";
import VerificationStatusCard from "@/components/verification/VerificationStatusCard";
import VerificationSheet from "@/components/verification/VerificationSheet";
import VerificationNudgeDialog from "@/components/verification/VerificationNudgeDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import PartnerScheduleTab from "@/components/PartnerScheduleTab";
import PartnerMessagesTab from "@/components/PartnerMessagesTab";
import PartnerPaymentsTab from "@/components/PartnerPaymentsTab";
import PartnerProfileHub, { type ProfileSubScreen } from "@/components/partner/PartnerProfileHub";
import PartnerEditProfile from "@/components/partner/PartnerEditProfile";
import PartnerPhotosMedia from "@/components/partner/PartnerPhotosMedia";
import PartnerBadgesScreen from "@/components/partner/PartnerBadgesScreen";
import PartnerSettings from "@/components/partner/PartnerSettings";
import GymTrainerManager from "@/components/partner/GymTrainerManager";

interface PartnerListing {
  id: string;
  title_en: string;
  sport: string;
  training_type: string;
  status: string;
  updated_at: string;
  background_image_url: string | null;
  admin_notes: string | null;
  scheduled_at: string;
  price_gel: number;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  approved: { bg: "bg-emerald-50", text: "text-emerald-600", label: "APPROVED" },
  pending: { bg: "bg-amber-50", text: "text-amber-600", label: "PENDING REVIEW" },
  rejected: { bg: "bg-red-50", text: "text-red-500", label: "REJECTED" },
  draft: { bg: "bg-muted", text: "text-muted-foreground", label: "DRAFT" },
};

const SPORT_COLORS: Record<string, string> = {
  Yoga: "bg-purple-100", HIIT: "bg-orange-100", Boxing: "bg-red-100",
  Tennis: "bg-green-100", Pilates: "bg-pink-100", Swimming: "bg-blue-100",
  CrossFit: "bg-amber-100", MMA: "bg-rose-100", Weightlifting: "bg-teal-100",
  "Personal Trainer": "bg-indigo-100", Running: "bg-lime-100",
  Cycling: "bg-cyan-100", Football: "bg-emerald-100", Basketball: "bg-orange-100",
  Kickboxing: "bg-red-100", "Brazilian Jiu-Jitsu": "bg-violet-100",
  Zumba: "bg-fuchsia-100", "Dance Fitness": "bg-pink-100",
  "Rock Climbing": "bg-stone-100", Gymnastics: "bg-sky-100",
};

type Tab = "dashboard" | "schedule" | "messages" | "profile";

export default function PartnerDashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, refetch: refetchProfile } = usePartnerProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [listings, setListings] = useState<PartnerListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [showAll, setShowAll] = useState(false);
  const [profileSubScreen, setProfileSubScreen] = useState<ProfileSubScreen>("hub");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!profileLoading && !profile && user) {
      navigate("/", { replace: true });
    }
  }, [profile, profileLoading, user, navigate]);

  const fetchListings = async () => {
    if (!profile) return;
    setLoadingListings(true);
    const { data } = await supabase
      .from("training_listings")
      .select("id, title_en, sport, training_type, status, updated_at, background_image_url, admin_notes, scheduled_at, price_gel")
      .eq("partner_id", profile.id)
      .order("updated_at", { ascending: false });

    if (data) setListings(data as PartnerListing[]);
    setLoadingListings(false);
  };

  useEffect(() => {
    if (profile) fetchListings();
  }, [profile]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("training_listings").delete().eq("id", id);
    if (error) {
      toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Listing deleted" });
      fetchListings();
    }
  };

  const handleDuplicate = async (listing: PartnerListing) => {
    if (!profile) return;
    const { error } = await supabase.from("training_listings").insert({
      partner_id: profile.id,
      title_en: `${listing.title_en} (Copy)`,
      sport: listing.sport,
      training_type: listing.training_type as any,
      scheduled_at: listing.scheduled_at,
      price_gel: listing.price_gel,
      status: "draft" as any,
    });
    if (error) {
      toast({ title: "Failed to duplicate", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Listing duplicated as draft" });
      fetchListings();
    }
  };

  const handleResubmit = async (id: string) => {
    const { error } = await supabase
      .from("training_listings")
      .update({ status: "pending" })
      .eq("id", id);
    if (error) {
      toast({ title: "Failed to resubmit", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Listing resubmitted for review" });
      fetchListings();
    }
  };

  // When switching tabs, reset profile sub-screen
  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    if (tab !== "profile") {
      setProfileSubScreen("hub");
    }
  }

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!profile) return null;

  const approved = listings.filter((l) => l.status === "approved").length;
  const pending = listings.filter((l) => l.status === "pending").length;
  const rejected = listings.filter((l) => l.status === "rejected").length;

  const displayListings = showAll ? listings : listings.slice(0, 5);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Home", icon: <LayoutDashboard className="h-5 w-5" /> },
    { key: "schedule", label: "Schedule", icon: <CalendarDays className="h-5 w-5" /> },
    { key: "messages", label: "Messages", icon: <MessageCircle className="h-5 w-5" /> },
    { key: "profile", label: "Profile", icon: <User className="h-5 w-5" /> },
  ];

  // Render profile sub-screens
  const renderProfileContent = () => {
    switch (profileSubScreen) {
      case "edit":
        return (
          <PartnerEditProfile
            profile={profile}
            onBack={() => setProfileSubScreen("hub")}
            onRefetch={refetchProfile}
          />
        );
      case "media":
        return (
          <PartnerPhotosMedia
            partnerId={profile.id}
            userId={user!.id}
            onBack={() => setProfileSubScreen("hub")}
          />
        );
      case "badges":
        return (
          <PartnerBadgesScreen
            partnerId={profile.id}
            partnerType={profile.partner_type}
            onBack={() => setProfileSubScreen("hub")}
          />
        );
      case "settings":
        return <PartnerSettings onBack={() => setProfileSubScreen("hub")} />;
      case "payments":
        return (
          <div className="relative z-10 px-5 pt-4">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setProfileSubScreen("hub")}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-card transition-colors hover:bg-muted active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              </button>
              <h2 className="text-[20px] font-semibold text-foreground">Payments</h2>
            </div>
            <PartnerPaymentsTab partnerId={profile.id} />
          </div>
        );
      default:
        return (
          <PartnerProfileHub
            profile={profile}
            user={user!}
            onRefetch={refetchProfile}
            onSignOut={async () => {
              await signOut();
              navigate("/auth", { replace: true });
            }}
            onNavigate={setProfileSubScreen}
            onSwitchTab={(tab) => handleTabChange(tab as Tab)}
            onOpenVerification={() => setShowVerification(true)}
          />
        );
    }
  };

  return (
    <div className="relative min-h-screen bg-background pb-24 overflow-hidden">
      {/* Green gradient background accents */}
      <div className="pointer-events-none fixed -right-32 -top-32 h-[360px] w-[360px] rounded-full bg-gradient-to-bl from-primary/18 via-primary/8 to-transparent blur-3xl" />
      <div className="pointer-events-none fixed -left-20 top-1/3 h-[280px] w-[280px] rounded-full bg-gradient-to-tr from-primary/12 via-accent/15 to-transparent blur-3xl" />

      {/* Header - hidden when in profile sub-screens */}
      {(activeTab !== "profile" || profileSubScreen === "hub") && (
        <header className="relative z-40 px-5 pb-2 pt-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              {profile.logo_url ? <AvatarImage src={profile.logo_url} /> : null}
              <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
                {profile.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Partner Account</p>
              <h1 className="text-xl font-extrabold text-foreground">{profile.display_name}</h1>
            </div>
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 transition-transform active:scale-95">
              <Alarm size={20} fill="hsl(var(--primary))" />
            </button>
          </div>
        </header>
      )}

      {activeTab === "dashboard" && (
        <div className="relative z-10 px-5 pt-4 space-y-6">
          {/* Verification Status Card */}
          <VerificationStatusCard
            verificationStatus={profile.verification_status || "unverified"}
            partnerType={profile.partner_type as "individual" | "gym"}
            onGetVerified={() => setShowVerification(true)}
          />

          {/* Create New Listing button */}
          <button
            onClick={() => setShowCreate(true)}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-primary to-secondary py-4 text-base font-bold text-white shadow-lg transition-all active:scale-[0.98]"
          >
            <PlusCircle className="h-5 w-5" />
            Create New Listing
          </button>

          {/* Listing Summary */}
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Listing Summary</p>
            <div className="grid grid-cols-3 gap-3">
              <SummaryCard count={approved} label="Approved" color="text-emerald-600" bg="bg-emerald-50" />
              <SummaryCard count={pending} label="Pending" color="text-amber-600" bg="bg-amber-50" />
              <SummaryCard count={rejected} label="Rejected" color="text-red-500" bg="bg-red-50" />
            </div>
          </div>

          {/* Active Trainings */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Active Trainings</p>
              {listings.length > 5 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs font-bold uppercase tracking-wider text-primary"
                >
                  {showAll ? "Show Less" : "View All"}
                </button>
              )}
            </div>

            {loadingListings ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : listings.length === 0 ? (
              <div className="rounded-2xl bg-muted/40 py-10 text-center">
                <p className="text-sm text-muted-foreground">No listings yet. Create your first one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayListings.map((listing) => {
                  const style = STATUS_STYLES[listing.status] || STATUS_STYLES.draft;
                  return (
                    <div key={listing.id} className="flex items-center gap-3 rounded-2xl border border-border/50 bg-card p-3.5 ios-shadow">
                      <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl", SPORT_COLORS[listing.sport] || "bg-muted")}>
                        {listing.background_image_url ? (
                          <img src={listing.background_image_url} alt="" className="h-full w-full rounded-2xl object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-foreground/30">{listing.sport.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-foreground truncate">{listing.title_en}</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">
                          Updated {formatDistanceToNow(new Date(listing.updated_at), { addSuffix: true })}
                        </p>
                        <span className={cn("mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", style.bg, style.text)}>
                          {style.label}
                        </span>
                        {listing.admin_notes && listing.status === "rejected" && (
                          <p className="mt-1 text-[11px] text-red-400 italic truncate">Admin: {listing.admin_notes}</p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors">
                            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          {(listing.status === "rejected" || listing.status === "draft") && (
                            <DropdownMenuItem onClick={() => handleResubmit(listing.id)}>
                              Resubmit for Review
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDuplicate(listing)}>
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(listing.id)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!profile.approved && (
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-700">Account Under Review</p>
              <p className="mt-1 text-[13px] text-amber-600">
                Your partner account is pending admin approval. You can create listings, but they won't be visible to users until both your account and listings are approved.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "schedule" && (
        <div className="relative z-10 px-5 pt-4">
          <h2 className="text-lg font-bold text-foreground mb-4">Schedule</h2>
          <PartnerScheduleTab partnerId={profile.id} />
        </div>
      )}

      {activeTab === "messages" && (
        <div className="relative z-10 px-5 pt-4">
          <h2 className="text-lg font-bold text-foreground mb-4">Messages</h2>
          <PartnerMessagesTab partnerUserId={user!.id} />
        </div>
      )}

      {activeTab === "profile" && renderProfileContent()}

      {/* Create Listing Sheet */}
      <CreateListingSheet
        open={showCreate}
        onOpenChange={setShowCreate}
        partnerId={profile.id}
        onCreated={fetchListings}
      />

      {/* Verification Sheet */}
      <VerificationSheet
        open={showVerification}
        onOpenChange={setShowVerification}
        partnerId={profile.id}
        partnerType={profile.partner_type as "individual" | "gym"}
        displayName={profile.display_name}
        existingBio={profile.bio}
        onComplete={() => refetchProfile()}
      />

      {/* Soft Nudge Dialog */}
      <VerificationNudgeDialog
        verificationStatus={profile.verification_status || "unverified"}
        onGetVerified={() => setShowVerification(true)}
      />

      {/* Bottom Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-border/50 bg-background/80 backdrop-blur-xl px-2 pb-6 pt-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1 transition-colors",
              activeTab === tab.key ? "text-primary" : "text-muted-foreground"
            )}
          >
            {tab.icon}
            <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

function SummaryCard({ count, label, color, bg }: { count: number; label: string; color: string; bg: string }) {
  return (
    <div className={cn("flex flex-col items-center rounded-2xl py-4", bg)}>
      <p className={cn("text-2xl font-extrabold", color)}>{count}</p>
      <p className={cn("text-[10px] font-bold uppercase tracking-wider mt-0.5", color)}>{label}</p>
    </div>
  );
}
