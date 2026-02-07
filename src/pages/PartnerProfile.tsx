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
  Shield,
  Heart,
  Award,
  Target,
  Flame,
} from "lucide-react";
import { format } from "date-fns";

const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
  "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&q=80",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
  "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&q=80",
  "https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=800&q=80",
  "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=800&q=80",
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
];

const AVATAR_IMAGES = [
  "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=200&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80",
];

const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&q=80",
  "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&q=80",
  "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=400&q=80",
  "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=400&q=80",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80",
  "https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=400&q=80",
  "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=400&q=80",
  "https://images.unsplash.com/photo-1550345332-09e3ac987658?w=400&q=80",
  "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=400&q=80",
];

const BIOS: Record<string, string[]> = {
  individual: [
    "Helping you redefine your limits. Specialist in explosive power and high-intensity hybrid training. My methodology focuses on sustainable gains through science-backed movements.",
    "Passionate about transforming lives through movement. With years of experience coaching athletes and beginners alike, I create personalized programs that deliver real results.",
    "Dedicated to making fitness accessible and fun. Whether you're training for competition or personal wellness, I'll meet you where you are and push you further.",
    "Former national athlete turned coach. I bring competition-level discipline to everyday training, helping clients unlock potential they never knew they had.",
  ],
  gym: [
    "A premier training facility equipped with state-of-the-art equipment and expert coaches. We offer group classes, personal training, and open gym access in a motivating environment.",
    "Your neighborhood fitness hub. From high-energy group sessions to focused one-on-one coaching, our space is designed to help every member thrive.",
    "A community-driven studio blending modern training methods with a welcoming atmosphere. Join us for classes, workshops, and open training sessions.",
  ],
};

const CERTIFICATIONS = [
  "NASM Certified", "ACE Personal Trainer", "CrossFit L2", "ISSA Specialist",
  "Precision Nutrition L1", "TRX Certified", "Kettlebell Athletics", "Olympic Lifting Coach",
  "Yoga Alliance RYT-200", "First Aid & CPR",
];

const SPECIALTIES = [
  "Weight Loss", "Muscle Building", "Athletic Performance", "Injury Rehabilitation",
  "Flexibility & Mobility", "Competition Prep", "Prenatal Fitness", "Senior Fitness",
  "HIIT Programming", "Functional Training", "Combat Sports", "Endurance Coaching",
];

const LOCATIONS = [
  "Vake, Tbilisi", "Saburtalo, Tbilisi", "Old Tbilisi", "Vera, Tbilisi",
  "Didube, Tbilisi", "Gldani, Tbilisi", "Mtatsminda, Tbilisi",
];

