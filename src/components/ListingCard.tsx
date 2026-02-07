import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, Users, CheckCircle2, MessageCircle, Star, MapPin, BarChart3, ChevronUp, Bookmark } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import PaymentSheet from "@/components/PaymentSheet";
import BookingTicket from "@/components/BookingTicket";

// Generate a consistent pseudo-random description based on listing data
function generateDescription(sport: string, trainingType: string, durationMinutes: number): string {
  const descriptions: Record<string, string[]> = {
    Yoga: [
      "A mindful session focusing on breath control, flexibility, and inner balance. Perfect for all levels looking to strengthen body and mind through guided flow sequences.",
      "Experience a rejuvenating practice combining traditional poses with modern movement science. Focus on mindfulness and breathing techniques to start your day balanced.",
    ],
    HIIT: [
      "A high-intensity interval training session designed to boost your metabolism and build functional strength using minimal equipment. Push your limits in a supportive environment.",
      "Explosive cardio and strength circuits that maximize calorie burn in minimal time. Suitable for those ready to challenge themselves with dynamic, full-body movements.",
    ],
    Boxing: [
      "Master the fundamentals of boxing including footwork, combinations, and defensive techniques. Build confidence, coordination, and cardiovascular endurance.",
      "An intense striking session blending technical skill work with high-energy pad drills. Develop power, speed, and mental toughness under expert guidance.",
    ],
    Tennis: [
      "Improve your serve, volley, and baseline game with focused drills and match-play scenarios. Designed to sharpen technique and court awareness.",
      "A dynamic session covering stroke mechanics, movement patterns, and tactical play. Perfect for players looking to elevate their competitive edge.",
    ],
  };
  const fallback = [
    `A ${durationMinutes}-minute ${trainingType.replace("_", " ")} session designed to challenge and inspire. Expect expert coaching, structured drills, and a supportive atmosphere.`,
    `Join this focused ${sport.toLowerCase()} training to build skills, endurance, and confidence. Tailored programming ensures progress at every level.`,
  ];
  const pool = descriptions[sport] || fallback;
  const index = (sport.length + durationMinutes) % pool.length;
  return pool[index];
}

