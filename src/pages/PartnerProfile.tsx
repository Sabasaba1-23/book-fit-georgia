import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Camera } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import MediaLightbox from "@/components/partner/MediaLightbox";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
  Phone,
  Lock,
  MessageCircle,
  Building2,
  Award,
  Globe,
  ChevronDown,
  BarChart3,
  Target,
  ShoppingBag,
} from "lucide-react";
import BookingTicket from "@/components/BookingTicket";
import type { PaymentLocationState } from "@/pages/Payment";
import BackButton from "@/components/BackButton";
import { format, differenceInYears } from "date-fns";
import { cn } from "@/lib/utils";
import { useBadges } from "@/hooks/useBadges";
import { BadgeIcon } from "@/components/badges/BadgeIcon";
import { BadgesModal } from "@/components/badges/BadgesModal";

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
  background_image_url: string | null;
  description_en: string | null;
  description_ka: string | null;
  equipment_notes_en: string | null;
  equipment_notes_ka: string | null;
  rental_info_en: string | null;
  rental_info_ka: string | null;
  difficulty_level: string | null;
  goals: string[] | null;
  gym_name: string | null;
  location_type: string | null;
  location: string | null;
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

interface GymTrainerLink {
  id: string;
  display_name: string;
  logo_url: string | null;
  sports: string[] | null;
  partner_id: string;
}

interface GymLink {
  id: string;
  display_name: string;
  logo_url: string | null;
  partner_id: string;
}

interface PartnerLocation {
  id: string;
  label: string;
  address: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  is_primary: boolean;
}

