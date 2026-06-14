import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Package, Clock, Users, CheckCircle2, MessageCircle, Star, MapPin,
  Layers, Bookmark, Heart, ArrowRight, ChevronDown, ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BookingTicket from "@/components/BookingTicket";
import type { PaymentLocationState } from "@/pages/Payment";

const SPORT_IMAGES: Record<string, string> = {
  "Personal Trainer": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80",
  Yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
  HIIT: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80",
  Pilates: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80",
  Boxing: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&q=80",
  CrossFit: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&q=80",
  Tennis: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80",
  Swimming: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&q=80",
};

function generatePackageDescription(sport: string, sessions: number, duration: number): string {
  const fallback = [
    `A comprehensive ${sessions}-session training package with ${duration}-minute sessions designed for progressive improvement.`,
    `Commit to ${sessions} focused sessions of ${sport.toLowerCase()} training. Each ${duration}-minute class builds on the last.`,
  ];
  return fallback[(sport.length + sessions) % fallback.length];
}

function getEquipmentForSport(sport: string): string[] {
  const defaults: Record<string, string[]> = {
    Yoga: ["Yoga Mat", "Water", "Towel"],
    HIIT: ["Training Shoes", "Water", "Towel"],
    Boxing: ["Boxing Gloves", "Hand Wraps", "Water"],
    Tennis: ["Racket", "Tennis Shoes", "Water"],
  };
  return defaults[sport] || ["Comfortable Clothing", "Water"];
}

interface PackageCardProps {
  pkg: {
    id: string;
    title_en: string;
    title_ka: string | null;
    description_en?: string | null;
    description_ka?: string | null;
    sport: string;
    training_type: string;
    sessions_count: number;
    price_per_session_gel: number;
    total_price_gel: number;
    duration_minutes: number;
    max_spots: number;
    background_image_url: string | null;
    location: string | null;
    partner_profiles: {
      id: string;
      display_name: string;
      logo_url: string | null;
      partner_type: string;
      bio?: string | null;
      avg_rating?: number | null;
      review_count?: number | null;
    };
  };
}

