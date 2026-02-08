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
import PaymentSheet from "@/components/PaymentSheet";
import BookingTicket from "@/components/BookingTicket";

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
  const [showPayment, setShowPayment] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState("");

  const title = lang === "ka" && pkg.title_ka ? pkg.title_ka : pkg.title_en;
  const fullPrice = pkg.price_per_session_gel * pkg.sessions_count;
  const savings = fullPrice - pkg.total_price_gel;
  const savingsPercent = Math.round((savings / fullPrice) * 100);
  const imageUrl = pkg.background_image_url || SPORT_IMAGES[pkg.sport] || SPORT_IMAGES["Personal Trainer"];
  const hasRating = pkg.partner_profiles.avg_rating && pkg.partner_profiles.review_count && pkg.partner_profiles.review_count > 0;

  const handleBookClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) {
      toast({ title: t("loginToBook"), variant: "destructive" });
      navigate("/auth");
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (method: string) => {
    setBooking(true);
    try {
      const { data, error } = await supabase.from("bookings").insert({
        user_id: user!.id,
        listing_id: pkg.id,
        spots: pkg.sessions_count,
        total_price: pkg.total_price_gel,
        payment_status: "paid",
        booking_status: "confirmed",
        stripe_payment_id: `demo_${method}_pkg_${Date.now()}`,
      }).select("id").single();
      if (error) {
        const msg = error.code === "23505"
          ? "You've already booked this package."
          : "Booking failed. Please try again.";
        toast({ title: msg, variant: "destructive" });
      } else {
        setShowPayment(false);
        setConfirmedBookingId(data.id);
        setShowTicket(true);
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setBooking(false);
    }
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
    <div className="overflow-hidden rounded-2xl bg-card border border-border/60 shadow-sm transition-shadow hover:shadow-md">
      {/* Image — top of card */}
      <div
        className="relative w-full cursor-pointer overflow-hidden"
        style={{ height: 200 }}
        onClick={() => setExpanded(!expanded)}
      >
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {/* Package badge */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg bg-card/90 px-2.5 py-1 backdrop-blur-sm">
          <Package className="h-3 w-3 text-primary" />
          <span className="text-[11px] font-semibold text-foreground">{pkg.sessions_count} sessions</span>
        </div>
        {savingsPercent > 0 && (
          <span className="absolute right-3 top-3 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
            Save {savingsPercent}%
          </span>
        )}
      </div>

      {/* Content below image */}
      <div className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        {/* Partner row */}
        <div className="mb-2 flex items-center gap-2">
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
          <span
            className="text-[13px] font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/partner/${pkg.partner_profiles.id}`);
            }}
          >
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

        {/* Title */}
        <h3 className="text-base font-semibold text-foreground leading-snug mb-2">{title}</h3>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {pkg.duration_minutes} min each
          </span>
          <span className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5" />
            {pkg.sessions_count} sessions
          </span>
          {pkg.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate max-w-[100px]">{pkg.location}</span>
            </span>
          )}
        </div>

        {/* Price + Book row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-foreground">
              {pkg.total_price_gel}₾
              {savings > 0 && (
                <span className="text-[12px] font-normal text-muted-foreground line-through ml-1.5">{fullPrice}₾</span>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground">{pkg.price_per_session_gel}₾ / session</p>
          </div>
          <button
            onClick={handleBookClick}
            className="rounded-xl bg-primary px-5 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97]"
          >
            {t("bookPackage")}
          </button>
        </div>
      </div>

      {/* ─── EXPANDED DETAIL ─── */}
      {expanded && (
        <div className="border-t border-border/60 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="px-4 py-3">
            <p className="text-[13px] leading-relaxed text-muted-foreground">{description}</p>
          </div>

          {/* What to bring */}
          <div className="px-4 pb-3">
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
          <div className="flex gap-2 px-4 pb-4">
            <button
              onClick={handleBookmark}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors active:scale-95"
            >
              <Bookmark className="h-4 w-4" />
            </button>
            <button
              onClick={handleAsk}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-4 h-10 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors active:scale-95"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Ask
            </button>
            <button
              onClick={handleBookClick}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary h-10 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-colors"
            >
              {booking ? t("booking") : t("bookPackage")}
            </button>
          </div>
        </div>
      )}

      <PaymentSheet
        open={showPayment}
        onOpenChange={setShowPayment}
        amount={pkg.total_price_gel}
        title={`${title} (${pkg.sessions_count} sessions)`}
        onPaymentSuccess={handlePaymentSuccess}
        loading={booking}
      />
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