function getEquipmentForSport(sport: string, equipmentNotes: string | null): string[] {
  if (equipmentNotes) return equipmentNotes.split(",").map((s) => s.trim());
  const defaults: Record<string, string[]> = {
    Yoga: ["Yoga Mat", "Water", "Towel"],
    HIIT: ["Training Shoes", "Water", "Towel"],
    Boxing: ["Boxing Gloves", "Hand Wraps", "Water"],
    Tennis: ["Racket", "Tennis Shoes", "Water"],
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

interface ListingCardProps {
  listing: {
    id: string;
    title_en: string;
    title_ka: string | null;
    description_en: string | null;
    description_ka: string | null;
    sport: string;
    training_type: string;
    scheduled_at: string;
    duration_minutes: number;
    price_gel: number;
    max_spots: number;
    background_image_url: string | null;
    equipment_notes_en: string | null;
    equipment_notes_ka: string | null;
    status: string;
    booked_spots?: number;
    partner_id?: string;
    partner: {
      id?: string;
      display_name: string;
      logo_url: string | null;
      partner_type: string;
      bio: string | null;
    };
  };
}

export default function ListingCard({ listing }: ListingCardProps) {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const title = lang === "ka" && listing.title_ka ? listing.title_ka : listing.title_en;
  const spotsLeft = listing.max_spots - (listing.booked_spots || 0);
  const date = new Date(listing.scheduled_at);
  const equipmentKey = lang === "ka" ? listing.equipment_notes_ka : listing.equipment_notes_en;

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
        listing_id: listing.id,
        spots: 1,
        total_price: listing.price_gel,
        payment_status: "paid",
        booking_status: "confirmed",
        stripe_payment_id: `demo_${method}_${Date.now()}`,
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
    const partnerId = listing.partner_id || listing.partner?.id;
    if (partnerId) {
      const { error } = await supabase.from("bookmarks").insert({
        user_id: user.id,
        partner_id: partnerId,
      });
      if (error && error.code !== "23505") {
        toast({ title: "Bookmark failed", variant: "destructive" });
      } else {
        toast({ title: "Bookmarked! 🔖", description: "You'll get notified when the session is coming up." });
      }
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

  const description = listing.description_en || generateDescription(listing.sport, listing.training_type, listing.duration_minutes);
  const equipment = getEquipmentForSport(listing.sport, equipmentKey);
  const level = getLevelLabel(listing.training_type);

  return (
    <div
      className="group overflow-hidden rounded-[1.75rem] ios-shadow cursor-pointer transition-all duration-300"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Image card */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: expanded ? undefined : '420px' }}>
        {listing.background_image_url ? (
          <img
            src={listing.background_image_url}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/30 to-secondary/40">
            <span className="text-5xl font-bold text-primary/30">{listing.sport}</span>
          </div>
        )}

        <div className="absolute inset-0 card-gradient-overlay" />

        {/* Top badges */}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 rounded-full bg-foreground/70 py-2 pl-2 pr-4 backdrop-blur-sm cursor-pointer transition-transform hover:scale-105 active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              const pid = listing.partner_id || listing.partner?.id;
              if (pid) navigate(`/partner/${pid}`);
            }}
          >
            <Avatar className="h-8 w-8 border border-white/20">
              {listing.partner.logo_url ? <AvatarImage src={listing.partner.logo_url} /> : null}
              <AvatarFallback className="bg-white/20 text-[10px] font-semibold text-white">
                {listing.partner.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[13px] font-medium text-white">{listing.partner.display_name}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2">
            <CheckCircle2 className="h-4 w-4 text-white" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">{t("verified")}</span>
          </div>
        </div>

        {/* Content overlay */}
        <div className="relative flex flex-col justify-end p-5" style={{ minHeight: '420px' }}>
          <div className="mb-2 flex items-center gap-2.5">
            <span className="rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white">
              {listing.sport}
            </span>
            {listing.max_spots > 1 && (
              <span className="text-[12px] font-medium text-white/80">
                • {spotsLeft} SPOTS LEFT
              </span>
            )}
          </div>

          <h3 className="mb-3 text-[24px] font-semibold leading-tight text-white drop-shadow-lg">
            {title}
          </h3>

          <div className="mb-4 flex items-center gap-4 text-[13px] text-white/90">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-secondary" />
              {format(date, "EEE, MMM d")}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-accent" />
              {format(date, "hh:mm a")}
            </span>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-white/60">Starting at</p>
              <p className="text-[34px] font-semibold text-white leading-none">{listing.price_gel}₾</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
              }}
              className="rounded-full bg-primary px-6 py-3 text-[13px] font-semibold uppercase tracking-wider text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-95 shadow-lg"
            >
              Book Now
            </button>
          </div>
        </div>
      </div>

      {/* ─── EXPANDED DETAIL PANEL ─── */}
      {expanded && (
        <div className="bg-card animate-in slide-in-from-top-2 fade-in duration-300">
          {/* Price header — larger and more spacious */}
          <div className="px-6 pt-5 pb-4 border-b border-border/40">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-3xl font-extrabold text-foreground">{listing.price_gel}₾</p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">Per Class</p>
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

          {/* Info pills — more spacing */}
          <div className="flex gap-2.5 px-6 py-4 overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2.5 shrink-0">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-[13px] font-semibold text-foreground">{listing.duration_minutes} mins</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2.5 shrink-0">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-[13px] font-semibold text-foreground">{level}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2.5 shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-[13px] font-semibold text-foreground">Studio</span>
            </div>
          </div>

          {/* The Experience — more breathing room */}
          <div className="px-6 pb-5">
            <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">The Experience</h4>
            <p className="text-[15px] leading-[1.7] text-foreground/80">{description}</p>
          </div>

          {/* Trainer card — larger and more spacious */}
          <div className="mx-6 rounded-2xl bg-muted/40 p-5 mb-5">
            <div className="flex items-center gap-3.5 mb-3">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                {listing.partner.logo_url ? <AvatarImage src={listing.partner.logo_url} /> : null}
                <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                  {listing.partner.display_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 cursor-pointer" onClick={(e) => {
                  e.stopPropagation();
                  const pid = listing.partner_id || listing.partner?.id;
                  if (pid) navigate(`/partner/${pid}`);
                }}>
                <p className="text-[15px] font-bold text-foreground hover:text-primary transition-colors">{listing.partner.display_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  <span className="text-[12px] font-semibold text-foreground">4.9</span>
                  <span className="text-[11px] text-muted-foreground">(124 reviews)</span>
                </div>
              </div>
            </div>
            {listing.partner.bio && (
              <p className="text-[13px] italic leading-relaxed text-foreground/70">"{listing.partner.bio}"</p>
            )}
          </div>

          {/* What to bring — better spacing */}
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

          {/* Action buttons — larger touch targets */}
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
              <Calendar className="h-4 w-4" />
              {booking ? "Booking..." : `${t("book")} Now`}
              <div className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-xl" />
            </button>
          </div>
        </div>
      )}

      {/* Payment Sheet */}
      <PaymentSheet
        open={showPayment}
        onOpenChange={setShowPayment}
        amount={listing.price_gel}
        title={listing.title_en}
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
          title: listing.title_en,
          sport: listing.sport,
          date: listing.scheduled_at,
          duration: listing.duration_minutes,
          price: listing.price_gel,
          trainerName: listing.partner.display_name,
        }}
      />
    </div>
  );
}
