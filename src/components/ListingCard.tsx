import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar, Clock, Users, CheckCircle2, MessageCircle, Star,
  MapPin, BarChart3, ChevronUp, Bookmark, ChevronDown, Dumbbell, Target, ShoppingBag,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import PaymentSheet from "@/components/PaymentSheet";
import BookingTicket from "@/components/BookingTicket";

function generateDescription(sport: string, trainingType: string, durationMinutes: number): string {
  const descriptions: Record<string, string[]> = {
    Yoga: [
      "A mindful session focusing on breath control, flexibility, and inner balance. Perfect for all levels looking to strengthen body and mind through guided flow sequences.",
      "Experience a rejuvenating practice combining traditional poses with modern movement science.",
    ],
    HIIT: [
      "A high-intensity interval training session designed to boost your metabolism and build functional strength.",
      "Explosive cardio and strength circuits that maximize calorie burn in minimal time.",
    ],
    Boxing: [
      "Master the fundamentals of boxing including footwork, combinations, and defensive techniques.",
      "An intense striking session blending technical skill work with high-energy pad drills.",
    ],
    Tennis: [
      "Improve your serve, volley, and baseline game with focused drills and match-play scenarios.",
      "A dynamic session covering stroke mechanics, movement patterns, and tactical play.",
    ],
  };
  const fallback = [
    `A ${durationMinutes}-minute ${trainingType.replace("_", " ")} session designed to challenge and inspire.`,
    `Join this focused ${sport.toLowerCase()} training to build skills, endurance, and confidence.`,
  ];
  const pool = descriptions[sport] || fallback;
  return pool[(sport.length + durationMinutes) % pool.length];
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

function getTrainingTypeLabel(trainingType: string): string {
  switch (trainingType) {
    case "one_on_one": return "Private";
    case "group": return "Small Group";
    case "event": return "Event";
    default: return trainingType;
  }
}

const SPORT_FALLBACK_IMAGES: Record<string, string> = {
  Yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
  HIIT: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80",
  Boxing: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&q=80",
  Tennis: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80",
  Pilates: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80",
  CrossFit: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&q=80",
  Swimming: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&q=80",
};

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
    rental_info_en?: string | null;
    rental_info_ka?: string | null;
    difficulty_level?: string | null;
    goals?: string[] | null;
    gym_name?: string | null;
    location_type?: string | null;
    status: string;
    booked_spots?: number;
    partner_id?: string;
    location?: string | null;
    partner: {
      id?: string;
      display_name: string;
      logo_url: string | null;
      partner_type: string;
      bio: string | null;
      avg_rating?: number | null;
      review_count?: number | null;
    };
  };
}

