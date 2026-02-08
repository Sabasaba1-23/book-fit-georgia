import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";
import {
  ArrowLeft,
  Share2,
  MoreHorizontal,
  Star,
  MapPin,
  Dumbbell,
  CheckCircle2,
  Clock,
  Users,
  Bookmark,
  Calendar,
  Zap,
  Trophy,
  Phone,
  Lock,
  MessageCircle,
  Building2,
} from "lucide-react";
import { format, differenceInYears } from "date-fns";

const LISTING_ICONS = [Zap, Dumbbell, Trophy];

interface PartnerData {
  id: string;
  user_id: string;
  display_name: string;
  logo_url: string | null;
  partner_type: string;
  bio: string | null;
  sports: string[] | null;
  location: string | null;
  languages: string[] | null;
  avg_rating: number | null;
  review_count: number | null;
  completion_rate: number | null;
  phone_number: string | null;
}

interface ListingData {
  id: string;
  title_en: string;
  title_ka: string | null;
  sport: string;
  training_type: string;
  scheduled_at: string;
  duration_minutes: number;
  price_gel: number;
  max_spots: number;
  status: string;
}

interface ReviewData {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  reviewer_name: string;
}

export default function PartnerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [gymNames, setGymNames] = useState<string[]>([]);
  const [age, setAge] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasBooking, setHasBooking] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [partnerRes, listingsRes] = await Promise.all([
        supabase.from("partner_profiles").select("*").eq("id", id).single(),
        supabase
          .from("training_listings")
          .select("id, title_en, title_ka, sport, training_type, scheduled_at, duration_minutes, price_gel, max_spots, status, gym_name, location_type")
          .eq("partner_id", id)
          .eq("status", "approved")
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true }),
      ]);

      if (partnerRes.data) setPartner(partnerRes.data as unknown as PartnerData);
      
      if (listingsRes.data) {
        setListings(listingsRes.data as unknown as ListingData[]);
        // Extract unique gym names
        const gyms = [...new Set(
          (listingsRes.data as any[])
            .filter((l: any) => l.location_type === "gym" && l.gym_name)
            .map((l: any) => l.gym_name as string)
        )];
        setGymNames(gyms);
      }

      // Fetch age from partner_verifications
      if (partnerRes.data) {
        const { data: verification } = await supabase
          .from("partner_verifications")
          .select("date_of_birth")
          .eq("partner_id", id)
          .maybeSingle();
        if (verification?.date_of_birth) {
          setAge(differenceInYears(new Date(), new Date(verification.date_of_birth)));
        }
      }

      // Fetch real reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("id, rating, review_text, created_at, reviewer_id, bookings!inner(training_listings!inner(partner_id))")
        .eq("reviewer_role", "user");

      if (reviewsData) {
        const partnerReviews = (reviewsData as any[]).filter(
          (r) => r.bookings?.training_listings?.partner_id === id
        );
        // We don't have reviewer names easily without another query, so use initials
        setReviews(
          partnerReviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            review_text: r.review_text,
            created_at: r.created_at,
            reviewer_name: "User",
          }))
        );
      }

      // Check if current user has a confirmed booking with this partner
      if (user && partnerRes.data) {
        const { data: bookings } = await supabase
          .from("bookings")
          .select("id, training_listings!inner(partner_id)")
          .eq("user_id", user.id)
          .in("booking_status", ["confirmed", "completed"])
          .eq("payment_status", "paid");
        const booked = (bookings || []).some((b: any) => b.training_listings?.partner_id === id);
        setHasBooking(booked);
      }

      setLoading(false);
    }
    load();
  }, [id, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-3">
        <p className="text-muted-foreground">Partner not found</p>
        <button onClick={() => navigate("/")} className="text-primary font-semibold text-sm">Go Home</button>
      </div>
    );
  }

  const rating = partner.avg_rating && partner.review_count && partner.review_count > 0
    ? Number(partner.avg_rating).toFixed(1)
    : null;
  const reviewCount = partner.review_count && partner.review_count > 0 ? partner.review_count : 0;
  const completionRate = partner.completion_rate ? Number(partner.completion_rate) : null;

  const trainingTypeLabel = (tt: string) => {
    switch (tt) {
      case "one_on_one": return "1-on-1";
      case "group": return "Small Group";
      case "event": return "Event";
      default: return tt;
    }
  };

  return (
    <div className="relative min-h-screen bg-background pb-24">
      {/* Hero — simple gradient since no fake cover images */}
      <div className="relative h-56 w-full bg-gradient-to-br from-primary/20 via-secondary/10 to-primary/5">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        <div className="absolute left-3 right-3 z-10 flex items-center justify-between top-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm transition-colors hover:bg-black/40"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm">
              <Share2 className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-12 left-5 z-10">
          <Avatar className="h-24 w-24 border-4 border-card shadow-xl">
            {partner.logo_url && <AvatarImage src={partner.logo_url} />}
            <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
              {partner.display_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Profile info */}
      <div className="relative pt-16 px-5">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-extrabold text-foreground">{partner.display_name}</h1>
          {age && <span className="text-lg text-muted-foreground font-medium">{age}</span>}
        </div>

        <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2">
          {partner.partner_type === "gym" ? "Gym & Studio" : (partner.sports?.join(" & ") || "Fitness")} Specialist
        </p>

        {/* Gym associations */}
        {gymNames.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
            <Building2 className="h-4 w-4 text-primary" />
            <span>{gymNames.join(" · ")}</span>
          </div>
        )}

        {/* Stats — only show real data */}
        <div className="flex gap-2 mb-5">
          {rating && (
            <div className="flex flex-col items-center rounded-2xl bg-muted/50 py-3 px-4">
              <Star className="h-4 w-4 mb-1 fill-primary text-primary" />
              <span className="text-base font-extrabold text-foreground">{rating}</span>
              <span className="text-[10px] text-muted-foreground">{reviewCount} reviews</span>
            </div>
          )}
          {completionRate !== null && (
            <div className="flex flex-col items-center rounded-2xl bg-muted/50 py-3 px-4">
              <Trophy className="h-4 w-4 mb-1 text-primary" />
              <span className="text-base font-extrabold text-foreground">{completionRate}%</span>
              <span className="text-[10px] text-muted-foreground">Complete</span>
            </div>
          )}
        </div>

        {/* Location */}
        {partner.location && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
            <MapPin className="h-4 w-4 text-primary" />
            <span>{partner.location}</span>
            {partner.languages && partner.languages.length > 0 && (
              <>
                <span className="mx-1">·</span>
                <span>{partner.languages.join(", ")}</span>
              </>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3 mb-6">
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 shrink-0">
            <Bookmark className="h-5 w-5 text-primary" />
          </button>
          <button
            onClick={() => document.getElementById("sessions-section")?.scrollIntoView({ behavior: "smooth" })}
            className="relative flex-1 rounded-full bg-primary py-3.5 text-center text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            Book a Session
          </button>
        </div>

        {/* Contact */}
        <div className="mb-6 rounded-2xl bg-muted/40 p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2.5">Contact</h3>
          {hasBooking ? (
            <div className="space-y-2.5">
              {partner.phone_number && (
                <div className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-primary" />
                  <a href={`tel:${partner.phone_number}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                    {partner.phone_number}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Chat unlocked</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <p className="text-[13px] text-muted-foreground">Book a session to unlock contact details</p>
            </div>
          )}
        </div>

        {/* About */}
        {partner.bio && (
          <div className="mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">About</h3>
            <p className="text-[15px] leading-[1.7] text-foreground/80">{partner.bio}</p>
          </div>
        )}

        {/* Sports */}
        {partner.sports && partner.sports.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Sports & Activities</h3>
            <div className="flex flex-wrap gap-2">
              {partner.sports.map((s) => (
                <span key={s} className="rounded-full bg-primary/10 px-3.5 py-2 text-[12px] font-semibold text-foreground">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Reviews — only if real reviews exist */}
        {reviews.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Reviews</h3>
            <div className="space-y-3">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="rounded-2xl bg-muted/40 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex gap-0.5">
                        {Array.from({ length: review.rating }).map((_, si) => (
                          <Star key={si} className="h-3 w-3 fill-primary text-primary" />
                        ))}
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {format(new Date(review.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  {review.review_text && (
                    <p className="text-[13px] leading-relaxed text-foreground/70 italic">"{review.review_text}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sessions */}
      <div id="sessions-section" className="px-5 pt-2 pb-4">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Upcoming Sessions</h3>
        <div className="space-y-3">
          {listings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No upcoming sessions</p>
          ) : (
            listings.map((listing, idx) => {
              const Icon = LISTING_ICONS[idx % LISTING_ICONS.length];
              const title = lang === "ka" && listing.title_ka ? listing.title_ka : listing.title_en;
              const nextDate = new Date(listing.scheduled_at);
              const isLimitedSpots = listing.max_spots <= 3;
              return (
                <div
                  key={listing.id}
                  className="flex items-center gap-3 rounded-2xl bg-card ios-shadow p-4 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
                  onClick={() => navigate("/")}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" /> {format(nextDate, "MMM d")}</span>
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {listing.duration_minutes} min</span>
                      <span className="flex items-center gap-0.5"><Users className="h-3 w-3" /> {trainingTypeLabel(listing.training_type)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-extrabold text-primary">{listing.price_gel}₾</p>
                    {isLimitedSpots ? (
                      <p className="text-[9px] font-bold uppercase tracking-wider text-destructive">Limited</p>
                    ) : (
                      <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{format(nextDate, "hh:mm a")}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
