import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import BottomNav from "@/components/BottomNav";
import BookingTicket from "@/components/BookingTicket";
import SessionConfirmationCard from "@/components/SessionConfirmationCard";
import ReviewForm from "@/components/ReviewForm";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Bell, Calendar, Clock, Ticket, MessageCircle } from "lucide-react";
import { format, isPast, isToday, isTomorrow, differenceInHours, addMinutes } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface BookingWithListing {
  id: string;
  spots: number;
  booking_status: string;
  payment_status: string;
  total_price: number;
  created_at: string;
  listing_id: string;
  stripe_payment_id: string | null;
  training_listings: {
    id: string;
    title_en: string;
    title_ka: string | null;
    sport: string;
    training_type: string;
    scheduled_at: string;
    duration_minutes: number;
    price_gel: number;
    background_image_url: string | null;
    location: string | null;
    partner_id: string;
    partner_profiles: {
      id: string;
      display_name: string;
      logo_url: string | null;
      partner_type: string;
    };
  };
}

interface CompletionRequest {
  id: string;
  booking_id: string;
  user_status: string;
  partner_status: string;
}

interface ReviewData {
  booking_id: string;
  reviewer_role: string;
  rating: number;
  review_text: string | null;
  tags: string[] | null;
}

function getTimeLabel(scheduledAt: string): { text: string; urgent: boolean } {
  const date = new Date(scheduledAt);
  const now = new Date();
  if (isPast(date)) return { text: "Completed", urgent: false };
  const hoursUntil = differenceInHours(date, now);
  if (isToday(date)) {
    if (hoursUntil <= 0) return { text: "Starting Now", urgent: true };
    if (hoursUntil <= 2) return { text: `Starting in ${hoursUntil}h`, urgent: true };
    return { text: "Today", urgent: true };
  }
  if (isTomorrow(date)) return { text: "Tomorrow", urgent: false };
  if (hoursUntil < 24 * 7) return { text: `In ${Math.ceil(hoursUntil / 24)} Days`, urgent: false };
  return { text: "Next Week", urgent: false };
}

