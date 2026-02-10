import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3, TrendingUp, Users, Ticket, DollarSign,
  Download, Calendar, ArrowUpRight, ArrowDownRight, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from "@/components/ui/chart";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line,
  ResponsiveContainer
} from "recharts";
import * as XLSX from "xlsx";

interface BookingRow {
  id: string;
  total_price: number;
  booking_status: string;
  payment_status: string;
  created_at: string;
  spots: number;
  listing_id: string;
}

interface PartnerRow {
  id: string;
  display_name: string;
  partner_type: string;
  approved: boolean;
  created_at: string;
  avg_rating: number | null;
  review_count: number | null;
  verification_status: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  created_at: string;
}

interface ListingRow {
  id: string;
  sport: string;
  training_type: string;
  price_gel: number;
  status: string;
  created_at: string;
  partner_id: string;
}

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--destructive))",
  "hsl(var(--chart-4, 43 74% 66%))",
  "hsl(var(--chart-5, 270 50% 60%))",
];

export default function AdminReports() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const [b, p, u, l] = await Promise.all([
        supabase.from("bookings").select("id, total_price, booking_status, payment_status, created_at, spots, listing_id"),
        supabase.from("partner_profiles").select("id, display_name, partner_type, approved, created_at, avg_rating, review_count, verification_status"),
        supabase.from("profiles").select("id, full_name, created_at"),
        supabase.from("training_listings").select("id, sport, training_type, price_gel, status, created_at, partner_id"),
      ]);
      setBookings(b.data || []);
      setPartners(p.data || []);
      setUsers(u.data || []);
      setListings(l.data || []);
      setLoading(false);
    }
    fetch();
  }, []);

  // === Derived stats ===
  const stats = useMemo(() => {
    const completed = bookings.filter(b => b.booking_status === "completed");
    const cancelled = bookings.filter(b => b.booking_status === "cancelled");
    const disputed = bookings.filter(b => b.booking_status === "disputed");
    const pending = bookings.filter(b => b.booking_status === "pending");
    const confirmed = bookings.filter(b => b.booking_status === "confirmed");
    const totalRevenue = completed.reduce((s, b) => s + (b.total_price || 0), 0);
    const totalSpots = bookings.reduce((s, b) => s + (b.spots || 0), 0);
    const approvedPartners = partners.filter(p => p.approved).length;
    const verifiedPartners = partners.filter(p => p.verification_status === "approved").length;

    return {
      totalBookings: bookings.length,
      totalRevenue,
      totalSpots,
      totalPartners: partners.length,
      approvedPartners,
      verifiedPartners,
      totalUsers: users.length,
      totalListings: listings.length,
      approvedListings: listings.filter(l => l.status === "approved").length,
      completed: completed.length,
      cancelled: cancelled.length,
      disputed: disputed.length,
      pending: pending.length,
      confirmed: confirmed.length,
      avgBookingValue: completed.length > 0 ? totalRevenue / completed.length : 0,
      conversionRate: bookings.length > 0 ? ((completed.length / bookings.length) * 100) : 0,
    };
  }, [bookings, partners, users, listings]);

  // Monthly revenue chart data
  const monthlyData = useMemo(() => {
    const months: Record<string, { month: string; revenue: number; bookings: number }> = {};
    bookings.forEach(b => {
      const d = new Date(b.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en", { month: "short", year: "2-digit" });
      if (!months[key]) months[key] = { month: label, revenue: 0, bookings: 0 };
      months[key].bookings += 1;
      if (b.booking_status === "completed") months[key].revenue += b.total_price || 0;
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [bookings]);

  // Booking status pie data
  const statusPie = useMemo(() => {
    const map: Record<string, number> = {};
    bookings.forEach(b => { map[b.booking_status] = (map[b.booking_status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  // Sport distribution
  const sportData = useMemo(() => {
    const map: Record<string, number> = {};
    listings.forEach(l => { map[l.sport] = (map[l.sport] || 0) + 1; });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [listings]);

  // User growth (monthly)
  const userGrowth = useMemo(() => {
    const months: Record<string, { month: string; users: number; partners: number }> = {};
    users.forEach(u => {
      const d = new Date(u.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en", { month: "short", year: "2-digit" });
      if (!months[key]) months[key] = { month: label, users: 0, partners: 0 };
      months[key].users += 1;
    });
    partners.forEach(p => {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en", { month: "short", year: "2-digit" });
      if (!months[key]) months[key] = { month: label, users: 0, partners: 0 };
      months[key].partners += 1;
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [users, partners]);

  // === Export to Excel ===
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summary = [
      ["Fitbook Georgia — Admin Report"],
      ["Generated", new Date().toLocaleString()],
      [],
      ["Metric", "Value"],
      ["Total Bookings", stats.totalBookings],
      ["Completed", stats.completed],
      ["Cancelled", stats.cancelled],
      ["Disputed", stats.disputed],
      ["Pending", stats.pending],
      ["Confirmed", stats.confirmed],
      ["Total Revenue (GEL)", stats.totalRevenue],
      ["Avg Booking Value (GEL)", Math.round(stats.avgBookingValue)],
      ["Conversion Rate (%)", Math.round(stats.conversionRate)],
      ["Total Users", stats.totalUsers],
      ["Total Partners", stats.totalPartners],
      ["Approved Partners", stats.approvedPartners],
      ["Verified Partners", stats.verifiedPartners],
      ["Total Listings", stats.totalListings],
      ["Approved Listings", stats.approvedListings],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), "Summary");

    // Bookings sheet
    const bookingsSheet = bookings.map(b => ({
      ID: b.id,
      Status: b.booking_status,
      Payment: b.payment_status,
      Price: b.total_price,
      Spots: b.spots,
      Date: new Date(b.created_at).toLocaleDateString(),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bookingsSheet), "Bookings");

    // Partners sheet
    const partnersSheet = partners.map(p => ({
      ID: p.id,
      Name: p.display_name,
      Type: p.partner_type,
      Approved: p.approved ? "Yes" : "No",
      Verified: p.verification_status,
      Rating: p.avg_rating ?? "N/A",
      Reviews: p.review_count ?? 0,
      Joined: new Date(p.created_at).toLocaleDateString(),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(partnersSheet), "Partners");

    // Listings sheet
    const listingsSheet = listings.map(l => ({
      ID: l.id,
      Sport: l.sport,
      Type: l.training_type,
      Price: l.price_gel,
      Status: l.status,
      Created: new Date(l.created_at).toLocaleDateString(),
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(listingsSheet), "Listings");

    // Monthly revenue sheet
    const monthlySheet = monthlyData.map(m => ({
      Month: m.month,
      Revenue: m.revenue,
      Bookings: m.bookings,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(monthlySheet), "Monthly");

    XLSX.writeFile(wb, `fitbook-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const kpiCards = [
    { label: "Revenue", value: `₾${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, sub: `Avg ₾${Math.round(stats.avgBookingValue)}` },
    { label: "Bookings", value: stats.totalBookings, icon: Ticket, sub: `${Math.round(stats.conversionRate)}% completed` },
    { label: "Users", value: stats.totalUsers, icon: Users, sub: `${stats.totalPartners} partners` },
    { label: "Listings", value: stats.totalListings, icon: Activity, sub: `${stats.approvedListings} approved` },
  ];

  const chartConfig = {
    revenue: { label: "Revenue", color: "hsl(var(--primary))" },
    bookings: { label: "Bookings", color: "hsl(var(--chart-2, 160 60% 45%))" },
    users: { label: "Users", color: "hsl(var(--primary))" },
    partners: { label: "Partners", color: "hsl(var(--chart-2, 160 60% 45%))" },
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time platform statistics</p>
        </div>
        <Button onClick={exportToExcel} size="sm" className="gap-1.5 rounded-xl">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        {kpiCards.map(card => (
          <div key={card.label} className="rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <card.icon className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Booking Status Breakdown */}
      <div className="rounded-2xl border border-border/50 bg-card p-4">
        <h2 className="text-sm font-bold text-foreground mb-3">Booking Status</h2>
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { label: "Pending", val: stats.pending, cls: "text-muted-foreground" },
            { label: "Confirmed", val: stats.confirmed, cls: "text-blue-500" },
            { label: "Done", val: stats.completed, cls: "text-emerald-500" },
            { label: "Cancelled", val: stats.cancelled, cls: "text-destructive" },
            { label: "Disputed", val: stats.disputed, cls: "text-yellow-500" },
          ].map(s => (
            <div key={s.label}>
              <p className={`text-lg font-bold ${s.cls}`}>{s.val}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Revenue & Bookings Chart */}
      {monthlyData.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <h2 className="text-sm font-bold text-foreground mb-3">Monthly Revenue & Bookings</h2>
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <BarChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      )}

      {/* User & Partner Growth */}
      {userGrowth.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <h2 className="text-sm font-bold text-foreground mb-3">User & Partner Growth</h2>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <LineChart data={userGrowth} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="users" stroke="var(--color-users)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="partners" stroke="var(--color-partners)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>
      )}

      {/* Booking Status Pie + Sport Distribution side by side */}
      <div className="grid grid-cols-2 gap-3">
        {/* Pie */}
        {statusPie.length > 0 && (
          <div className="rounded-2xl border border-border/50 bg-card p-4">
            <h2 className="text-xs font-bold text-foreground mb-2">Status Split</h2>
            <div className="h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                    {statusPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 space-y-0.5">
              {statusPie.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5 text-[10px]">
                  <div className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-muted-foreground capitalize">{s.name}</span>
                  <span className="ml-auto font-medium text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Sports */}
        {sportData.length > 0 && (
          <div className="rounded-2xl border border-border/50 bg-card p-4">
            <h2 className="text-xs font-bold text-foreground mb-2">Top Sports</h2>
            <div className="space-y-2 mt-1">
              {sportData.map((s, i) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground capitalize truncate max-w-[80px]">{s.name}</span>
                    <span className="font-medium text-foreground">{s.value}</span>
                  </div>
                  <div className="mt-0.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(s.value / (sportData[0]?.value || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Partners Overview */}
      <div className="rounded-2xl border border-border/50 bg-card p-4">
        <h2 className="text-sm font-bold text-foreground mb-3">Partner Overview</h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-lg font-bold text-foreground">{stats.totalPartners}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div>
            <p className="text-lg font-bold text-emerald-500">{stats.approvedPartners}</p>
            <p className="text-[10px] text-muted-foreground">Approved</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">{stats.verifiedPartners}</p>
            <p className="text-[10px] text-muted-foreground">Verified</p>
          </div>
        </div>
      </div>

      {/* Top Partners by Reviews */}
      {partners.filter(p => (p.review_count || 0) > 0).length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card p-4">
          <h2 className="text-sm font-bold text-foreground mb-3">Top Rated Partners</h2>
          <div className="space-y-2">
            {partners
              .filter(p => (p.review_count || 0) > 0)
              .sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0))
              .slice(0, 5)
              .map((p, i) => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.display_name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.review_count} reviews</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-primary">★ {(p.avg_rating || 0).toFixed(1)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      <p className="text-center text-[10px] text-muted-foreground pb-2">
        Data as of {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
