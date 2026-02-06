import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Clock, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [expanded, setExpanded] = useState(false);

  const requireAuth = (messageKey: "loginToBook" | "loginToChat") => {
    if (!user) {
      toast({ title: t(messageKey), variant: "destructive" });
      navigate("/auth");
      return true;
    }
    return false;
  };

  const title = lang === "ka" && listing.title_ka ? listing.title_ka : listing.title_en;
  const description = lang === "ka" && listing.description_ka ? listing.description_ka : listing.description_en;
  const equipNotes = lang === "ka" && listing.equipment_notes_ka ? listing.equipment_notes_ka : listing.equipment_notes_en;
  const spotsLeft = listing.max_spots - (listing.booked_spots || 0);
  const date = new Date(listing.scheduled_at);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card transition-all duration-300",
        expanded && "ring-1 ring-primary/20"
      )}
    >
      {/* Card header with background image */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="relative w-full text-left"
      >
        <div className="relative h-40 w-full overflow-hidden bg-muted">
          {listing.background_image_url ? (
            <img
              src={listing.background_image_url}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-secondary">
              <span className="text-3xl font-bold text-muted-foreground/30">{listing.sport}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Partner avatar */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <Avatar className="h-8 w-8 border-2 border-background">
              {listing.partner.logo_url ? (
                <AvatarImage src={listing.partner.logo_url} />
              ) : null}
              <AvatarFallback className="text-xs">
                {listing.partner.display_name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-white drop-shadow">
              {listing.partner.display_name}
            </span>
          </div>

          {/* Verified badge */}
          <div className="absolute right-3 top-3">
            <Badge variant="secondary" className="gap-1 bg-background/90 text-xs">
              <CheckCircle2 className="h-3 w-3" />
              {t("verified")}
            </Badge>
          </div>
        </div>
      </button>

      {/* Card body */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-card-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground capitalize">{listing.sport}</p>
          </div>
          <span className="shrink-0 text-lg font-bold text-primary">
            {listing.price_gel} {t("gel")}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {format(date, "MMM d")}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {format(date, "HH:mm")} · {listing.duration_minutes}min
          </span>
          {listing.max_spots > 1 && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {spotsLeft} {t("spotsLeft")}
            </span>
          )}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t px-3 pb-4 pt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          {listing.partner.bio && (
            <div>
              <p className="text-xs font-medium text-foreground">{listing.partner.display_name}</p>
              <p className="text-xs text-muted-foreground">{listing.partner.bio}</p>
            </div>
          )}
          {equipNotes && (
            <p className="text-xs text-muted-foreground italic">{equipNotes}</p>
          )}
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => !requireAuth("loginToChat")}>
              {t("askQuestion")}
            </Button>
            <Button size="sm" className="flex-1" onClick={() => !requireAuth("loginToBook")}>
              {t("book")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
