import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ChevronLeft, Search, Ticket, CreditCard, Hash, Calendar, Clock, User, MapPin, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import BookingTicket from "@/components/BookingTicket";

interface AdminBooking {
  id: string;
  spots: number;
  booking_status: string;
  payment_status: string;
  total_price: number;
  created_at: string;
  stripe_payment_id: string | null;
  user_id: string;
  training_listings: {
    id: string;
    title_en: string;
    sport: string;
    scheduled_at: string;
    duration_minutes: number;
    location: string | null;
    partner_profiles: {
      id: string;
      display_name: string;
      logo_url: string | null;
    };
  };
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  confirmed: { bg: "bg-emerald-50", text: "text-emerald-600" },
  pending: { bg: "bg-amber-50", text: "text-amber-600" },
  cancelled: { bg: "bg-red-50", text: "text-red-500" },
  completed: { bg: "bg-muted", text: "text-muted-foreground" },
};

const PAYMENT_COLORS: Record<string, { bg: string; text: string }> = {
  paid: { bg: "bg-emerald-50", text: "text-emerald-600" },
  pending: { bg: "bg-amber-50", text: "text-amber-600" },
  refunded: { bg: "bg-blue-50", text: "text-blue-600" },
  failed: { bg: "bg-red-50", text: "text-red-500" },
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [ticketBooking, setTicketBooking] = useState<AdminBooking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select(`
        id, spots, booking_status, payment_status, total_price, created_at, stripe_payment_id, user_id,
        training_listings (
          id, title_en, sport, scheduled_at, duration_minutes, location,
          partner_profiles ( id, display_name, logo_url )
        )
      `)
      .order("created_at", { ascending: false });

    if (data) {
      // Fetch user profiles for each booking
      const userIds = [...new Set(data.map((b: any) => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, p])
      );

      const enriched = data.map((b: any) => ({
        ...b,
        profiles: profileMap.get(b.user_id) || null,
      }));

      setBookings(enriched as unknown as AdminBooking[]);
    }
    setLoading(false);
  }

  const filtered = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.id.toLowerCase().includes(q) ||
      b.training_listings?.title_en?.toLowerCase().includes(q) ||
      b.training_listings?.partner_profiles?.display_name?.toLowerCase().includes(q) ||
      b.profiles?.full_name?.toLowerCase().includes(q) ||
      b.stripe_payment_id?.toLowerCase().includes(q)
    );
  });

  const totalRevenue = bookings
    .filter((b) => b.payment_status === "paid")
    .reduce((sum, b) => sum + Number(b.total_price), 0);

  return (
    <div className="px-5 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => window.history.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
        >
          <ChevronLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-extrabold text-foreground">Booking Receipts</h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl bg-emerald-50 py-3 text-center">
          <p className="text-xl font-extrabold text-emerald-600">{bookings.filter((b) => b.payment_status === "paid").length}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70">Paid</p>
        </div>
        <div className="rounded-2xl bg-amber-50 py-3 text-center">
          <p className="text-xl font-extrabold text-amber-600">{bookings.filter((b) => b.booking_status === "pending").length}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600/70">Pending</p>
        </div>
        <div className="rounded-2xl bg-primary/10 py-3 text-center">
          <p className="text-xl font-extrabold text-primary">{totalRevenue}₾</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary/70">Revenue</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by user, listing, or payment ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 rounded-2xl border-0 bg-muted/50 pl-11 text-sm font-medium shadow-none"
        />
      </div>

      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
        {filtered.length} Booking{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Bookings list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-muted/30 py-12 text-center">
          <p className="text-sm text-muted-foreground">No bookings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => {
            const listing = booking.training_listings;
            const partner = listing?.partner_profiles;
            const statusStyle = STATUS_COLORS[booking.booking_status] || STATUS_COLORS.pending;
            const paymentStyle = PAYMENT_COLORS[booking.payment_status] || PAYMENT_COLORS.pending;

            return (
              <div
                key={booking.id}
                className="rounded-2xl border border-border/50 bg-card p-4 ios-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-foreground truncate">
                      {listing?.title_en || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      by {partner?.display_name || "Unknown"}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", statusStyle.bg, statusStyle.text)}>
                      {booking.booking_status}
                    </span>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider", paymentStyle.bg, paymentStyle.text)}>
                      {booking.payment_status}
                    </span>
                  </div>
                </div>

                {/* User info */}
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {booking.profiles?.full_name || `User ${booking.user_id.slice(0, 8)}`}
                  </span>
                </div>

                {/* Details row */}
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {listing?.scheduled_at ? format(new Date(listing.scheduled_at), "MMM d, HH:mm") : "N/A"}
                  </span>
                  <span className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    {Number(booking.total_price)}₾
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {booking.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>

                {/* View Receipt button */}
                <button
                  onClick={() => setTicketBooking(booking)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all active:scale-95"
                >
                  <Receipt className="h-4 w-4" />
                  View Receipt
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket modal */}
      {ticketBooking && (
        <BookingTicket
          open={!!ticketBooking}
          onClose={() => setTicketBooking(null)}
          booking={{
            id: ticketBooking.id,
            title: ticketBooking.training_listings?.title_en || "Session",
            sport: ticketBooking.training_listings?.sport || "",
            date: ticketBooking.training_listings?.scheduled_at || ticketBooking.created_at,
            duration: ticketBooking.training_listings?.duration_minutes || 60,
            price: Number(ticketBooking.total_price),
            trainerName: ticketBooking.training_listings?.partner_profiles?.display_name || "Trainer",
            location: ticketBooking.training_listings?.location || undefined,
            paymentId: ticketBooking.stripe_payment_id || undefined,
            bookedAt: ticketBooking.created_at,
            spots: ticketBooking.spots,
            bookingStatus: ticketBooking.booking_status,
          }}
        />
      )}
    </div>
  );
}
