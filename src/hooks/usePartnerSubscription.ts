import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PartnerSubscription {
  id: string;
  plan: string;
  status: string;
  period_start: string | null;
  period_end: string | null;
}

interface UsePartnerSubscriptionResult {
  subscription: PartnerSubscription | null;
  bookingsLast30Days: number;
  isOverFreeLimit: boolean;
  isPro: boolean;
  loading: boolean;
  upgradeToPro: () => Promise<void>;
}

const FREE_BOOKING_LIMIT = 5;

export function usePartnerSubscription(partnerId: string | undefined): UsePartnerSubscriptionResult {
  const [subscription, setSubscription] = useState<PartnerSubscription | null>(null);
  const [bookingsLast30Days, setBookingsLast30Days] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!partnerId) {
      setLoading(false);
      return;
    }

    async function load() {
      // Fetch subscription and booking count in parallel
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [subRes, bookingsRes] = await Promise.all([
        supabase
          .from("partner_subscriptions")
          .select("*")
          .eq("partner_id", partnerId!)
          .maybeSingle(),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .in(
            "listing_id",
            // subquery: get listing IDs for this partner
            (await supabase
              .from("training_listings")
              .select("id")
              .eq("partner_id", partnerId!)
            ).data?.map((l) => l.id) || []
          )
          .gte("created_at", thirtyDaysAgo.toISOString())
          .in("booking_status", ["pending", "confirmed", "completed"]),
      ]);

      setSubscription(subRes.data as PartnerSubscription | null);
      setBookingsLast30Days(bookingsRes.count || 0);
      setLoading(false);
    }

    load();
  }, [partnerId]);

  const isPro = subscription?.plan === "pro" && subscription?.status === "active";
  const isOverFreeLimit = !isPro && bookingsLast30Days >= FREE_BOOKING_LIMIT;

  const upgradeToPro = async () => {
    if (!partnerId) return;

    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + 30);

    const payload = {
      partner_id: partnerId,
      plan: "pro",
      status: "active",
      period_start: now.toISOString(),
      period_end: periodEnd.toISOString(),
    };

    if (subscription) {
      await supabase
        .from("partner_subscriptions")
        .update(payload)
        .eq("id", subscription.id);
    } else {
      await supabase.from("partner_subscriptions").insert(payload);
    }

    // Refresh
    const { data } = await supabase
      .from("partner_subscriptions")
      .select("*")
      .eq("partner_id", partnerId)
      .maybeSingle();
    setSubscription(data as PartnerSubscription | null);
  };

  return { subscription, bookingsLast30Days, isOverFreeLimit, isPro, loading, upgradeToPro };
}
