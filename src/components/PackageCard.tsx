import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package, Clock, Users, CheckCircle2, MessageCircle, Star, MapPin,
  BarChart3, ChevronUp, Bookmark, Calendar, Layers,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PaymentSheet from "@/components/PaymentSheet";
import BookingTicket from "@/components/BookingTicket";

const SPORT_IMAGES: Record<string, string> = {
  "Personal Trainer": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
  Yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
  HIIT: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
  Pilates: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
  Boxing: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&q=80",
  CrossFit: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&q=80",
  Tennis: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80",
  Swimming: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80",
  MMA: "https://images.unsplash.com/photo-1555597673-b21d5c935865?w=800&q=80",
  Weightlifting: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80",
};

function generatePackageDescription(sport: string, sessions: number, duration: number): string {
  const descriptions: Record<string, string[]> = {
    Yoga: [
      `A ${sessions}-session yoga journey designed to deepen your practice. Each ${duration}-minute class builds on the previous, progressing from foundational poses to advanced flows with personalized attention.`,
      `Commit to transformation with this comprehensive yoga package. Over ${sessions} guided sessions, develop flexibility, strength, and mindfulness through a structured progression tailored to your goals.`,
    ],
    HIIT: [
      `${sessions} high-intensity sessions engineered to revolutionize your fitness. Each ${duration}-minute workout combines explosive cardio with strength training for maximum results in minimum time.`,
      `Push beyond your limits with this structured HIIT program. ${sessions} progressive sessions that systematically increase intensity, building endurance and lean muscle with expert coaching.`,
    ],
    Boxing: [
      `Master the sweet science over ${sessions} focused sessions. From fundamentals to advanced combinations, each ${duration}-minute class builds technique, power, and ring intelligence.`,
      `A complete boxing development package spanning ${sessions} sessions. Learn footwork, defense, and offensive skills while building exceptional cardiovascular fitness and mental toughness.`,
    ],
    Tennis: [
      `Elevate your game with ${sessions} expert-led tennis sessions. Each ${duration}-minute lesson targets specific aspects of your play — serve, volley, baseline, and match strategy.`,
      `A structured tennis improvement program over ${sessions} sessions. Develop consistent strokes, court movement, and tactical awareness with personalized coaching and video analysis.`,
    ],
  };
  const fallback = [
    `A comprehensive ${sessions}-session training package with ${duration}-minute sessions designed for progressive improvement. Expert coaching, structured programming, and measurable results.`,
    `Commit to ${sessions} focused sessions of ${sport.toLowerCase()} training. Each ${duration}-minute class is designed to build on the last, ensuring consistent progress toward your goals.`,
  ];
  const pool = descriptions[sport] || fallback;
  return pool[(sport.length + sessions) % pool.length];
}

function getEquipmentForSport(sport: string): string[] {
  const defaults: Record<string, string[]> = {
    Yoga: ["Yoga Mat", "Water", "Towel"],
    HIIT: ["Training Shoes", "Water", "Towel"],
    Boxing: ["Boxing Gloves", "Hand Wraps", "Water"],
    Tennis: ["Racket", "Tennis Shoes", "Water"],
    CrossFit: ["Training Shoes", "Wrist Wraps", "Water"],
    Swimming: ["Swimsuit", "Goggles", "Towel"],
    Pilates: ["Pilates Mat", "Water", "Grip Socks"],
    MMA: ["MMA Gloves", "Mouthguard", "Shin Guards"],
    Weightlifting: ["Lifting Shoes", "Belt", "Chalk"],
  };
  return defaults[sport] || ["Comfortable Clothing", "Water"];
}

function getLevelLabel(trainingType: string): string {
  switch (trainingType) {
    case "one_on_one": return "All Levels";
    case "group": return "Intermediate";
    case "event": return "Advanced";
    default: return "All Levels";
  }
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
    };
  };
}

