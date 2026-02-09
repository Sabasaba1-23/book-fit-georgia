import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  CalendarDays,
  MoreVertical,
  Clock,
  Dumbbell,
  Flame,
  Star,
  FileText,
  CreditCard,
  Send,
  X,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Listing {
  id: string;
  title_en: string;
  sport: string;
  training_type: string;
  scheduled_at: string;
  duration_minutes: number;
  price_gel: number;
  max_spots: number;
  status: string;
  description_en: string | null;
  equipment_notes_en: string | null;
  admin_notes: string | null;
  background_image_url: string | null;
  created_at: string;
  location: string | null;
  partner_profiles: {
    display_name: string;
    partner_type: string;
    location: string | null;
    logo_url: string | null;
  };
}

type Tab = "pending" | "approved" | "rejected";

export default function AdminListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Listing | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchListings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("training_listings")
      .select(
        "*, partner_profiles(display_name, partner_type, location, logo_url)"
      )
      .order("created_at", { ascending: false });

    if (data) setListings(data as unknown as Listing[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();

    // Real-time subscription for instant updates
    const channel = supabase
      .channel("admin-listings")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "training_listings" },
        () => {
          fetchListings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (
    id: string,
    status: "approved" | "rejected"
  ) => {
    setActionLoading(true);
    const { error } = await supabase
      .from("training_listings")
      .update({ status, admin_notes: adminNotes || null })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: status === "approved" ? "Listing approved & published! ✅" : "Listing rejected",
      });
      setSelected(null);
      setAdminNotes("");
      fetchListings();
    }
    setActionLoading(false);
  };

  const deleteListing = async (id: string) => {
    const { error } = await supabase
      .from("training_listings")
      .delete()
      .eq("id", id);
    if (!error) {
      toast({ title: "Listing deleted" });
      fetchListings();
    }
  };

  const filtered = listings.filter((l) => {
    if (l.status !== tab) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.title_en.toLowerCase().includes(q) ||
        (l.partner_profiles as any)?.display_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = listings.filter((l) => l.status === "pending").length;

  // ─── Detail/Review View ───────────────────────────
  if (selected) {
    return <ReviewView listing={selected} adminNotes={adminNotes} setAdminNotes={setAdminNotes} actionLoading={actionLoading} onApprove={() => updateStatus(selected.id, "approved")} onReject={() => updateStatus(selected.id, "rejected")} onBack={() => { setSelected(null); setAdminNotes(""); }} />;
  }

  // ─── Queue View ───────────────────────────────────
  return (
    <div className="px-5 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.history.back()}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-extrabold text-foreground">
            Approval Queue
          </h1>
        </div>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-muted/60">
          <Bell className="h-5 w-5 text-foreground" />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-muted/50 p-1 mb-5">
        {(["pending", "approved", "rejected"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all capitalize",
              tab === t
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            {t === "pending" ? "Pending" : t === "approved" ? "Approved" : "Rejected"}
            {t === "pending" && pendingCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search listing or partner name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 rounded-2xl border-0 bg-muted/50 pl-11 pr-12 text-sm font-medium shadow-none"
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl hover:bg-muted">
          <SlidersHorizontal className="h-4 w-4 text-primary" />
        </button>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Recent Applications
        </p>
        <p className="text-[11px] font-medium text-muted-foreground italic">
          Showing {filtered.length} results
        </p>
      </div>

      {/* Listings */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-muted/30 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No {tab} listings found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onReview={() => {
                setSelected(listing);
                setAdminNotes(listing.admin_notes || "");
              }}
              onDelete={() => deleteListing(listing.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Listing Card ───────────────────────────────── */

function ListingCard({
  listing,
  onReview,
  onDelete,
}: {
  listing: Listing;
  onReview: () => void;
  onDelete: () => void;
}) {
  const partner = listing.partner_profiles as any;
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(listing.created_at).getTime()) / 86400000
  );

  let statusLabel = "New";
  let statusColor = "text-emerald-600";
  if (daysSinceCreated > 3) {
    statusLabel = "Priority";
    statusColor = "text-red-500";
  } else if (daysSinceCreated > 0) {
    statusLabel = `Pending ${daysSinceCreated}d`;
    statusColor = "text-primary";
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4 ios-shadow">
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-muted">
          {listing.background_image_url ? (
            <img
              src={listing.background_image_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-bold text-muted-foreground/30">
              {listing.sport.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-bold text-foreground truncate">
            {listing.title_en}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[13px] text-muted-foreground">
              {partner?.display_name}
            </p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                partner?.partner_type === "gym"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              )}
            >
              {partner?.partner_type === "gym" ? "GYM" : "TRAINER"}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <CalendarDays className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">
              {format(new Date(listing.created_at), "MMM d, yyyy")}
            </span>
            <span className="text-[11px] text-muted-foreground">•</span>
            <span className={cn("text-[11px] font-semibold", statusColor)}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        <Button
          onClick={onReview}
          className="flex-1 rounded-full bg-primary py-2.5 h-10 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          Review Application
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card hover:bg-muted transition-colors">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onReview}>View Details</DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={onDelete}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/* ─── Review Detail View ─────────────────────────── */

function ReviewView({
  listing,
  adminNotes,
  setAdminNotes,
  actionLoading,
  onApprove,
  onReject,
  onBack,
}: {
  listing: Listing;
  adminNotes: string;
  setAdminNotes: (v: string) => void;
  actionLoading: boolean;
  onApprove: () => void;
  onReject: () => void;
  onBack: () => void;
}) {
  const partner = listing.partner_profiles as any;
  const price = Number(listing.price_gel);
  const platformFee = price * 0.15;
  const payout = price - platformFee;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <BackButton onClick={onBack} />
        <div className="text-center">
          <h2 className="text-base font-bold text-foreground">
            Review Application
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            ID: #{listing.id.slice(0, 8).toUpperCase()}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted">
              <MoreHorizontal className="h-5 w-5 text-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onBack}>Back to Queue</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="px-5 space-y-6">
        {/* Consumer Preview label */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            Consumer Preview
          </p>
          <span className="rounded-full border border-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            Live Preview
          </span>
        </div>

        {/* Preview Card */}
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden ios-shadow">
          {/* Image */}
          <div className="relative h-48 bg-muted">
            {listing.background_image_url ? (
              <img
                src={listing.background_image_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-muted-foreground/20">
                {listing.sport}
              </div>
            )}
            <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-card/90 backdrop-blur-sm px-2.5 py-1">
              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
              <span className="text-xs font-bold text-foreground">4.9</span>
            </div>
          </div>

          {/* Info */}
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {listing.title_en}
                </h3>
                <p className="text-sm text-muted-foreground">
                  by {partner?.display_name}
                </p>
              </div>
              <p className="text-xl font-extrabold text-primary">
                {price}₾
              </p>
            </div>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {listing.duration_minutes} mins
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground capitalize">
                  {listing.training_type.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {listing.sport}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Listing Metadata */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Listing Metadata
            </h3>
          </div>

          <div className="rounded-2xl bg-primary/5 p-4 space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              Detailed Description
            </p>
            <p className="text-[14px] leading-relaxed text-foreground/80">
              {listing.description_en || "No description provided."}
            </p>
          </div>

          {listing.equipment_notes_en && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="rounded-2xl bg-muted/40 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Equipment
                </p>
                <p className="text-sm font-medium text-foreground">
                  {listing.equipment_notes_en}
                </p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Location
                </p>
                <p className="text-sm font-medium text-foreground">
                  {listing.location || partner?.location || "Not specified"}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="rounded-2xl bg-muted/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Max Spots
              </p>
              <p className="text-sm font-medium text-foreground">
                {listing.max_spots}
              </p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                Scheduled
              </p>
              <p className="text-sm font-medium text-foreground">
                {format(new Date(listing.scheduled_at), "MMM d, HH:mm")}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Notes */}
        <div>
          <Textarea
            placeholder="Leave a note for the trainer (Optional)..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            className="rounded-2xl border-0 bg-muted/50 px-4 py-3 text-[14px] font-medium shadow-none resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            disabled={actionLoading}
            onClick={onReject}
            className="flex-[0.35] rounded-full h-12 text-sm font-bold border-border"
          >
            Reject
          </Button>
          <Button
            disabled={actionLoading}
            onClick={onApprove}
            className="flex-[0.65] rounded-full h-12 text-sm font-bold bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg"
          >
            <Send className="h-4 w-4 mr-2" />
            {actionLoading ? "Processing..." : "Approve & Publish"}
          </Button>
        </div>

        {/* Pricing Breakdown */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              Pricing Breakdown
            </h3>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card p-4 space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Listing Price</span>
              <span className="font-semibold text-foreground">{price}₾</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Platform Fee (15%)
              </span>
              <span className="font-semibold text-red-500">
                -{platformFee.toFixed(2)}₾
              </span>
            </div>
            <div className="border-t border-border/50 pt-2 flex justify-between">
              <span className="text-sm font-bold text-foreground">
                Trainer Net Payout
              </span>
              <span className="text-sm font-extrabold text-primary">
                {payout.toFixed(2)}₾
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center space-y-1 pb-4">
          <p className="text-[12px] text-muted-foreground">
            Submitted by {partner?.display_name} on{" "}
            {format(new Date(listing.created_at), "MMM d, yyyy • HH:mm")}
          </p>
          <p className="text-[12px] text-muted-foreground">
            System Check:{" "}
            <span className="font-bold text-emerald-600">PASSED</span>
          </p>
        </div>
      </div>
    </div>
  );
}
