import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Camera } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import MediaLightbox from "@/components/partner/MediaLightbox";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import BottomNav from "@/components/BottomNav";
import {
  Share2,
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
  Award,
  Globe,
  ChevronDown,
} from "lucide-react";
import BackButton from "@/components/BackButton";
import { format, differenceInYears } from "date-fns";
import { cn } from "@/lib/utils";
import { useBadges } from "@/hooks/useBadges";
import { ProfileBadges } from "@/components/badges/ProfileBadges";

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
  verification_status: string;
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

interface MediaItem {
  id: string;
  image_url: string;
}

interface VerificationData {
  date_of_birth: string | null;
  years_experience: string | null;
  specializations: string[] | null;
  trainer_type: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
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
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasBooking, setHasBooking] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const entityType = partner?.partner_type === "gym" ? "studio" as const : "trainer" as const;
  const { badges } = useBadges(entityType, id);

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
        const gyms = [...new Set(
          (listingsRes.data as any[])
            .filter((l: any) => l.location_type === "gym" && l.gym_name)
            .map((l: any) => l.gym_name as string)
        )];
        setGymNames(gyms);
      }

      // Fetch verification data (age, experience, specializations)
      if (partnerRes.data) {
        const { data: vData } = await supabase
          .from("partner_verifications")
          .select("date_of_birth, years_experience, specializations, trainer_type, social_instagram, social_facebook")
          .eq("partner_id", id)
          .maybeSingle();
        if (vData) {
          setVerification(vData as VerificationData);
          if (vData.date_of_birth) {
            setAge(differenceInYears(new Date(), new Date(vData.date_of_birth)));
          }
        }
      }

      // Count completed sessions
      const { count: completedCount } = await supabase
        .from("bookings")
        .select("id, training_listings!inner(partner_id)", { count: "exact", head: true })
        .eq("training_listings.partner_id", id)
        .eq("booking_status", "completed");
      setSessionsCompleted(completedCount || 0);

      // Fetch real reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("id, rating, review_text, created_at, reviewer_id, bookings!inner(training_listings!inner(partner_id))")
        .eq("reviewer_role", "user");

      if (reviewsData) {
        const partnerReviews = (reviewsData as any[]).filter(
          (r) => r.bookings?.training_listings?.partner_id === id
        );
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

      // Check if current user has a confirmed booking
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

      // Fetch partner media
      const { data: mediaData } = await supabase
        .from("partner_media")
        .select("id, image_url, is_featured, sort_order")
        .eq("partner_id", id)
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true });
      if (mediaData) setMediaItems(mediaData as MediaItem[]);

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
  const isVerified = partner.verification_status === "verified";

  const trainingTypeLabel = (tt: string) => {
    switch (tt) {
      case "one_on_one": return "1-on-1";
      case "group": return "Group";
      case "event": return "Event";
      default: return tt;
    }
  };

  const roleLabel = partner.partner_type === "gym"
    ? "Gym & Studio"
    : verification?.trainer_type
      ? verification.trainer_type.charAt(0).toUpperCase() + verification.trainer_type.slice(1) + " Trainer"
      : (partner.sports?.[0] || "Fitness") + " Specialist";

  // Collect unique training types from listings
  const sessionTypes = [...new Set(listings.map(l => trainingTypeLabel(l.training_type)))];
  // Collect location types
  const locationTypes = [...new Set(
    listings.map(l => {
      const raw = (l as any).location_type;
      if (!raw) return null;
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }).filter(Boolean) as string[]
  )];

  const bioText = partner.bio || "";
  const bioIsLong = bioText.length > 200;

  return (
    <div className="relative min-h-screen bg-background pb-28">
      {/* ─────────── SECTION 1: HERO / IDENTITY ─────────── */}
      <div className="relative">
        {/* Gradient hero background */}
        <div className="h-52 w-full bg-gradient-to-br from-primary/25 via-accent/30 to-secondary/15">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>

        {/* Top actions */}
        <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
          <BackButton variant="overlay" />
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/20 backdrop-blur-sm transition-colors hover:bg-black/40">
            <Share2 className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>

        {/* Avatar — overlapping hero */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 z-20">
          <div className="relative">
            <Avatar className="h-32 w-32 border-[5px] border-card shadow-2xl">
              {partner.logo_url && <AvatarImage src={partner.logo_url} className="object-cover" />}
              <AvatarFallback className="bg-primary/10 text-4xl font-bold text-primary">
                {partner.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {isVerified && (
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg">
                <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Identity text — centered below avatar */}
      <div className="pt-20 text-center px-6">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{partner.display_name}</h1>
          {age && <span className="text-base text-muted-foreground">{age}</span>}
        </div>
        <p className="mt-1 text-sm font-semibold text-primary">{roleLabel}</p>

        {/* Gym association */}
        {gymNames.length > 0 && (
          <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span>{gymNames.join(" · ")}</span>
          </div>
        )}

        {/* Location */}
        {partner.location && (
          <div className="mt-1.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{partner.location}</span>
          </div>
        )}

        {/* Badges */}
        <ProfileBadges badges={badges} name={partner.display_name} maxVisible={3} />
      </div>

      {/* ─────────── SECTION 2: QUICK STATS ROW ─────────── */}
      <div className="mt-6 mx-5">
        <div className="grid grid-cols-3 gap-2.5">
          {verification?.years_experience && (
            <StatBlock icon={<Award className="h-4 w-4 text-primary" />} value={`${verification.years_experience}+`} label="Years Exp." />
          )}
          {sessionsCompleted > 0 && (
            <StatBlock icon={<Calendar className="h-4 w-4 text-primary" />} value={String(sessionsCompleted)} label="Sessions" />
          )}
          {rating && (
            <StatBlock icon={<Star className="h-4 w-4 fill-primary text-primary" />} value={rating} label={`${reviewCount} reviews`} />
          )}
        </div>
      </div>

      {/* ─────────── PRIMARY CTA ─────────── */}
      <div className="mt-8 mx-5 flex items-center gap-3">
        <button className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-muted active:scale-95">
          <Bookmark className="h-5 w-5 text-primary" />
        </button>
        <button
          onClick={() => document.getElementById("sessions-section")?.scrollIntoView({ behavior: "smooth" })}
          className="relative flex-1 rounded-2xl bg-primary py-4 text-center text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          Book a Session
        </button>
        <button
          onClick={() => navigate(`/messages`)}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-card transition-colors hover:bg-muted active:scale-95"
        >
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* ─────────── SECTION 3: BIO / ABOUT ─────────── */}
      {bioText && (
        <section className="mt-10 mx-5">
          <SectionTitle>About</SectionTitle>
          <div className="mt-3 rounded-2xl bg-card border border-border/50 p-5">
            <p className={cn(
              "text-[15px] leading-[1.75] text-foreground/80",
              !bioExpanded && bioIsLong && "line-clamp-4"
            )}>
              {bioText}
            </p>
            {bioIsLong && (
              <button
                onClick={() => setBioExpanded(!bioExpanded)}
                className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary"
              >
                {bioExpanded ? "Show less" : "Read more"}
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", bioExpanded && "rotate-180")} />
              </button>
            )}
          </div>
        </section>
      )}

      {/* ─────────── SECTION 3.5: PHOTOS & VIDEOS ─────────── */}
      {mediaItems.length > 0 && (
        <section className="mt-10 mx-5">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="h-3.5 w-3.5 text-muted-foreground" />
            <SectionTitle>Photos & Videos</SectionTitle>
          </div>
          <Carousel opts={{ align: "start", loop: false }} className="w-full">
            <CarouselContent className="-ml-3">
              {mediaItems.map((item, idx) => (
                <CarouselItem
                  key={item.id}
                  className="pl-3 basis-[75%] sm:basis-[60%]"
                >
                  <button
                    onClick={() => setLightboxIndex(idx)}
                    className="w-full overflow-hidden rounded-2xl bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="aspect-[4/3]">
                      <img
                        src={item.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          {mediaItems.length > 2 && (
            <p className="mt-2 text-[11px] text-muted-foreground text-center">Swipe to see more</p>
          )}
        </section>
      )}

      {/* ─────────── SECTION 4: DETAILS (COLLAPSIBLE) ─────────── */}
      {(verification?.years_experience || verification?.specializations?.length || verification?.trainer_type ||
        (partner.sports && partner.sports.length > 0) ||
        (partner.languages && partner.languages.length > 0) || sessionTypes.length > 0 || locationTypes.length > 0) && (
        <section className="mt-8 mx-5">
          <button
            onClick={() => setDetailsExpanded(!detailsExpanded)}
            className="flex w-full items-center justify-between rounded-2xl bg-card border border-border/50 p-4 transition-colors hover:border-primary/30 active:bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Award className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">Experience & Details</p>
                <p className="text-[11px] text-muted-foreground">
                  {[
                    verification?.years_experience && `${verification.years_experience}+ yrs`,
                    verification?.trainer_type && verification.trainer_type.charAt(0).toUpperCase() + verification.trainer_type.slice(1),
                    partner.sports?.length && `${partner.sports.length} sports`,
                    partner.languages?.length && `${partner.languages.length} languages`,
                  ].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", detailsExpanded && "rotate-180")} />
          </button>

          {detailsExpanded && (
            <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
              {/* Credentials */}
              {verification?.years_experience && (
                <CredentialRow icon={<Award className="h-4 w-4 text-primary" />} label="Experience" value={`${verification.years_experience}+ years`} />
              )}
              {verification?.trainer_type && (
                <CredentialRow icon={<Dumbbell className="h-4 w-4 text-primary" />} label="Type" value={verification.trainer_type.charAt(0).toUpperCase() + verification.trainer_type.slice(1)} />
              )}
              {isVerified && (
                <CredentialRow icon={<CheckCircle2 className="h-4 w-4 text-primary" />} label="Verification" value="Identity Verified" />
              )}
              {verification?.specializations && verification.specializations.length > 0 && (
                <div className="rounded-2xl bg-card border border-border/50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">Specializations</p>
                  <div className="flex flex-wrap gap-2">
                    {verification.specializations.map(s => (
                      <span key={s} className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sports */}
              {partner.sports && partner.sports.length > 0 && (
                <div className="rounded-2xl bg-card border border-border/50 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">Sports & Activities</p>
                  <div className="flex flex-wrap gap-2">
                    {partner.sports.map((s) => (
                      <span key={s} className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-foreground">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Languages & Details */}
              {partner.languages && partner.languages.length > 0 && (
                <DetailChipRow icon={<Globe className="h-4 w-4 text-primary" />} label="Languages" items={partner.languages} />
              )}
              {sessionTypes.length > 0 && (
                <DetailChipRow icon={<Users className="h-4 w-4 text-primary" />} label="Session Types" items={sessionTypes} />
              )}
              {locationTypes.length > 0 && (
                <DetailChipRow icon={<MapPin className="h-4 w-4 text-primary" />} label="Environments" items={locationTypes} />
              )}
            </div>
          )}
        </section>
      )}

      {/* ─────────── SECTION 7: CONTACT ─────────── */}
      <section className="mt-10 mx-5">
        <SectionTitle>Contact</SectionTitle>
        <div className="mt-3 rounded-2xl bg-card border border-border/50 p-5">
          {hasBooking ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/messages`)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 transition-colors hover:bg-primary/20 active:scale-95"
                title="Chat"
              >
                <MessageCircle className="h-5 w-5 text-primary" />
              </button>
              {partner.phone_number && (
                <a
                  href={`tel:${partner.phone_number}`}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 transition-colors hover:bg-primary/20 active:scale-95"
                  title="Call"
                >
                  <Phone className="h-5 w-5 text-primary" />
                </a>
              )}
              {verification?.social_instagram && (
                <a
                  href={`https://instagram.com/${verification.social_instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 transition-colors hover:bg-primary/20 active:scale-95"
                  title="Instagram"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <circle cx="12" cy="12" r="5" />
                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
                  </svg>
                </a>
              )}
              {verification?.social_facebook && (
                <a
                  href={verification.social_facebook.startsWith("http") ? verification.social_facebook : `https://facebook.com/${verification.social_facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 transition-colors hover:bg-primary/20 active:scale-95"
                  title="Facebook"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                </a>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-[13px] text-muted-foreground">Book a session to unlock contact details & chat</p>
            </div>
          )}
        </div>
      </section>

      {/* ─────────── SECTION 8: REVIEWS ─────────── */}
      {reviews.length > 0 && (
        <section className="mt-10 mx-5">
          <SectionTitle>Reviews ({reviewCount})</SectionTitle>
          <div className="mt-3 space-y-3">
            {reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="rounded-2xl bg-card border border-border/50 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">U</AvatarFallback>
                    </Avatar>
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, si) => (
                        <Star key={si} className="h-3.5 w-3.5 fill-primary text-primary" />
                      ))}
                      {Array.from({ length: 5 - review.rating }).map((_, si) => (
                        <Star key={`e-${si}`} className="h-3.5 w-3.5 text-border" />
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
        </section>
      )}

      {/* ─────────── SECTION 9: UPCOMING SESSIONS ─────────── */}
      <section id="sessions-section" className="mt-10 mx-5 pb-4">
        <SectionTitle>Upcoming Sessions</SectionTitle>
        <div className="mt-3 space-y-3">
          {listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-10 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No upcoming sessions scheduled</p>
            </div>
          ) : (
            listings.map((listing, idx) => {
              const Icon = LISTING_ICONS[idx % LISTING_ICONS.length];
              const title = lang === "ka" && listing.title_ka ? listing.title_ka : listing.title_en;
              const nextDate = new Date(listing.scheduled_at);
              const isLimitedSpots = listing.max_spots <= 3;
              return (
                <div
                  key={listing.id}
                  className="flex items-center gap-3.5 rounded-2xl bg-card border border-border/50 p-4 cursor-pointer transition-all hover:border-primary/30 active:scale-[0.99]"
                  onClick={() => navigate("/")}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
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
      </section>

      {/* ─────────── STICKY BOTTOM CTA ─────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-card/95 backdrop-blur-lg px-5 py-3 safe-area-pb">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{partner.display_name}</p>
            {listings.length > 0 && (
              <p className="text-xs text-muted-foreground">From {Math.min(...listings.map(l => l.price_gel))}₾ per session</p>
            )}
          </div>
          <button
            onClick={() => document.getElementById("sessions-section")?.scrollIntoView({ behavior: "smooth" })}
            className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.97]"
          >
            Book Now
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

/* ─── Sub-components ─── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </h2>
  );
}

function StatBlock({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-card border border-border/50 py-4 px-2">
      {icon}
      <span className="mt-1.5 text-lg font-extrabold text-foreground">{value}</span>
      <span className="mt-0.5 text-[10px] text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

function CredentialRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card border border-border/50 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

function DetailChipRow({ icon, label, items }: { icon: React.ReactNode; label: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-card border border-border/50 p-4">
      <div className="flex items-center gap-2 mb-2.5">
        {icon}
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map(item => (
          <span key={item} className="rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground">{item}</span>
        ))}
      </div>
    </div>
  );
}