export default function PartnerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
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
  const [gymTrainers, setGymTrainers] = useState<GymTrainerLink[]>([]);
  const [linkedGyms, setLinkedGyms] = useState<GymLink[]>([]);
  const [locations, setLocations] = useState<PartnerLocation[]>([]);
  const [locationExpanded, setLocationExpanded] = useState(false);
  const [expandedListingId, setExpandedListingId] = useState<string | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState("");
  const [ticketListing, setTicketListing] = useState<ListingData | null>(null);
  const entityType = partner?.partner_type === "gym" ? "studio" as const : "trainer" as const;
  const { badges } = useBadges(entityType, id);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [partnerRes, listingsRes] = await Promise.all([
        supabase.from("partner_profiles").select("*").eq("id", id).single(),
        supabase
          .from("training_listings")
          .select("id, title_en, title_ka, sport, training_type, scheduled_at, duration_minutes, price_gel, max_spots, status, gym_name, location_type, background_image_url, description_en, description_ka, equipment_notes_en, equipment_notes_ka, rental_info_en, rental_info_ka, difficulty_level, goals, location")
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

      const { count: completedCount } = await supabase
        .from("bookings")
        .select("id, training_listings!inner(partner_id)", { count: "exact", head: true })
        .eq("training_listings.partner_id", id)
        .eq("booking_status", "completed");
      setSessionsCompleted(completedCount || 0);

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

      const { data: mediaData } = await supabase
        .from("partner_media")
        .select("id, image_url, is_featured, sort_order")
        .eq("partner_id", id)
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true });
      if (mediaData) setMediaItems(mediaData as MediaItem[]);

      // Fetch locations
      const { data: locData } = await supabase
        .from("partner_locations")
        .select("id, label, address, description, latitude, longitude, is_primary")
        .eq("partner_id", id)
        .order("is_primary", { ascending: false })
        .order("sort_order", { ascending: true });
      if (locData) setLocations(locData as PartnerLocation[]);

      // For gym profiles: fetch linked trainers
      if (partnerRes.data && (partnerRes.data as any).partner_type === "gym") {
        const { data: gtData } = await supabase
          .from("gym_trainers")
          .select("trainer_partner_id")
          .eq("gym_partner_id", id)
          .eq("status", "active");
        if (gtData && gtData.length > 0) {
          const trainerIds = gtData.map((g: any) => g.trainer_partner_id);
          const { data: trainerProfiles } = await supabase
            .from("partner_profiles")
            .select("id, display_name, logo_url, sports")
            .in("id", trainerIds);
          if (trainerProfiles) {
            setGymTrainers(trainerProfiles.map((tp: any) => ({
              id: tp.id,
              display_name: tp.display_name,
              logo_url: tp.logo_url,
              sports: tp.sports,
              partner_id: tp.id,
            })));
          }
        }
      }

      // For individual trainers: fetch linked gyms
      if (partnerRes.data && (partnerRes.data as any).partner_type === "individual") {
        const { data: gtData } = await supabase
          .from("gym_trainers")
          .select("gym_partner_id")
          .eq("trainer_partner_id", id)
          .eq("status", "active");
        if (gtData && gtData.length > 0) {
          const gymIds = gtData.map((g: any) => g.gym_partner_id);
          const { data: gymProfiles } = await supabase
            .from("partner_profiles")
            .select("id, display_name, logo_url")
            .in("id", gymIds);
          if (gymProfiles) {
            setLinkedGyms(gymProfiles.map((gp: any) => ({
              id: gp.id,
              display_name: gp.display_name,
              logo_url: gp.logo_url,
              partner_id: gp.id,
            })));
          }
        }
      }

      setLoading(false);
    }
    load();
  }, [id, user]);

  const handleSessionBookClick = (listingId: string) => {
    if (!user) {
      toast({ title: t("loginToBook"), variant: "destructive" });
      navigate("/auth");
      return;
    }
    const listing = listings.find(l => l.id === listingId);
    if (!listing || !partner) return;
    const paymentState: PaymentLocationState = {
      amount: listing.price_gel,
      title: listing.title_en,
      listingId: listing.id,
      sport: listing.sport,
      scheduledAt: listing.scheduled_at,
      durationMinutes: listing.duration_minutes,
      trainerName: partner.display_name,
    };
    navigate("/payment", { state: paymentState });
  };

  const getEquipment = (l: ListingData): string[] => {
    const notes = lang === "ka" ? l.equipment_notes_ka : l.equipment_notes_en;
    if (notes) return notes.split(",").map(s => s.trim());
    const defaults: Record<string, string[]> = {
      Yoga: ["Yoga Mat", "Water", "Towel"],
      HIIT: ["Training Shoes", "Water", "Towel"],
      Boxing: ["Boxing Gloves", "Hand Wraps", "Water"],
      Tennis: ["Racket", "Tennis Shoes", "Water"],
    };
    return defaults[l.sport] || ["Comfortable Clothing", "Water"];
  };


  const SPORT_FALLBACK_IMAGES: Record<string, string> = {
    Yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&q=80",
    HIIT: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80",
    Boxing: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600&q=80",
    Tennis: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=80",
    Pilates: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80",
    CrossFit: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&q=80",
    Swimming: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600&q=80",
  };

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

  const sessionTypes = [...new Set(listings.map(l => trainingTypeLabel(l.training_type)))];
  const locationTypes = [...new Set(
    listings.map(l => {
      const raw = (l as any).location_type;
      if (!raw) return null;
      return raw.charAt(0).toUpperCase() + raw.slice(1);
    }).filter(Boolean) as string[]
  )];

  const bioText = partner.bio || "";
  const bioIsLong = bioText.length > 160;

  // Hero image: logo_url, first featured media, or null for gradient fallback
  const heroImage = partner.logo_url || (mediaItems.length > 0 ? mediaItems[0].image_url : null);

  // Stats line items for the hero overlay
  const statsItems: string[] = [];
  if (rating) statsItems.push(`⭐ ${rating} (${reviewCount})`);
  if (verification?.years_experience) statsItems.push(`${verification.years_experience}+ yrs`);
  if (partner.location) statsItems.push(partner.location);

  return (
    <div className="relative min-h-screen bg-background pb-28">
      {/* ─────────── HERO SECTION ─────────── */}
      <div className="relative">
        {heroImage ? (
          <div className="relative h-[420px] w-full overflow-hidden">
            <img
              src={heroImage}
              alt={partner.display_name}
              className="h-full w-full object-cover"
            />
            {/* Bottom gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        ) : (
          <div className="relative h-[420px] w-full bg-gradient-to-br from-primary/25 via-accent/30 to-secondary/15">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[120px] font-extrabold text-primary/10">{partner.display_name.charAt(0)}</span>
            </div>
          </div>
        )}

        {/* Top floating actions */}
        <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
          <BackButton variant="overlay" />
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-md transition-colors hover:bg-black/50 active:scale-95">
              <Bookmark className="h-4 w-4 text-white" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-md transition-colors hover:bg-black/50 active:scale-95">
              <Share2 className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Hero overlay card — anchored to bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-5 pb-5">
          {/* Name + verified */}
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              {partner.display_name}
            </h1>
            {age && <span className="text-lg text-muted-foreground">{age}</span>}
            {isVerified && (
              <CheckCircle2 className="h-5 w-5 text-primary fill-primary/20" />
            )}
          </div>

          {/* Role / specialization */}
          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
            {roleLabel}
          </p>

          {/* Gym association — from linked gyms or listing-derived names */}
          {(linkedGyms.length > 0 || gymNames.length > 0) && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              {linkedGyms.length > 0 ? (
                <div className="flex items-center gap-1 flex-wrap">
                  {linkedGyms.map((gym, i) => (
                    <span key={gym.id}>
                      <button
                        onClick={() => navigate(`/partner/${gym.partner_id}`)}
                        className="text-primary font-semibold hover:underline"
                      >
                        {gym.display_name}
                      </button>
                      {i < linkedGyms.length - 1 && <span className="mx-1">·</span>}
                    </span>
                  ))}
                </div>
              ) : (
                <span>{gymNames.join(" · ")}</span>
              )}
            </div>
          )}


          {/* Compact stats row */}
          {statsItems.length > 0 && (
            <p className="mt-2 text-xs text-muted-foreground font-medium">
              {statsItems.join("  ·  ")}
            </p>
          )}
        </div>
      </div>

      {/* ─────────── PRIMARY CTA ─────────── */}
      <div className="mx-5 mt-5">
        <button
          onClick={() => document.getElementById("sessions-section")?.scrollIntoView({ behavior: "smooth" })}
          className="w-full rounded-2xl bg-primary py-4 text-center text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          Book a Session
        </button>
      </div>

      {/* ─────────── LOCATION ─────────── */}
      {(partner.location || locations.length > 0) && (
        <section className="mt-6 mx-5">
          <SectionTitle>Location</SectionTitle>
          <div className="mt-2.5 space-y-2">
            {/* Primary / legacy location */}
            {partner.location && locations.length === 0 && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partner.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl bg-card border border-border/50 p-4 transition-colors hover:border-primary/30 active:bg-muted/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-foreground">{partner.location}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Tap to open in Maps</p>
                </div>
              </a>
            )}

            {/* Multi-location entries */}
            {locations.slice(0, locationExpanded ? undefined : 2).map((loc) => (
              <a
                key={loc.id}
                href={
                  loc.latitude && loc.longitude
                    ? `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.address || loc.label)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-2xl bg-card border border-border/50 p-4 transition-colors hover:border-primary/30 active:bg-muted/30"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[15px] font-semibold text-foreground">{loc.label || loc.address}</p>
                    {loc.is_primary && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-primary leading-none">Main</span>
                    )}
                  </div>
                  {loc.address && loc.label && (
                    <p className="text-xs text-muted-foreground mt-0.5">{loc.address}</p>
                  )}
                  {loc.description && (
                    <p className="text-xs text-muted-foreground/70 mt-1 leading-relaxed">{loc.description}</p>
                  )}
                  <p className="text-[10px] text-primary font-medium mt-1">Open in Maps →</p>
                </div>
              </a>
            ))}

            {locations.length > 2 && (
              <button
                onClick={() => setLocationExpanded(!locationExpanded)}
                className="w-full text-center text-xs font-semibold text-primary py-2"
              >
                {locationExpanded ? "Show less" : `Show all ${locations.length} locations`}
              </button>
            )}
          </div>
        </section>
      )}

      {/* ─────────── ABOUT ─────────── */}
      {bioText && (
        <section className="mt-6 mx-5">
          <SectionTitle>About</SectionTitle>
          <p className={cn(
            "mt-2.5 text-[15px] leading-[1.7] text-foreground/80",
            !bioExpanded && bioIsLong && "line-clamp-3"
          )}>
            {bioText}
          </p>
          {bioIsLong && (
            <button
              onClick={() => setBioExpanded(!bioExpanded)}
              className="mt-1.5 text-xs font-semibold text-primary"
            >
              {bioExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </section>
      )}

      {/* ─────────── BADGES ─────────── */}
      {badges.length > 0 && (
        <div className="mt-6 mx-5 flex items-center gap-2 flex-wrap">
          {badges.slice(0, 6).map((eb) => (
            <div key={eb.badge_key} className="group relative">
              <BadgeIcon icon={eb.badge.icon} tier={eb.badge.tier} size="sm" />
              <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground/75 backdrop-blur-sm px-2 py-1 text-[10px] font-medium text-background opacity-0 transition-opacity group-hover:opacity-100 z-30">
                {eb.badge.title}
              </span>
            </div>
          ))}
          {badges.length > 6 && (
            <BadgesModal badges={badges} name={partner.display_name}>
              <button className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
                +{badges.length - 6} more
              </button>
            </BadgesModal>
          )}
        </div>
      )}

      {/* ─────────── PHOTOS & VIDEOS ─────────── */}
      {mediaItems.length > 0 && (
        <section className="mt-6 mx-5">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="h-3.5 w-3.5 text-muted-foreground" />
            <SectionTitle>Photos & Videos</SectionTitle>
          </div>
          <Carousel opts={{ align: "start", loop: false }} className="w-full">
            <CarouselContent className="-ml-3">
              {mediaItems.map((item, idx) => (
                <CarouselItem key={item.id} className="pl-3 basis-[75%] sm:basis-[60%]">
                  <button
                    onClick={() => setLightboxIndex(idx)}
                    className="w-full overflow-hidden rounded-2xl bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="aspect-[4/3]">
                      <img src={item.image_url} alt="" className="h-full w-full object-cover" loading="lazy" />
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

      {/* ─────────── EXPERIENCE & DETAILS (COLLAPSIBLE) ─────────── */}
      {(verification?.years_experience || verification?.specializations?.length || verification?.trainer_type ||
        (partner.sports && partner.sports.length > 0) ||
        (partner.languages && partner.languages.length > 0) || sessionTypes.length > 0 || locationTypes.length > 0) && (
        <section className="mt-6 mx-5">
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

      {/* ─────────── CONTACT ─────────── */}
      <section className="mt-6 mx-5">
        <SectionTitle>Contact</SectionTitle>
        <div className="mt-2.5">
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
            <div className="flex items-center gap-3 rounded-2xl bg-card border border-border/50 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-[13px] text-muted-foreground">Book a session to unlock contact details & chat</p>
            </div>
          )}
        </div>
      </section>

      {/* ─────────── REVIEWS ─────────── */}
      {reviews.length > 0 && (
        <section className="mt-6 mx-5">
          <SectionTitle>Reviews ({reviewCount})</SectionTitle>
          <div className="mt-2.5 space-y-2.5">
            {reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="rounded-2xl bg-card border border-border/50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: review.rating }).map((_, si) => (
                      <Star key={si} className="h-3.5 w-3.5 fill-primary text-primary" />
                    ))}
                    {Array.from({ length: 5 - review.rating }).map((_, si) => (
                      <Star key={`e-${si}`} className="h-3.5 w-3.5 text-border" />
                    ))}
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

      {/* ─────────── TRAINER ROSTER (Gym profiles only) ─────────── */}
      {partner.partner_type === "gym" && gymTrainers.length > 0 && (
        <section className="mt-6 mx-5">
          <SectionTitle>Our Trainers</SectionTitle>
          <div className="mt-2.5 space-y-2">
            {gymTrainers.map((trainer) => (
              <button
                key={trainer.id}
                onClick={() => navigate(`/partner/${trainer.partner_id}`)}
                className="flex w-full items-center gap-3 rounded-2xl bg-card border border-border/50 p-3.5 transition-colors hover:border-primary/30 active:scale-[0.99] text-left"
              >
                <Avatar className="h-12 w-12">
                  {trainer.logo_url && <AvatarImage src={trainer.logo_url} />}
                  <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                    {trainer.display_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{trainer.display_name}</p>
                  {trainer.sports && trainer.sports.length > 0 && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {trainer.sports.slice(0, 3).join(" · ")}
                    </p>
                  )}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground/40 shrink-0 -rotate-90" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ─────────── AVAILABLE SESSIONS ─────────── */}
      <section id="sessions-section" className="mt-6 mx-5 pb-4">
        <SectionTitle>Available Sessions</SectionTitle>
        <div className="mt-2.5 space-y-2.5">
          {listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-10 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No upcoming sessions scheduled</p>
            </div>
          ) : (
            listings.map((listing, idx) => {
              const lTitle = lang === "ka" && listing.title_ka ? listing.title_ka : listing.title_en;
              const nextDate = new Date(listing.scheduled_at);
              const isNext = idx === 0;
              const isLimitedSpots = listing.max_spots <= 3;
              const isExpanded = expandedListingId === listing.id;
              const description = (lang === "ka" ? listing.description_ka : listing.description_en) || "";
              const equipment = getEquipment(listing);
              const rentalInfo = lang === "ka" ? listing.rental_info_ka : listing.rental_info_en;
              const spotsLeft = listing.max_spots;

              return (
                <div
                  key={listing.id}
                  className={cn(
                    "overflow-hidden rounded-2xl bg-card border transition-all",
                    isNext ? "border-primary/40" : "border-border/50"
                  )}
                >
                  {/* Collapsed row */}
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/30 active:scale-[0.99]"
                    onClick={() => setExpandedListingId(isExpanded ? null : listing.id)}
                  >
                    {(() => {
                      const imgUrl = listing.background_image_url || SPORT_FALLBACK_IMAGES[listing.sport] || SPORT_FALLBACK_IMAGES.HIIT;
                      return (
                        <img
                          src={imgUrl}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-xl object-cover"
                          loading="lazy"
                        />
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[13px] font-bold text-foreground truncate max-w-[140px]">{lTitle}</p>
                        {isNext && (
                          <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-primary leading-none">Next</span>
                        )}
                        {isLimitedSpots && !isNext && (
                          <span className="shrink-0 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-destructive leading-none">Limited</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5 flex-wrap">
                        <span>{format(nextDate, "MMM d, hh:mm a")}</span>
                        <span>·</span>
                        <span>{listing.duration_minutes}min</span>
                        <span>·</span>
                        <span>{trainingTypeLabel(listing.training_type)}</span>
                      </div>
                      <span className="mt-0.5 inline-block rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground">{listing.sport}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-base font-extrabold text-primary">{listing.price_gel}₾</p>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-border/60 animate-in slide-in-from-top-2 fade-in duration-300">
                      {/* Info pills */}
                      <div className="flex gap-2 px-4 py-3 overflow-x-auto hide-scrollbar">
                        <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5 shrink-0">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <span className="text-[12px] font-medium text-foreground">{listing.duration_minutes} min</span>
                        </div>
                        <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-3 py-1.5 shrink-0">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          <span className="text-[12px] font-medium text-foreground">{trainingTypeLabel(listing.training_type)}</span>
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
                        <div className="px-4 pb-3 flex items-center gap-1.5">
                          <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[13px] text-muted-foreground">{listing.gym_name}</span>
                        </div>
                      )}

                      {/* Spots left */}
                      {listing.max_spots > 1 && spotsLeft <= 5 && spotsLeft > 0 && (
                        <p className="text-[12px] text-muted-foreground px-4 pb-3">
                          {spotsLeft} spots left · {trainingTypeLabel(listing.training_type)}
                        </p>
                      )}

                      {/* Description */}
                      {description && (
                        <div className="px-4 pb-4">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">About</p>
                          <p className="text-[14px] leading-relaxed text-muted-foreground">{description}</p>
                        </div>
                      )}

                      {/* Goals */}
                      {listing.goals && listing.goals.length > 0 && (
                        <div className="px-4 pb-4">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Goals</p>
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
                        <div className="px-4 pb-4">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">What to Bring</p>
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
                        <div className="px-4 pb-4">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Rental Info</p>
                          <div className="flex items-start gap-1.5">
                            <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                            <p className="text-[13px] leading-relaxed text-muted-foreground">{rentalInfo}</p>
                          </div>
                        </div>
                      )}

                      {/* Book button */}
                      <div className="px-4 pb-4 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSessionBookClick(listing.id);
                          }}
                          className="w-full rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
                        >
                          Book Now · {listing.price_gel}₾
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ─────────── STICKY BOTTOM CTA ─────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/50 bg-card/95 backdrop-blur-xl px-5 py-3 safe-area-pb">
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

      {lightboxIndex !== null && (
        <MediaLightbox
          items={mediaItems}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Payment & Ticket for session booking from profile */}
      {paymentListingId && (() => {
        const pl = listings.find(l => l.id === paymentListingId);
        return pl ? (
          <PaymentSheet
            open={true}
            onOpenChange={(o) => { if (!o) setPaymentListingId(null); }}
            amount={pl.price_gel}
            title={pl.title_en}
            onPaymentSuccess={handleSessionPaymentSuccess}
            loading={bookingListing}
          />
        ) : null;
      })()}

      {showTicket && ticketListing && (
        <BookingTicket
          open={showTicket}
          onClose={() => {
            setShowTicket(false);
            setTicketListing(null);
            navigate("/bookings");
          }}
          booking={{
            id: confirmedBookingId,
            title: ticketListing.title_en,
            sport: ticketListing.sport,
            date: ticketListing.scheduled_at,
            duration: ticketListing.duration_minutes,
            price: ticketListing.price_gel,
            trainerName: partner.display_name,
          }}
        />
      )}

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