export default function PackageCard({ pkg }: PackageCardProps) {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const title = lang === "ka" && pkg.title_ka ? pkg.title_ka : pkg.title_en;
  const fullPrice = pkg.price_per_session_gel * pkg.sessions_count;
  const savings = fullPrice - pkg.total_price_gel;
  const savingsPercent = Math.round((savings / fullPrice) * 100);
  const imageUrl = pkg.background_image_url || SPORT_IMAGES[pkg.sport] || SPORT_IMAGES["Personal Trainer"];

  const [booking, setBooking] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState("");

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
        toast({ title: "Booking failed", description: error.message, variant: "destructive" });
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
      toast({ title: "Bookmarked! 🔖", description: "You'll get notified when sessions are coming up." });
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
  const level = getLevelLabel(pkg.training_type);

  return (
    <div
      className="group overflow-hidden rounded-[1.75rem] ios-shadow cursor-pointer transition-all duration-300"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Image card */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: expanded ? undefined : "420px" }}>
        <img
          src={imageUrl}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 card-gradient-overlay" />

        {/* Top badges */}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 rounded-full bg-foreground/70 py-2 pl-2 pr-4 backdrop-blur-sm cursor-pointer transition-transform hover:scale-105 active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/partner/${pkg.partner_profiles.id}`);
            }}
          >
            <Avatar className="h-8 w-8 border border-white/20">
              {pkg.partner_profiles.logo_url ? <AvatarImage src={pkg.partner_profiles.logo_url} /> : null}
              <AvatarFallback className="bg-white/20 text-[10px] font-semibold text-white">
                {pkg.partner_profiles.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[13px] font-medium text-white">{pkg.partner_profiles.display_name}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2">
            <Package className="h-4 w-4 text-accent-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
              {pkg.sessions_count} Sessions
            </span>
          </div>
        </div>

        {/* Content overlay */}
        <div className="relative flex flex-col justify-end p-5" style={{ minHeight: "420px" }}>
          <div className="mb-2 flex items-center gap-2.5">
            <span className="rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white">
              {pkg.sport}
            </span>
            {savingsPercent > 0 && (
              <span className="rounded-full bg-accent px-3.5 py-1.5 text-[11px] font-semibold uppercase text-accent-foreground">
                Save {savingsPercent}%
              </span>
            )}
          </div>

          <h3 className="mb-3 text-[24px] font-semibold leading-tight text-white drop-shadow-lg">{title}</h3>

          <div className="mb-4 flex items-center gap-4 text-[13px] text-white/90">
            <span className="flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-secondary" />
              {pkg.sessions_count} sessions
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-accent" />
              {pkg.duration_minutes} min each
            </span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-white/60">Package Price</p>
              <div className="flex items-baseline gap-2">
                <p className="text-[34px] font-semibold text-white leading-none">{pkg.total_price_gel}₾</p>
                {savings > 0 && (
                  <p className="text-sm text-white/50 line-through">{fullPrice}₾</p>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
              }}
              className="rounded-full bg-primary px-6 py-3 text-[13px] font-semibold uppercase tracking-wider text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-95 shadow-lg"
            >
              Book Package
            </button>
          </div>
        </div>
      </div>

      {/* ─── EXPANDED DETAIL PANEL ─── */}
      {expanded && (
        <div className="bg-card animate-in slide-in-from-top-2 fade-in duration-300">
          {/* Price header */}
          <div className="px-6 pt-5 pb-4 border-b border-border/40">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-extrabold text-foreground">{pkg.total_price_gel}₾</p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                  {pkg.sessions_count} Sessions • {pkg.price_per_session_gel}₾ each
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 transition-colors hover:bg-muted"
              >
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Info pills */}
          <div className="flex gap-2.5 px-6 py-4 overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2.5 shrink-0">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-[13px] font-semibold text-foreground">{pkg.duration_minutes} mins/session</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2.5 shrink-0">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-[13px] font-semibold text-foreground">{level}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2.5 shrink-0">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-[13px] font-semibold text-foreground">{pkg.sessions_count} Sessions</span>
            </div>
            {pkg.location && (
              <div className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2.5 shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-[13px] font-semibold text-foreground">{pkg.location}</span>
              </div>
            )}
          </div>

          {/* Savings highlight */}
          {savingsPercent > 0 && (
            <div className="mx-6 mb-4 rounded-2xl bg-accent/20 p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                <Package className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-foreground">You save {savings}₾ ({savingsPercent}%)</p>
                <p className="text-[11px] text-muted-foreground">Compared to booking {pkg.sessions_count} individual sessions</p>
              </div>
            </div>
          )}

          {/* The Experience */}
          <div className="px-6 pb-5">
            <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">The Experience</h4>
            <p className="text-[15px] leading-[1.7] text-foreground/80">{description}</p>
          </div>

          {/* Trainer card */}
          <div className="mx-6 rounded-2xl bg-muted/40 p-5 mb-5">
            <div className="flex items-center gap-3.5 mb-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                {pkg.partner_profiles.logo_url ? <AvatarImage src={pkg.partner_profiles.logo_url} /> : null}
                <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                  {pkg.partner_profiles.display_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div
                className="flex-1 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/partner/${pkg.partner_profiles.id}`);
                }}
              >
                <p className="text-[15px] font-bold text-foreground hover:text-primary transition-colors">
                  {pkg.partner_profiles.display_name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  <span className="text-[12px] font-semibold text-foreground">4.9</span>
                  <span className="text-[11px] text-muted-foreground">(124 reviews)</span>
                </div>
              </div>
            </div>
            {pkg.partner_profiles.bio && (
              <p className="text-[13px] italic leading-relaxed text-foreground/70">"{pkg.partner_profiles.bio}"</p>
            )}
          </div>

          {/* What to bring */}
          <div className="px-6 pb-5">
            <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">What to bring</h4>
            <div className="flex flex-wrap gap-2.5">
              {equipment.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-[13px] font-semibold text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={handleBookmark}
              className="flex flex-[0.2] items-center justify-center rounded-full border-2 border-foreground/15 bg-transparent py-3.5 text-[13px] font-bold text-foreground transition-all hover:border-foreground/30 active:scale-95"
            >
              <Bookmark className="h-4 w-4 text-primary" />
            </button>
            <button
              onClick={handleAsk}
              className="flex flex-[0.3] items-center justify-center gap-2 rounded-full border-2 border-foreground/15 bg-transparent py-3.5 text-[13px] font-bold text-foreground transition-all hover:border-foreground/30 active:scale-95"
            >
              <MessageCircle className="h-4 w-4 text-primary" />
              Ask
            </button>
            <button
              onClick={handleBookClick}
              className="relative flex flex-[0.5] items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-[13px] font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
            >
              <Package className="h-4 w-4" />
              {booking ? "Booking..." : `${t("book")} Package`}
              <div className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-xl" />
            </button>
          </div>
        </div>
      )}

      {/* Payment Sheet */}
      <PaymentSheet
        open={showPayment}
        onOpenChange={setShowPayment}
        amount={pkg.total_price_gel}
        title={`${title} (${pkg.sessions_count} sessions)`}
        onPaymentSuccess={handlePaymentSuccess}
        loading={booking}
      />

      {/* Booking Ticket */}
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
