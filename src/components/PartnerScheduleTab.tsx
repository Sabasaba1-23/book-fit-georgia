import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, Users, ChevronDown, ChevronUp, MessageCircle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isPast, isToday, isTomorrow, differenceInHours, addMinutes } from "date-fns";
import { useLanguage } from "@/i18n/LanguageContext";
import { TranslationKey } from "@/i18n/translations";

interface BookingAttendee {
  id: string;
  user_id: string;
  spots: number;
  booking_status: string;
  total_price: number;
  profile?: { full_name: string | null; avatar_url: string | null };
}

interface ScheduleListing {
  id: string;
  title_en: string;
  sport: string;
  training_type: string;
  scheduled_at: string;
  duration_minutes: number;
  price_gel: number;
  max_spots: number;
  location: string | null;
  background_image_url: string | null;
  bookings: BookingAttendee[];
}

function getTimeLabel(scheduledAt: string, durationMinutes: number): { text: string; color: string } {
  const start = new Date(scheduledAt);
  const end = addMinutes(start, durationMinutes);
  const now = new Date();

  if (isPast(end)) return { text: "Completed", color: "text-muted-foreground bg-muted" };

  const hoursUntil = differenceInHours(start, now);
  if (isPast(start) && !isPast(end)) return { text: "In Progress", color: "text-primary bg-primary/10" };
  if (isToday(start)) {
    if (hoursUntil <= 1) return { text: "Starting Soon", color: "text-destructive bg-destructive/10" };
    return { text: `Today · ${format(start, "HH:mm")}`, color: "text-primary bg-primary/10" };
  }
  if (isTomorrow(start)) return { text: `Tomorrow · ${format(start, "HH:mm")}`, color: "text-amber-600 bg-amber-50" };
  return { text: format(start, "EEE, MMM d · HH:mm"), color: "text-foreground/70 bg-muted" };
}

interface PartnerScheduleTabProps {
  partnerId: string;
}

export default function PartnerScheduleTab({ partnerId }: PartnerScheduleTabProps) {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ScheduleListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    fetchSchedule();
  }, [partnerId]);

  async function fetchSchedule() {
    setLoading(true);

    // Get all approved listings for this partner
    const { data: listings } = await supabase
      .from("training_listings")
      .select("id, title_en, sport, training_type, scheduled_at, duration_minutes, price_gel, max_spots, location, background_image_url")
      .eq("partner_id", partnerId)
      .eq("status", "approved")
      .order("scheduled_at", { ascending: true });

    if (!listings || listings.length === 0) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const listingIds = listings.map((l) => l.id);

    // Fetch all bookings for these listings
    const { data: bookings } = await supabase
      .from("bookings")
      .select("id, user_id, spots, booking_status, total_price, listing_id")
      .in("listing_id", listingIds)
      .in("booking_status", ["pending", "confirmed", "completed"]);

    // Get unique user IDs for profiles
    const userIds = [...new Set((bookings || []).map((b) => b.user_id))];
    let profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
    }

    // Assemble
    const assembled: ScheduleListing[] = listings.map((listing) => {
      const listingBookings = (bookings || [])
        .filter((b) => b.listing_id === listing.id)
        .map((b) => ({
          ...b,
          profile: profileMap.get(b.user_id),
        }));

      return { ...listing, bookings: listingBookings };
    });

    setSessions(assembled);
    setLoading(false);
  }

  const now = new Date();
  const filtered = sessions.filter((s) => {
    const end = addMinutes(new Date(s.scheduled_at), s.duration_minutes);
    return filter === "upcoming" ? !isPast(end) : isPast(end);
  });

  // Sort: upcoming asc, past desc
  const sorted = [...filtered].sort((a, b) => {
    const aTime = new Date(a.scheduled_at).getTime();
    const bTime = new Date(b.scheduled_at).getTime();
    return filter === "upcoming" ? aTime - bTime : bTime - aTime;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex rounded-2xl bg-muted/50 p-1">
        <button
          onClick={() => setFilter("upcoming")}
          className={cn(
            "flex-1 rounded-xl py-2.5 text-sm font-bold transition-all",
            filter === "upcoming" ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
          )}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter("past")}
          className={cn(
            "flex-1 rounded-xl py-2.5 text-sm font-bold transition-all",
            filter === "past" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
          )}
        >
          Past
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl bg-muted/40 py-10 text-center">
          <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {filter === "upcoming" ? "No upcoming sessions" : "No past sessions"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((session) => {
            const { text: timeLabel, color: timeLabelColor } = getTimeLabel(session.scheduled_at, session.duration_minutes);
            const activeBookings = session.bookings.filter((b) => b.booking_status !== "cancelled");
            const totalSpots = activeBookings.reduce((sum, b) => sum + b.spots, 0);
            const isExpanded = expandedId === session.id;
            const start = new Date(session.scheduled_at);
            const end = addMinutes(start, session.duration_minutes);

            return (
              <div
                key={session.id}
                className="overflow-hidden rounded-2xl border border-border/50 bg-card"
              >
                {/* Session header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/20"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", timeLabelColor)}>
                        {timeLabel}
                      </span>
                    </div>
                    <p className="text-[15px] font-bold text-foreground truncate">{session.title_en}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {format(start, "HH:mm")} – {format(end, "HH:mm")}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span className={cn("font-semibold", totalSpots > 0 ? "text-primary" : "")}>
                          {totalSpots}
                        </span>
                        /{session.max_spots}
                      </div>
                    </div>
                    {session.location && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{session.location}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-base font-bold text-primary">{Number(session.price_gel)}₾</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded attendees list */}
                {isExpanded && (
                  <div className="border-t border-border/50 bg-muted/10 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Attendees ({totalSpots})
                    </p>
                    {activeBookings.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No bookings yet</p>
                    ) : (
                      <div className="space-y-2">
                        {activeBookings.map((booking) => (
                          <div key={booking.id} className="flex items-center gap-3 rounded-xl bg-card p-3">
                            <Avatar className="h-9 w-9 border border-border/50">
                              {booking.profile?.avatar_url ? (
                                <AvatarImage src={booking.profile.avatar_url} />
                              ) : null}
                              <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                                {booking.profile?.full_name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {booking.profile?.full_name || "Anonymous"}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {booking.spots} spot{booking.spots > 1 ? "s" : ""} · {Number(booking.total_price)}₾
                              </p>
                            </div>
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                              booking.booking_status === "confirmed"
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-amber-50 text-amber-600"
                            )}>
                              {booking.booking_status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Revenue summary */}
                    {activeBookings.length > 0 && (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-primary/5 p-3">
                        <span className="text-xs font-bold text-muted-foreground uppercase">Total Revenue</span>
                        <span className="text-sm font-extrabold text-primary">
                          {activeBookings.reduce((sum, b) => sum + Number(b.total_price), 0)}₾
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
