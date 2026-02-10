import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package, Clock, Users, CheckCircle2, MessageCircle, Star, MapPin,
  Layers, Bookmark,
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
    <div className="overflow-hidden rounded-[22px] bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Image — immersive, 65% of card */}
      <div
        className="relative w-full cursor-pointer overflow-hidden"
        style={{ height: "clamp(220px, 55vw, 320px)" }}
        onClick={() => setExpanded(!expanded)}
      >
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />

        {/* Package badge — top left */}
        <div className="absolute left-3.5 top-3.5 flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
          <Package className="h-3 w-3 text-white" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-white">{pkg.sessions_count} sessions</span>
        </div>

        {/* Savings badge — top right */}
        {savingsPercent > 0 && (
          <span className="absolute right-3.5 top-3.5 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
            Save {savingsPercent}%
          </span>
        )}

        {/* Text on image — bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <p
            className="text-[13px] font-medium text-white/80 mb-1 cursor-pointer hover:text-white transition-colors"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/partner/${pkg.partner_profiles.id}`);
            }}
          >
            {pkg.partner_profiles.display_name}
          </p>
          <h3
            className="text-[22px] font-semibold leading-tight text-white line-clamp-2"
            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
          >
            {title}
          </h3>
        </div>
      </div>

      {/* Slim content strip below image */}
      <div className="px-5 py-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        {/* One meta line — duration per session */}
        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground opacity-80 mb-3">
          <Clock className="h-3.5 w-3.5" />
          <span>{pkg.duration_minutes} min each · {pkg.sessions_count} sessions</span>
        </div>

        {/* Price + Book row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[19px] font-semibold text-foreground">
              {pkg.total_price_gel}₾
              {savings > 0 && (
                <span className="text-[12px] font-normal text-muted-foreground line-through ml-1.5">{fullPrice}₾</span>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground">{pkg.price_per_session_gel}₾ / session</p>
          </div>
          <button
            onClick={handleBookClick}
            className="rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97]"
          >
            {t("bookPackage")}
          </button>
        </div>
      </div>

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
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary h-10 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-colors"
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