const LISTING_ICONS = [Zap, Dumbbell, Trophy, Flame, Target];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 12345) % 2147483647;
    return s / 2147483647;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pickN<T>(arr: T[], n: number, rand: () => number): T[] {
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return shuffled.slice(0, n);
}

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

  const seed = id ? [...id].reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  const rand = seededRandom(seed);

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

  const coverImage = pick(COVER_IMAGES, rand);
  const avatarImage = partner.logo_url || pick(AVATAR_IMAGES, rand);
  const galleryImages = pickN(GALLERY_IMAGES, 5, rand);
  const bioPool = BIOS[partner.partner_type] || BIOS.individual;
  const bio = partner.bio || pick(bioPool, rand);
  const rating = (4.3 + rand() * 0.7).toFixed(1);
  const reviewCount = Math.floor(30 + rand() * 200);
  const yearsExp = Math.floor(2 + rand() * 12);
  const clientsTrained = Math.floor(50 + rand() * 500);
  const sessionsCompleted = Math.floor(200 + rand() * 2000);
  const certs = pickN(CERTIFICATIONS, Math.floor(2 + rand() * 3), rand);
  const specialties = pickN(SPECIALTIES, Math.floor(3 + rand() * 3), rand);
  const location = partner.location || pick(LOCATIONS, rand);

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
      {/* Hero cover */}
      <div className="relative h-80 w-full overflow-hidden">
        <img src={coverImage} alt={partner.display_name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />

        <div className="absolute left-3 right-3 top-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-colors hover:bg-black/50"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </button>
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
              <Share2 className="h-4 w-4 text-white" />
            </button>
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm">
              <MoreHorizontal className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>

        {/* Avatar floating at bottom of hero */}
        <div className="absolute -bottom-12 left-5">
          <Avatar className="h-24 w-24 border-4 border-card shadow-xl">
            <AvatarImage src={avatarImage} />
            <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
              {partner.display_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Profile info card */}
      <div className="relative pt-16 px-5">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-extrabold text-foreground">{partner.display_name}</h1>
          <CheckCircle2 className="h-5 w-5 fill-primary text-white" />
        </div>

        <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-4">
          {partner.partner_type === "gym" ? "Gym & Studio" : (partner.sports?.join(" & ") || "Fitness")} Specialist
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[
            { icon: Star, label: "Rating", value: rating, accent: true },
            { icon: Dumbbell, label: "Years", value: `${yearsExp}+` },
            { icon: Users, label: "Clients", value: `${clientsTrained}+` },
            { icon: Trophy, label: "Sessions", value: `${sessionsCompleted}+` },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center rounded-2xl bg-muted/50 py-3 px-2">
              <stat.icon className={`h-4 w-4 mb-1 ${stat.accent ? "fill-primary text-primary" : "text-primary"}`} />
              <span className="text-base font-extrabold text-foreground">{stat.value}</span>
              <span className="text-[10px] text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-5">
          <MapPin className="h-4 w-4 text-primary" />
          <span>{location}</span>
          {partner.languages && partner.languages.length > 0 && (
            <>
              <span className="mx-1">•</span>
              <span>{partner.languages.join(", ")}</span>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mb-6">
          <button className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 shrink-0 transition-colors hover:bg-muted">
            <Bookmark className="h-5 w-5 text-primary" />
          </button>
          <button
            onClick={() => document.getElementById("sessions-section")?.scrollIntoView({ behavior: "smooth" })}
            className="relative flex-1 rounded-full bg-primary py-3.5 text-center text-sm font-bold uppercase tracking-wider text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            Book a Session
            <div className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-xl" />
          </button>
        </div>

        {/* About */}
        <div className="mb-6">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">About</h3>
          <p className="text-[15px] leading-[1.7] text-foreground/80">{bio}</p>
        </div>

        {/* Gallery */}
        <div className="mb-6">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Gallery</h3>
          <div className="flex gap-2.5 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
            {galleryImages.map((img, i) => (
              <div key={i} className="h-32 w-36 shrink-0 overflow-hidden rounded-2xl ios-shadow">
                <img src={img} alt="Gallery" className="h-full w-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        {/* Specialties */}
        <div className="mb-6">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Specialties</h3>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s) => (
              <div key={s} className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-2">
                <Target className="h-3.5 w-3.5 text-primary" />
                <span className="text-[12px] font-semibold text-foreground">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="mb-6">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Certifications</h3>
          <div className="space-y-2">
            {certs.map((c) => (
              <div key={c} className="flex items-center gap-2.5 rounded-xl bg-muted/40 px-4 py-3">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-[13px] font-semibold text-foreground">{c}</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-primary ml-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Reviews preview */}
        <div className="mb-6">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Reviews</h3>
          <div className="space-y-3">
            {[
              { name: "Ana M.", text: "Incredible energy and very professional. Every session feels tailored just for me!", stars: 5 },
              { name: "Giorgi K.", text: "Best trainer I've ever worked with. Results speak for themselves. Highly recommended!", stars: 5 },
              { name: "Nino T.", text: "Great atmosphere and motivating coaching style. I always leave feeling accomplished.", stars: 4 },
            ].map((review, i) => (
              <div key={i} className="rounded-2xl bg-muted/40 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={AVATAR_IMAGES[(seed + i + 3) % AVATAR_IMAGES.length]} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{review.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-foreground">{review.name}</p>
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.stars }).map((_, si) => (
                        <Star key={si} className="h-3 w-3 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-foreground/70 italic">"{review.text}"</p>
              </div>
            ))}
          </div>
        </div>
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
                      <span className="flex items-center gap-0.5">
                        <Calendar className="h-3 w-3" /> {format(nextDate, "MMM d")}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" /> {listing.duration_minutes} min
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Users className="h-3 w-3" /> {trainingTypeLabel(listing.training_type)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-extrabold text-primary">{listing.price_gel}₾</p>
                    {isLimitedSpots ? (
                      <p className="text-[9px] font-bold uppercase tracking-wider text-destructive">Limited</p>
                    ) : (
                      <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                        {format(nextDate, "hh:mm a")}
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
