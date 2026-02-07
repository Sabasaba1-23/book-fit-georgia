import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Package, Clock, Users, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

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

  // Calculate savings vs buying single sessions
  const fullPrice = pkg.price_per_session_gel * pkg.sessions_count;
  const savings = fullPrice - pkg.total_price_gel;
  const savingsPercent = Math.round((savings / fullPrice) * 100);

  return (
    <div className="group overflow-hidden rounded-[1.5rem] ios-shadow">
      <div className="relative w-full overflow-hidden" style={{ minHeight: "220px" }}>
        {pkg.background_image_url ? (
          <img src={pkg.background_image_url} alt={title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-secondary/40 to-primary/30">
            <Package className="h-12 w-12 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 card-gradient-overlay" />

        {/* Top badges */}
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
          <div
            className="flex items-center gap-2 rounded-full bg-foreground/70 py-1.5 pl-1.5 pr-3.5 backdrop-blur-sm cursor-pointer"
            onClick={() => navigate(`/partner/${pkg.partner_profiles.id}`)}
          >
            <Avatar className="h-6 w-6 border border-white/20">
              {pkg.partner_profiles.logo_url ? <AvatarImage src={pkg.partner_profiles.logo_url} /> : null}
              <AvatarFallback className="bg-white/20 text-[9px] font-semibold text-white">
                {pkg.partner_profiles.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-white">{pkg.partner_profiles.display_name}</span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-accent px-3 py-1.5">
            <Package className="h-3.5 w-3.5 text-accent-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
              {pkg.sessions_count} Sessions
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex flex-col justify-end p-4" style={{ minHeight: "220px" }}>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              {pkg.sport}
            </span>
            {savingsPercent > 0 && (
              <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase text-accent-foreground">
                Save {savingsPercent}%
              </span>
            )}
          </div>

          <h3 className="mb-2 text-lg font-extrabold leading-tight text-white drop-shadow-lg">{title}</h3>

          <div className="mb-3 flex items-center gap-3 text-[11px] text-white/80">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {pkg.duration_minutes} min/session
            </span>
            {pkg.max_spots > 1 && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Up to {pkg.max_spots}
              </span>
            )}
          </div>

          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-widest text-white/60">Package Price</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-extrabold text-white leading-none">{pkg.total_price_gel}₾</p>
                {savings > 0 && (
                  <p className="text-sm text-white/50 line-through">{fullPrice}₾</p>
                )}
              </div>
              <p className="text-[10px] text-white/70 mt-0.5">{pkg.price_per_session_gel}₾ per session</p>
            </div>
            <button className="rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition-all active:scale-95 ios-shadow">
              {t("book")} Package
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