export default function ListingCard({ listing }: ListingCardProps) {
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

  if (!listing.partner) return null;

  const title = lang === "ka" && listing.title_ka ? listing.title_ka : listing.title_en;
  const spotsLeft = listing.max_spots - (listing.booked_spots || 0);
  const date = new Date(listing.scheduled_at);
  const equipmentKey = lang === "ka" ? listing.equipment_notes_ka : listing.equipment_notes_en;
  const rentalInfo = lang === "ka" ? listing.rental_info_ka : listing.rental_info_en;
  const imageUrl = listing.background_image_url || SPORT_FALLBACK_IMAGES[listing.sport] || SPORT_FALLBACK_IMAGES.HIIT;
  const hasRating = !!(listing.partner.avg_rating && listing.partner.review_count && listing.partner.review_count > 0);

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
        const msg = error.code === "23505"
          ? "You've already booked this session."
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
    const partnerId = listing.partner_id || listing.partner?.id;
    if (partnerId) {
      const { error } = await supabase.from("bookmarks").insert({
        user_id: user.id,
        partner_id: partnerId,
      });
      if (error && error.code !== "23505") {
        toast({ title: "Bookmark failed", variant: "destructive" });
      } else {
        toast({ title: "Bookmarked! 🔖" });
      }
    }
    setBookmarking(false);
  };

  const handleAsk = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: t("loginToChat"), variant: "destructive" });
      navigate("/auth");
      return;
    }
    const partnerId = listing.partner_id || listing.partner?.id;
    if (!partnerId) return;
    const { data: partner } = await supabase
      .from("partner_profiles")
      .select("user_id")
      .eq("id", partnerId)
      .maybeSingle();
    if (!partner) {
      toast({ title: "Could not find trainer", variant: "destructive" });
      return;
    }
    const { data: myParticipations } = await supabase
      .from("conversation_participants")
      .select("thread_id")
      .eq("user_id", user.id);
    if (myParticipations && myParticipations.length > 0) {
      const threadIds = myParticipations.map((p) => p.thread_id);
      const { data: partnerInThreads } = await supabase
        .from("conversation_participants")
        .select("thread_id")
        .eq("user_id", partner.user_id)
        .in("thread_id", threadIds);
      if (partnerInThreads && partnerInThreads.length > 0) {
        navigate("/messages");
        return;
      }
    }
    const { data: threadId, error: threadError } = await supabase
      .rpc("create_thread_with_participants", {
        p_listing_id: listing.id,
        p_user_id: user.id,
        p_other_user_id: partner.user_id,
      });
    if (threadError || !threadId) {
      toast({ title: "Failed to create chat", variant: "destructive" });
      return;
    }
    navigate("/messages");
  };

  const description = listing.description_en || generateDescription(listing.sport, listing.training_type, listing.duration_minutes);
  const equipment = getEquipmentForSport(listing.sport, equipmentKey);

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

        {/* Category pill — top left */}
        <span className="absolute left-3.5 top-3.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
          {listing.sport}
        </span>

        {/* Text on image — bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <p
            className="text-[13px] font-medium text-white/80 mb-1 cursor-pointer hover:text-white transition-colors"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
            onClick={(e) => {
              e.stopPropagation();
              const pid = listing.partner_id || listing.partner?.id;
              if (pid) navigate(`/partner/${pid}`);
            }}
          >
            {listing.partner.display_name}
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
        {/* One meta line */}
        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground opacity-80 mb-3">
          <Calendar className="h-3.5 w-3.5" />
          <span>{format(date, "MMM d, h:mm a")}</span>
        </div>

        {/* Price + Book row */}
        <div className="flex items-center justify-between">
          <p className="text-[19px] font-semibold text-foreground">
            {listing.price_gel}₾
            <span className="text-[12px] font-normal text-muted-foreground ml-1">/ session</span>
          </p>
          <button
            onClick={handleBookClick}
            className="rounded-full bg-primary px-5 py-2.5 text-[14px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97]"
          >
            {t("bookNowBtn")}
          </button>
        </div>
      </div>

      {/* ─── EXPANDED DETAIL PANEL ─── */}
      {expanded && (
        <div className="border-t border-border/60 animate-in slide-in-from-top-2 fade-in duration-300">
          {/* Partner row with avatar */}
          <div className="px-5 pt-5 pb-2 flex items-center gap-2.5">
            <Avatar
              className="h-8 w-8 cursor-pointer"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                const pid = listing.partner_id || listing.partner?.id;
                if (pid) navigate(`/partner/${pid}`);
              }}
            >
              {listing.partner.logo_url ? <AvatarImage src={listing.partner.logo_url} /> : null}
              <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                {listing.partner.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[14px] font-medium text-foreground">
              {listing.partner.display_name}
            </span>
            {hasRating && (
              <div className="ml-auto flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="text-[13px] font-semibold text-foreground">
                  {Number(listing.partner.avg_rating).toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Info pills */}
          <div className="flex gap-2 px-5 py-3 overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5 shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-[12px] font-medium text-foreground">{listing.duration_minutes} min</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5 shrink-0">
              <Users className="h-3.5 w-3.5 text-primary" />
              <span className="text-[12px] font-medium text-foreground">{getTrainingTypeLabel(listing.training_type)}</span>
            </div>
            {listing.location && (
              <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5 shrink-0">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span className="text-[12px] font-medium text-foreground">{listing.location}</span>
              </div>
            )}
            {listing.difficulty_level && (
              <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5 shrink-0">
                <BarChart3 className="h-3.5 w-3.5 text-primary" />
                <span className="text-[12px] font-medium text-foreground capitalize">{listing.difficulty_level}</span>
              </div>
            )}
          </div>

          {/* Gym name */}
          {listing.gym_name && (
            <div className="px-5 pb-3 flex items-center gap-1.5">
              <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[13px] text-muted-foreground">{listing.gym_name}</span>
            </div>
          )}

          {/* Spots left */}
          {listing.max_spots > 1 && spotsLeft <= 5 && spotsLeft > 0 && (
            <p className="text-[12px] text-muted-foreground px-5 pb-3">
              {spotsLeft} {t("spotsLeftLabel")} · {getTrainingTypeLabel(listing.training_type)}
            </p>
          )}

          {/* Description */}
          <div className="px-5 pb-4">
            <p className="text-label mb-2">{t("aboutSession") || "About"}</p>
            <p className="text-[14px] leading-relaxed text-muted-foreground">{description}</p>
          </div>

          {/* Goals */}
          {listing.goals && listing.goals.length > 0 && (
            <div className="px-5 pb-4">
              <p className="text-label mb-2">{t("goalsLabel") || "Goals"}</p>
              <div className="flex flex-wrap gap-1.5">
                {listing.goals.map((goal) => (
                  <span key={goal} className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-[12px] font-medium text-foreground">
                    <Target className="h-3 w-3 text-primary" />
                    {goal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* What to bring */}
          {equipment.length > 0 && (
            <div className="px-5 pb-4">
              <p className="text-label mb-2">{t("whatToBringLabel")}</p>
              <div className="flex flex-wrap gap-1.5">
                {equipment.map((item) => (
                  <span key={item} className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-[12px] font-medium text-foreground">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Rental info */}
          {rentalInfo && (
            <div className="px-5 pb-4">
              <p className="text-label mb-2">{t("rentalInfoLabel") || "Rental Info"}</p>
              <div className="flex items-start gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                <p className="text-[13px] leading-relaxed text-muted-foreground">{rentalInfo}</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 px-5 pb-5 pt-1">
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
              {t("askBtn")}
            </button>
            <button
              onClick={handleBookClick}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary h-10 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-colors"
            >
              {booking ? t("booking") : `${t("book")} Now`}
            </button>
          </div>
        </div>
      )}

      <PaymentSheet
        open={showPayment}
        onOpenChange={setShowPayment}
        amount={listing.price_gel}
        title={listing.title_en}
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
