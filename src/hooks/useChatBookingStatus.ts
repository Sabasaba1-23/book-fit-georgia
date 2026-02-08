import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ChatBookingStatus {
  hasConfirmedBooking: boolean;
  loading: boolean;
  partnerUserId: string | null;
  partnerId: string | null;
}

/**
 * Checks whether the current user has a confirmed (paid) booking
 * with the partner on the other side of a conversation thread.
 */
export function useChatBookingStatus(threadId: string | null): ChatBookingStatus {
  const { user } = useAuth();
  const [hasConfirmedBooking, setHasConfirmedBooking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [partnerUserId, setPartnerUserId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);

  useEffect(() => {
    if (!threadId || !user) {
      setLoading(false);
      return;
    }

    async function check() {
      setLoading(true);
      try {
        // Find the other participant
        const { data: participants } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("thread_id", threadId)
          .neq("user_id", user!.id);

        if (!participants || participants.length === 0) {
          setLoading(false);
          return;
        }

        const otherUserId = participants[0].user_id;
        setPartnerUserId(otherUserId);

        // Find partner profile for the other user
        const { data: partnerProfile } = await supabase
          .from("partner_profiles")
          .select("id")
          .eq("user_id", otherUserId)
          .maybeSingle();

        if (partnerProfile) {
          setPartnerId(partnerProfile.id);
        }

        // Also check if the current user IS the partner (partner chatting with client)
        const { data: myPartnerProfile } = await supabase
          .from("partner_profiles")
          .select("id")
          .eq("user_id", user!.id)
          .maybeSingle();

        const relevantPartnerId = partnerProfile?.id || myPartnerProfile?.id;
        if (!relevantPartnerId) {
          setLoading(false);
          return;
        }

        // Check if there's a confirmed/completed booking between them
        const { data: bookings } = await supabase
          .from("bookings")
          .select("id, listing_id, booking_status, training_listings!inner(partner_id)")
          .in("booking_status", ["confirmed", "completed"])
          .eq("payment_status", "paid");

        // Filter for bookings related to this partner
        const hasBooking = (bookings || []).some((b: any) => {
          const listing = b.training_listings;
          if (!listing) return false;
          const isPartnerListing = listing.partner_id === relevantPartnerId;
          const isUserBooker = true; // RLS already filters by user
          return isPartnerListing && isUserBooker;
        });

        setHasConfirmedBooking(hasBooking);
      } catch {
        // Fail gracefully
      }
      setLoading(false);
    }

    check();
  }, [threadId, user]);

  return { hasConfirmedBooking, loading, partnerUserId, partnerId };
}