export default function PackageCard({ pkg }: PackageCardProps) {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState("");

  const title = lang === "ka" && pkg.title_ka ? pkg.title_ka : pkg.title_en;
  const fullPrice = pkg.price_per_session_gel * pkg.sessions_count;
  const savings = fullPrice - pkg.total_price_gel;
  const savingsPercent = Math.round((savings / fullPrice) * 100);
  const imageUrl = pkg.background_image_url || SPORT_IMAGES[pkg.sport] || SPORT_IMAGES["Personal Trainer"];
  const hasRating = !!(pkg.partner_profiles.avg_rating && pkg.partner_profiles.review_count && pkg.partner_profiles.review_count > 0);

  const handleBookClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) {
      toast({ title: t("loginToBook"), variant: "destructive" });
      navigate("/auth");
      return;
    }
    const paymentState: PaymentLocationState = {
      amount: pkg.total_price_gel,
      title: `${pkg.title_en} (${pkg.sessions_count} sessions)`,
      listingId: pkg.id,
      sport: pkg.sport,
      scheduledAt: new Date().toISOString(),
      durationMinutes: pkg.duration_minutes * pkg.sessions_count,
      trainerName: pkg.partner_profiles.display_name,
      spots: pkg.sessions_count,
      isPackage: true,
      sessionsCount: pkg.sessions_count,
    };
    navigate("/payment", { state: paymentState });
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: "Login to bookmark", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (bookmarking) return;
    setBookmarking(true);
    const { error } = await supabase.from("bookmarks").insert({
      user_id: user.id,
      partner_id: pkg.partner_profiles.id,
    });
    if (error && error.code !== "23505") {
      toast({ title: "Bookmark failed", variant: "destructive" });
    } else {
      toast({ title: "Bookmarked! 🔖" });
    }
    setBookmarking(false);
  };

  const handleAsk = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: t("loginToChat"), variant: "destructive" });
      navigate("/auth");
      return;
    }
    navigate("/messages");
  };

  const description = pkg.description_en || generatePackageDescription(pkg.sport, pkg.sessions_count, pkg.duration_minutes);
  const equipment = getEquipmentForSport(pkg.sport);

  return (
    <div className="group relative overflow-hidden rounded-[28px] bg-card editorial-shadow transition-shadow hover:shadow-[0_24px_50px_-20px_hsl(0_0%_0%/0.18)] animate-fade-up">
      {/* Hero image area */}
      <div
        className="relative w-full cursor-pointer overflow-hidden"
        style={{ height: "clamp(380px, 92vw, 480px)" }}
        onClick={() => setExpanded(!expanded)}
      >
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          loading="lazy"
        />
        <div className="absolute inset-0 card-gradient-overlay" />

        {/* Package + sessions pill — top left */}
        <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-background/95 px-3.5 py-1.5 backdrop-blur-md">
          <Layers className="h-3 w-3 text-foreground" />
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
            {pkg.sessions_count} sessions
          </span>
        </div>

        {/* Heart — top right */}
        <button
          onClick={handleBookmark}
          aria-label="Bookmark"
          className="absolute right-4 top-4 circle-icon-btn"
        >
          <Heart className={cn("h-[18px] w-[18px]", bookmarking && "fill-foreground")} />
        </button>

        {/* Savings ribbon */}
        {savingsPercent > 0 && (
          <span className="absolute right-4 top-[60px] rounded-full bg-foreground px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-background">
            Save {savingsPercent}%
          </span>
        )}

        {/* Title bottom */}
        <div className="absolute bottom-[88px] left-0 right-0 px-5">
          <p
            className="mb-1.5 text-[13px] font-medium text-white/85 cursor-pointer hover:text-white transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/partner/${pkg.partner_profiles.id}`);
            }}
          >
            {pkg.partner_profiles.display_name}
          </p>
          <h3 className="text-[26px] font-extrabold leading-[1.05] tracking-[-0.025em] text-white line-clamp-2">
            {title}
          </h3>
          {hasRating && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur-md">
              <Star className="h-3 w-3 fill-white text-white" />
              {Number(pkg.partner_profiles.avg_rating).toFixed(1)}
            </div>
          )}
        </div>

        {/* Floating CTA bottom of image */}
        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleBookClick}
            className="pill-with-arrow w-full justify-between"
          >
            <span className="flex flex-col items-start leading-tight">
              <span className="text-[11px] font-medium uppercase tracking-[0.12em] opacity-65">
                {pkg.duration_minutes} min · {pkg.sessions_count} sessions
              </span>
              <span className="text-[15px] font-bold">
                {pkg.total_price_gel}₾
                {savings > 0 && (
                  <span className="ml-1.5 text-[11px] font-normal line-through opacity-60">
                    {fullPrice}₾
                  </span>
                )}
              </span>
            </span>
            <span className="arrow-chip">
              <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-center gap-1.5 py-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? "Less details" : "More details"}
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>


      {/* ─── EXPANDED DETAIL ─── */}
      {expanded && (
        <div className="border-t border-border/60 animate-in slide-in-from-top-2 fade-in duration-300">
          {/* Partner row with avatar — shown in expanded */}
          <div className="px-5 pt-4 pb-2 flex items-center gap-2">
            <Avatar
              className="h-7 w-7 cursor-pointer"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                navigate(`/partner/${pkg.partner_profiles.id}`);
              }}
            >
              {pkg.partner_profiles.logo_url ? <AvatarImage src={pkg.partner_profiles.logo_url} /> : null}
              <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                {pkg.partner_profiles.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[13px] font-medium text-foreground">
              {pkg.partner_profiles.display_name}
            </span>
            {hasRating && (
              <div className="ml-auto flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="text-[12px] font-semibold text-foreground">
                  {Number(pkg.partner_profiles.avg_rating).toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Info pills */}
          <div className="flex gap-2 px-5 py-3 overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5 shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-[12px] font-medium text-foreground">{pkg.duration_minutes} min each</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5 shrink-0">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span className="text-[12px] font-medium text-foreground">{pkg.sessions_count} sessions</span>
            </div>
            {pkg.location && (
              <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5 shrink-0">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="text-[12px] font-medium text-foreground">{pkg.location}</span>
              </div>
            )}
          </div>

          <div className="px-5 py-3">
            <p className="text-[13px] leading-relaxed text-muted-foreground">{description}</p>
          </div>

          {/* What to bring */}
          <div className="px-5 pb-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("whatToBringLabel")}</p>
            <div className="flex flex-wrap gap-1.5">
              {equipment.map((item) => (
                <span key={item} className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-foreground">
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 px-5 pb-5">
            <button
              onClick={handleBookmark}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors active:scale-95"
            >
              <Bookmark className="h-4 w-4" />
            </button>
            <button
              onClick={handleAsk}
              className="flex items-center justify-center gap-1.5 rounded-full border border-border px-4 h-10 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors active:scale-95"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Ask
            </button>
            <button
              onClick={handleBookClick}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full gradient-primary h-10 text-[13px] font-semibold text-primary-foreground gradient-primary-hover active:scale-[0.97] transition-all duration-200"
            >
              {booking ? t("booking") : t("bookPackage")}
            </button>
          </div>
        </div>
      )}

      <BookingTicket
        open={showTicket}
        onClose={() => {
          setShowTicket(false);
          navigate("/bookings");
        }}
        booking={{
          id: confirmedBookingId,
          title: `${pkg.title_en} (Package)`,
          sport: pkg.sport,
          date: new Date().toISOString(),
          duration: pkg.duration_minutes * pkg.sessions_count,
          price: pkg.total_price_gel,
          trainerName: pkg.partner_profiles.display_name,
        }}
      />
    </div>
  );
}
