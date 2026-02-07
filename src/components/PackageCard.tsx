import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Package, Clock, Users, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

// Stock images mapped by sport for packages without a background
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

interface PackageCardProps {
  pkg: {
    id: string;
    title_en: string;
    title_ka: string | null;
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
    };
  };
}

export default function PackageCard({ pkg }: PackageCardProps) {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const title = lang === "ka" && pkg.title_ka ? pkg.title_ka : pkg.title_en;

  const fullPrice = pkg.price_per_session_gel * pkg.sessions_count;
  const savings = fullPrice - pkg.total_price_gel;
  const savingsPercent = Math.round((savings / fullPrice) * 100);

  const imageUrl = pkg.background_image_url || SPORT_IMAGES[pkg.sport] || SPORT_IMAGES["Personal Trainer"];

  return (
    <div className="group overflow-hidden rounded-[1.75rem] ios-shadow">
      <div className="relative w-full overflow-hidden" style={{ minHeight: "420px" }}>
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
            onClick={() => navigate(`/partner/${pkg.partner_profiles.id}`)}
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
              <Clock className="h-4 w-4 text-secondary" />
              {pkg.duration_minutes} min/session
            </span>
            {pkg.max_spots > 1 && (
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-accent" />
                Up to {pkg.max_spots}
              </span>
            )}
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
              <p className="text-[12px] text-white/70 mt-0.5">{pkg.price_per_session_gel}₾ per session</p>
            </div>
            <button className="rounded-full bg-primary px-6 py-3 text-[13px] font-semibold uppercase tracking-wider text-primary-foreground transition-all duration-200 hover:bg-primary/90 active:scale-95 shadow-lg">
              {t("book")} Package
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
