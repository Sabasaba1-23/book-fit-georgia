import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
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
} from "lucide-react";
import { format } from "date-fns";

// Random cover images for partners who don't have one
const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
  "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&q=80",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
  "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80",
  "https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=800&q=80",
];

const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80",
  "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80",
  "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&q=80",
  "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=400&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80",
];

const BIOS: Record<string, string[]> = {
  individual: [
    "Helping you redefine your limits. Specialist in explosive power and high-intensity hybrid training. My methodology focuses on sustainable gains through science-backed movements.",
    "Passionate about transforming lives through movement. With years of experience coaching athletes and beginners alike, I create personalized programs that deliver real results.",
    "Dedicated to making fitness accessible and fun. Whether you're training for competition or personal wellness, I'll meet you where you are and push you further.",
  ],
  gym: [
    "A premier training facility equipped with state-of-the-art equipment and expert coaches. We offer group classes, personal training, and open gym access in a motivating environment.",
    "Your neighborhood fitness hub. From high-energy group sessions to focused one-on-one coaching, our space is designed to help every member thrive.",
    "A community-driven studio blending modern training methods with a welcoming atmosphere. Join us for classes, workshops, and open training sessions.",
  ],
};

const LISTING_ICONS = [Zap, Dumbbell, Trophy];

interface PartnerData {
  id: string;
  display_name: string;
  logo_url: string | null;
  partner_type: string;
  bio: string | null;
  sports: string[] | null;
  location: string | null;
  languages: string[] | null;
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

export default function PartnerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const [partner, setPartner] = useState<PartnerData | null>(null);
  const [listings, setListings] = useState<ListingData[]>([]);
  const [loading, setLoading] = useState(true);

  // Deterministic random based on id
  const seed = id ? id.charCodeAt(0) + id.charCodeAt(id.length - 1) : 0;

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [partnerRes, listingsRes] = await Promise.all([
        supabase.from("partner_profiles").select("*").eq("id", id).single(),
        supabase
          .from("training_listings")
          .select("id, title_en, title_ka, sport, training_type, scheduled_at, duration_minutes, price_gel, max_spots, status")
          .eq("partner_id", id)
          .eq("status", "approved")
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true }),
      ]);
      if (partnerRes.data) setPartner(partnerRes.data as unknown as PartnerData);
      if (listingsRes.data) setListings(listingsRes.data as unknown as ListingData[]);
      setLoading(false);
    }
    load();
  }, [id]);

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
        <button onClick={() => navigate("/")} className="text-primary font-semibold text-sm">
          Go Home
        </button>
      </div>
    );
  }

  const coverImage = COVER_IMAGES[seed % COVER_IMAGES.length];
  const galleryImages = [0, 1, 2].map((i) => GALLERY_IMAGES[(seed + i) % GALLERY_IMAGES.length]);
  const bioPool = BIOS[partner.partner_type] || BIOS.individual;
  const bio = partner.bio || bioPool[seed % bioPool.length];
  const rating = (4.5 + (seed % 5) * 0.1).toFixed(1);
  const reviewCount = 40 + ((seed * 17) % 160);
  const yearsExp = 3 + (seed % 8);

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
      {/* Hero cover image */}
      <div className="relative h-80 w-full overflow-hidden">
        <img src={coverImage} alt={partner.display_name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Top nav */}
        <div className="absolute left-3 right-3 top-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
              <Share2 className="h-4.5 w-4.5 text-white" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
              <MoreHorizontal className="h-4.5 w-4.5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile card overlapping hero */}
      <div className="relative -mt-16 mx-4 rounded-3xl bg-card ios-shadow px-5 pt-6 pb-5">
        {/* Name + verified */}
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-extrabold text-foreground">{partner.display_name}</h1>
          <CheckCircle2 className="h-5 w-5 fill-primary text-white" />
        </div>

        {/* Subtitle */}
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3">
          {partner.partner_type === "gym" ? "Gym & Studio" : (partner.sports?.join(" & ") || "Fitness")} Specialist
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm mb-5">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="font-bold text-foreground">{rating}</span>
            <span className="text-muted-foreground text-xs">({reviewCount}+)</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Dumbbell className="h-4 w-4 text-primary" />
            <span className="font-bold text-foreground">{yearsExp} Yrs</span>
            <span className="text-xs">Exp.</span>
          </div>
          {partner.location && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-xs">{partner.location}</span>
            </div>
          )}
        </div>

        {/* About */}
        <h3 className="text-base font-bold text-foreground mb-2">About</h3>
        <p className="text-sm leading-relaxed text-foreground/75 mb-4">{bio}</p>

        {/* Book a Session button */}
        <div className="flex items-center gap-3 mb-4">
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <Bookmark className="h-5 w-5 text-primary" />
          </button>
          <button
            onClick={() => {
              // Scroll to sessions
              document.getElementById("sessions-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="relative flex-1 rounded-full bg-primary py-3.5 text-center text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            Book a Session
            <div className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-xl" />
          </button>
        </div>

        {/* Gallery */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
          {galleryImages.map((img, i) => (
            <div key={i} className="h-24 w-28 shrink-0 overflow-hidden rounded-2xl">
              <img src={img} alt="Gallery" className="h-full w-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </div>

      {/* Approved Sessions */}
      <div id="sessions-section" className="px-5 pt-6">
        <h3 className="text-lg font-bold text-foreground mb-3">Approved Sessions</h3>
        <div className="space-y-3">
          {listings.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No upcoming sessions</p>
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
                  {/* Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{title}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" /> {listing.duration_minutes} min
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Users className="h-3 w-3" /> {trainingTypeLabel(listing.training_type)}
                      </span>
                    </div>
                  </div>

                  {/* Price + next date */}
                  <div className="text-right shrink-0">
                    <p className="text-base font-extrabold text-primary">{listing.price_gel}₾</p>
                    {isLimitedSpots ? (
                      <p className="text-[9px] font-bold uppercase tracking-wider text-destructive">Limited Spots</p>
                    ) : (
                      <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                        Next: {format(nextDate, "EEE")}
                      </p>
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
