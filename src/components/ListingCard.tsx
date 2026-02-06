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
    <div className="group overflow-hidden rounded-[1.5rem] bg-card ios-shadow">
      {/* Image section */}
      <div className="relative h-64 w-full overflow-hidden">
        {listing.background_image_url ? (
          <img
            src={listing.background_image_url}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/30 to-secondary/40">
            <span className="text-4xl font-bold text-primary/40">{listing.sport}</span>
          </div>
        )}

        {/* Gradient overlay - stronger at bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Top: Partner pill (dark) + Verified badge (coral) */}
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between">
          {/* Partner pill */}
          <div className="flex items-center gap-2 rounded-full bg-foreground/70 py-1.5 pl-1.5 pr-3.5 backdrop-blur-sm">
            <Avatar className="h-7 w-7 border border-white/20">
              {listing.partner.logo_url ? (
                <AvatarImage src={listing.partner.logo_url} />
              ) : null}
              <AvatarFallback className="bg-white/20 text-[10px] font-semibold text-white">
                {listing.partner.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-white">
              {listing.partner.display_name}
            </span>
          </div>

          {/* Verified badge */}
          <div className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">
              {t("verified")}
            </span>
          </div>
        </div>

        {/* Bottom of image: sport tag, spots, title, date/time */}
        <div className="absolute bottom-3 left-4 right-4">
          {/* Sport tag + spots */}
          <div className="mb-1.5 flex items-center gap-2">
            <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              {listing.sport}
            </span>
            {listing.max_spots > 1 && (
              <span className="text-[11px] font-medium text-white/80">
                • {spotsLeft} {t("spotsLeft").toUpperCase()}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="mb-2 text-xl font-bold leading-tight text-white drop-shadow-lg">
            {title}
          </h3>

          {/* Date & Time */}
          <div className="flex items-center gap-3 text-[11px] text-white/80">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(date, "EEE, MMM d")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(date, "hh:mm a")}
            </span>
          </div>
        </div>
      </div>

      {/* White bottom bar: price + book button */}
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-[9px] font-medium uppercase tracking-widest text-muted-foreground">
            Starting at
          </p>
          <p className="text-2xl font-extrabold text-foreground leading-none">
            {listing.price_gel}₾
          </p>
        </div>

        <button
          onClick={handleBook}
          className="rounded-full border-2 border-foreground bg-transparent px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-foreground transition-all duration-200 hover:bg-foreground hover:text-background active:scale-95"
        >
          {t("book")} Now
        </button>
      </div>
    </div>
  );
}
