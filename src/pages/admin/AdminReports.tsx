import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, Users, Ticket, DollarSign } from "lucide-react";

interface Stats {
  totalBookings: number;
  totalRevenue: number;
  totalPartners: number;
  totalUsers: number;
  completedBookings: number;
  cancelledBookings: number;
  disputedBookings: number;
}

export default function AdminReports() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [bookings, partners, users] = await Promise.all([
        supabase.from("bookings").select("total_price, booking_status"),
        supabase.from("partner_profiles").select("id"),
        supabase.from("profiles").select("id"),
      ]);

      const allBookings = bookings.data || [];
      setStats({
        totalBookings: allBookings.length,
        totalRevenue: allBookings
          .filter((b) => b.booking_status === "completed")
          .reduce((sum, b) => sum + (b.total_price || 0), 0),
        totalPartners: partners.data?.length || 0,
        totalUsers: users.data?.length || 0,
        completedBookings: allBookings.filter((b) => b.booking_status === "completed").length,
        cancelledBookings: allBookings.filter((b) => b.booking_status === "cancelled").length,
        disputedBookings: allBookings.filter((b) => b.booking_status === "disputed").length,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const cards = [
    { label: "Total Bookings", value: stats?.totalBookings ?? 0, icon: Ticket, color: "text-blue-500" },
    { label: "Revenue (GEL)", value: `₾${stats?.totalRevenue?.toFixed(0) ?? 0}`, icon: DollarSign, color: "text-green-500" },
    { label: "Partners", value: stats?.totalPartners ?? 0, icon: Users, color: "text-purple-500" },
    { label: "Users", value: stats?.totalUsers ?? 0, icon: Users, color: "text-orange-500" },
    { label: "Completed", value: stats?.completedBookings ?? 0, icon: TrendingUp, color: "text-emerald-500" },
    { label: "Cancelled", value: stats?.cancelledBookings ?? 0, icon: BarChart3, color: "text-red-500" },
    { label: "Disputed", value: stats?.disputedBookings ?? 0, icon: BarChart3, color: "text-yellow-500" },
  ];

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-lg font-bold text-foreground mb-4">Reports</h1>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border/50 bg-card p-4 space-y-1"
          >
            <div className="flex items-center gap-2">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
