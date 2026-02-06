import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Users, Clock, CheckCircle2 } from "lucide-react";

interface Stats {
  totalListings: number;
  pendingListings: number;
  approvedListings: number;
  totalPartners: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalListings: 0,
    pendingListings: 0,
    approvedListings: 0,
    totalPartners: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      const [listings, pending, approved, partners] = await Promise.all([
        supabase.from("training_listings").select("id", { count: "exact", head: true }),
        supabase.from("training_listings").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("training_listings").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("partner_profiles").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        totalListings: listings.count ?? 0,
        pendingListings: pending.count ?? 0,
        approvedListings: approved.count ?? 0,
        totalPartners: partners.count ?? 0,
      });
    }
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Listings", value: stats.totalListings, icon: ClipboardList, color: "text-primary" },
    { label: "Pending Review", value: stats.pendingListings, icon: Clock, color: "text-accent-foreground" },
    { label: "Approved", value: stats.approvedListings, icon: CheckCircle2, color: "text-primary" },
    { label: "Partners", value: stats.totalPartners, icon: Users, color: "text-foreground" },
  ];

  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-bold text-foreground">Dashboard</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={cn("h-5 w-5", color)} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