export default function Bookings() {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingWithListing[]>([]);
  const [completionRequests, setCompletionRequests] = useState<CompletionRequest[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming" | "history">("upcoming");
  const [ticketBooking, setTicketBooking] = useState<BookingWithListing | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  async function fetchAll() {
    setLoading(true);
    const [bookingsRes, crRes, reviewsRes] = await Promise.all([
      supabase
        .from("bookings")
        .select(`
          id, spots, booking_status, payment_status, total_price, created_at, listing_id, stripe_payment_id,
          training_listings (
            id, title_en, title_ka, sport, training_type, scheduled_at,
            duration_minutes, price_gel, background_image_url, location, partner_id,
            partner_profiles ( id, display_name, logo_url, partner_type )
          )
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("completion_requests")
        .select("id, booking_id, user_status, partner_status"),
      supabase
        .from("reviews")
        .select("booking_id, reviewer_role, rating, review_text, tags")
        .eq("reviewer_id", user!.id),
    ]);

    if (bookingsRes.data) setBookings(bookingsRes.data as unknown as BookingWithListing[]);
    if (crRes.data) setCompletionRequests(crRes.data as CompletionRequest[]);
    if (reviewsRes.data) setReviews(reviewsRes.data as ReviewData[]);
    setLoading(false);
  }

  const [cancellingId, setCancellingId] = useState<string | null>(null);

  async function handleCancel(bookingId: string) {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setCancellingId(bookingId);
    const { error } = await supabase
      .from("bookings")
      .update({ booking_status: "cancelled" })
      .eq("id", bookingId);
    if (error) {
      toast({ title: "Failed to cancel booking", description: "Please try again later.", variant: "destructive" });
    } else {
      toast({ title: "Booking cancelled" });
      fetchAll();
    }
    setCancellingId(null);
  }

  async function handleChat(booking: BookingWithListing) {
    if (!user) return;
    const listing = booking.training_listings;
    const partnerId = listing.partner_id;

    const { data: partner } = await supabase
      .from("partner_profiles")
      .select("user_id")
      .eq("id", partnerId)
      .maybeSingle();

    if (!partner) {
      toast({ title: "Could not find trainer", variant: "destructive" });
      return;
    }

    const { data: existingParticipations } = await supabase
      .from("conversation_participants")
      .select("thread_id")
      .eq("user_id", user.id);

    if (existingParticipations && existingParticipations.length > 0) {
      const threadIds = existingParticipations.map((p) => p.thread_id);
      const { data: partnerParticipations } = await supabase
        .from("conversation_participants")
        .select("thread_id")
        .eq("user_id", partner.user_id)
        .in("thread_id", threadIds);

      if (partnerParticipations && partnerParticipations.length > 0) {
        const partnerThreadIds = partnerParticipations.map((p) => p.thread_id);
        const { data: existingThread } = await supabase
          .from("conversation_threads")
          .select("id")
          .in("id", partnerThreadIds)
          .eq("listing_id", listing.id)
          .maybeSingle();

        if (existingThread) {
          navigate("/messages");
          return;
        }
      }
    }

    const { data: thread, error: threadError } = await supabase
      .from("conversation_threads")
      .insert({ listing_id: listing.id })
      .select("id")
      .single();

    if (threadError || !thread) {
      toast({ title: "Failed to create chat", variant: "destructive" });
      return;
    }

    await supabase.from("conversation_participants").insert([
      { thread_id: thread.id, user_id: user.id },
      { thread_id: thread.id, user_id: partner.user_id },
    ]);

    navigate("/messages");
  }

  const upcoming = bookings.filter((b) => {
    if (b.booking_status === "cancelled") return false;
    const endTime = addMinutes(new Date(b.training_listings.scheduled_at), b.training_listings.duration_minutes);
    return !isPast(endTime);
  });

  const history = bookings.filter((b) => {
    if (b.booking_status === "cancelled") return true;
    const endTime = addMinutes(new Date(b.training_listings.scheduled_at), b.training_listings.duration_minutes);
    return isPast(endTime);
  });

  const displayBookings = tab === "upcoming" ? upcoming : history;

  const getCR = (bookingId: string) =>
    completionRequests.find((cr) => cr.booking_id === bookingId) || null;

  const getMyReview = (bookingId: string) =>
    reviews.find((r) => r.booking_id === bookingId && r.reviewer_role === "user") || null;

  return (
    <div className="relative min-h-screen bg-background pb-24">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-secondary/[0.05]" />

      <header className="relative z-40 px-5 pb-1" style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top, 1.25rem))' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 transition-transform active:scale-95"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
            <h1 className="text-2xl font-extrabold text-foreground">My Bookings</h1>
          </div>
          <button className="flex h-11 w-11 items-center justify-center rounded-full bg-muted/60 transition-transform active:scale-95">
            <Bell className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </header>

      <div className="relative z-30 px-5 py-3">
        <div className="flex rounded-2xl bg-muted/50 p-1">
          <button
            onClick={() => setTab("upcoming")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
              tab === "upcoming" ? "bg-card text-primary ios-shadow" : "text-muted-foreground"
            }`}
          >
            Upcoming
            {upcoming.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {upcoming.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
              tab === "history" ? "bg-card text-foreground ios-shadow" : "text-muted-foreground"
            }`}
          >
            History
          </button>
        </div>
      </div>

      <main className="relative z-10 mx-auto max-w-lg space-y-4 px-5 py-2">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-[1.5rem] bg-card ios-shadow p-5">
                <div className="flex items-start gap-3 mb-3">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            ))}
          </div>
        ) : displayBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Calendar className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">
              {tab === "upcoming" ? "No upcoming bookings" : "No past bookings"}
            </p>
            {tab === "upcoming" && (
              <button
                onClick={() => navigate("/")}
                className="mt-3 rounded-full bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-primary/90 active:scale-95"
              >
                Explore Trainings
              </button>
            )}
          </div>
        ) : (
          displayBookings.map((booking) => {
            const listing = booking.training_listings;
            const partner = listing.partner_profiles;
            const title = lang === "ka" && listing.title_ka ? listing.title_ka : listing.title_en;
            const scheduledDate = new Date(listing.scheduled_at);
            const endTime = addMinutes(scheduledDate, listing.duration_minutes);
            const { text: timeLabel, urgent } = getTimeLabel(listing.scheduled_at);
            const isCancelled = booking.booking_status === "cancelled";
            const isDisputed = booking.booking_status === "disputed";
            const sessionEnded = isPast(endTime) && !isCancelled;
            const isCompleted = booking.booking_status === "completed";
            const cr = getCR(booking.id);
            const myReview = getMyReview(booking.id);
            const needsConfirmation = sessionEnded && !isCompleted && !isDisputed && !isCancelled;
            const canReview = isCompleted && !myReview;

            return (
              <div
                key={booking.id}
                className={`relative overflow-hidden rounded-[1.5rem] bg-card ios-shadow transition-all ${
                  isCancelled ? "opacity-60" : ""
                }`}
              >
                {/* Status badge */}
                <div className="flex justify-end px-4 pt-3">
                  <span
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      isCancelled
                        ? "bg-destructive/10 text-destructive"
                        : isDisputed
                          ? "bg-destructive/10 text-destructive"
                          : urgent
                            ? "bg-primary/10 text-primary"
                            : isCompleted
                              ? "bg-primary/10 text-primary"
                              : sessionEnded
                                ? "bg-muted text-muted-foreground"
                                : "bg-muted text-foreground/70"
                    }`}
                  >
                    {isCancelled
                      ? "Cancelled"
                      : isDisputed
                        ? "Disputed"
                        : isCompleted
                          ? "✓ Completed"
                          : sessionEnded
                            ? "Awaiting Confirmation"
                            : (
                              <>
                                {urgent && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                                {timeLabel}
                              </>
                            )}
                  </span>
                </div>

                {/* Card body */}
                <div className="px-5 pb-2 pt-2">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar
                      className="h-12 w-12 rounded-xl border border-border/50 shrink-0 cursor-pointer"
                      onClick={() => navigate(`/partner/${partner.id}`)}
                    >
                      {partner.logo_url ? <AvatarImage src={partner.logo_url} /> : null}
                      <AvatarFallback className="rounded-xl bg-primary/10 text-sm font-bold text-primary">
                        {partner.display_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-foreground leading-tight truncate">{title}</h3>
                      <p
                        className="text-xs text-muted-foreground cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/partner/${partner.id}`)}
                      >
                        {partner.display_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-sm text-foreground/80">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {isToday(scheduledDate) ? "Today" : isTomorrow(scheduledDate) ? "Tomorrow" : format(scheduledDate, "EEE, MMM d")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-foreground/80">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(scheduledDate, "HH:mm")} - {format(endTime, "HH:mm")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confirmation card for ended sessions */}
                {needsConfirmation && (
                  <div className="px-5 pb-3">
                    <SessionConfirmationCard
                      bookingId={booking.id}
                      completionRequest={cr}
                      isPartner={false}
                      onUpdate={fetchAll}
                    />
                  </div>
                )}

                {/* Review form for completed sessions */}
                {canReview && (
                  <div className="px-5 pb-3">
                    <ReviewForm
                      bookingId={booking.id}
                      role="user"
                      onSubmitted={fetchAll}
                    />
                  </div>
                )}

                {/* Show existing review */}
                {myReview && (
                  <div className="px-5 pb-3">
                    <ReviewForm
                      bookingId={booking.id}
                      role="user"
                      existingReview={myReview}
                      onSubmitted={fetchAll}
                    />
                  </div>
                )}

                {/* Action buttons for upcoming */}
                {!isCancelled && !sessionEnded && (
                  <div className="flex gap-2.5 px-5 pb-4">
                    <button
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="flex flex-[0.3] items-center justify-center gap-1.5 rounded-full border-2 border-border bg-transparent py-2.5 text-xs font-bold text-foreground transition-all hover:border-destructive hover:text-destructive active:scale-95 disabled:opacity-50"
                    >
                      {cancellingId === booking.id ? "..." : "Cancel"}
                    </button>
                    <button
                      onClick={() => handleChat(booking)}
                      className="flex flex-[0.35] items-center justify-center gap-1.5 rounded-full border-2 border-primary/30 bg-transparent py-2.5 text-xs font-bold text-primary transition-all hover:bg-primary/5 active:scale-95"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Chat
                    </button>
                    <button
                      onClick={() => setTicketBooking(booking)}
                      className="flex flex-[0.35] items-center justify-center gap-1.5 rounded-full bg-primary py-2.5 text-xs font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
                    >
                      <Ticket className="h-3.5 w-3.5" />
                      Ticket
                    </button>
                  </div>
                )}

                {/* Completed/disputed actions */}
                {(isCompleted || isDisputed || (sessionEnded && isCancelled)) && (
                  <div className="flex gap-2.5 px-5 pb-4">
                    <button
                      onClick={() => setTicketBooking(booking)}
                      className="flex flex-[0.5] items-center justify-center gap-1.5 rounded-full border-2 border-border bg-transparent py-2.5 text-xs font-bold text-foreground transition-all hover:border-primary hover:text-primary active:scale-95"
                    >
                      <Ticket className="h-3.5 w-3.5" />
                      View Receipt
                    </button>
                    <button
                      onClick={() => navigate("/")}
                      className="flex flex-[0.5] items-center justify-center gap-1.5 rounded-full border-2 border-border bg-transparent py-2.5 text-xs font-bold text-foreground transition-all hover:border-primary hover:text-primary active:scale-95"
                    >
                      Book Again
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      {ticketBooking && (
        <BookingTicket
          open={!!ticketBooking}
          onClose={() => setTicketBooking(null)}
          booking={{
            id: ticketBooking.id,
            title: ticketBooking.training_listings.title_en,
            sport: ticketBooking.training_listings.sport,
            date: ticketBooking.training_listings.scheduled_at,
            duration: ticketBooking.training_listings.duration_minutes,
            price: ticketBooking.total_price,
            trainerName: ticketBooking.training_listings.partner_profiles.display_name,
            location: ticketBooking.training_listings.location || undefined,
            paymentId: ticketBooking.stripe_payment_id || undefined,
            bookedAt: ticketBooking.created_at,
            spots: ticketBooking.spots,
            bookingStatus: ticketBooking.booking_status,
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}
