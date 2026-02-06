import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, Users, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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
    partner: {
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

  const title = lang === "ka" && listing.title_ka ? listing.title_ka : listing.title_en;
  const spotsLeft = listing.max_spots - (listing.booked_spots || 0);
  const date = new Date(listing.scheduled_at);

  const handleBook = () => {
    if (!user) {
      toast({ title: t("loginToBook"), variant: "destructive" });
      navigate("/auth");
      return;
    }
    // TODO: booking flow
  };

  return (
    <div className="ios-shadow group relative overflow-hidden rounded-[1.25rem] bg-card transition-transform duration-200 active:scale-[0.98]">
      {/* Image section */}
      <div className="relative h-56 w-full overflow-hidden">
        {listing.background_image_url ? (
          <img
            src={listing.background_image_url}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/30">
            <span className="text-4xl font-bold text-primary/30">{listing.sport}</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="card-gradient-overlay absolute inset-0" />

        {/* Top bar: partner info + verified */}
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border-2 border-white/50">
              {listing.partner.logo_url ? (
                <AvatarImage src={listing.partner.logo_url} />
              ) : null}
              <AvatarFallback className="bg-white/20 text-xs text-white backdrop-blur">
                {listing.partner.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold text-white drop-shadow-md">
              {listing.partner.display_name}
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 backdrop-blur-sm">
            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            <span className="text-xs font-medium text-white">{t("verified")}</span>
          </div>
        </div>

        {/* Bottom info on image */}
        <div className="absolute bottom-4 left-4 right-4">
          {/* Sport tag + spots */}
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-primary/90 px-3 py-0.5 text-xs font-semibold text-white">
              {listing.sport}
            </span>
            {listing.max_spots > 1 && (
              <span className="flex items-center gap-1 text-xs text-white/80">
                <Users className="h-3 w-3" />
                {spotsLeft} {t("spotsLeft")}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md">{title}</h3>
        </div>
      </div>

      {/* Bottom info bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            {format(date, "EEE, MMM d")}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-primary" />
            {format(date, "hh:mm a")}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground leading-none">Starting at</p>
            <p className="text-lg font-bold text-primary leading-tight">
              {listing.price_gel}₾
            </p>
          </div>
          <button
            onClick={handleBook}
            className="rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wide text-primary-foreground transition-all duration-200 hover:shadow-lg hover:shadow-primary/25 active:scale-95"
          >
            {t("book")}
          </button>
        </div>
      </div>
    </div>
  );
}
