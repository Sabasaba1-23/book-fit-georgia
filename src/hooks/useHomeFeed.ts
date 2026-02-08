import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ListingWithPartner {
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
  partner_id: string;
  location: string | null;
  partner_profiles: {
    id: string;
    display_name: string;
    logo_url: string | null;
    partner_type: string;
    bio: string | null;
    avg_rating: number | null;
    review_count: number | null;
  };
}

export interface PackageWithPartner {
  id: string;
  title_en: string;
  title_ka: string | null;
  sport: string;
  training_type: string;
  sessions_count: number;
  price_per_session_gel: number;
  total_price_gel: number;
  duration_minutes: number;
  max_spots: number;
  background_image_url: string | null;
  location: string | null;
  partner_profiles: {
    id: string;
    display_name: string;
    logo_url: string | null;
    partner_type: string;
    avg_rating: number | null;
    review_count: number | null;
  };
}

async function fetchFeed() {
  const now = new Date().toISOString();
  const [listingsRes, packagesRes] = await Promise.all([
    supabase
      .from("training_listings")
      .select("*, partner_profiles(id, display_name, logo_url, partner_type, bio, avg_rating, review_count)")
      .eq("status", "approved")
      .gte("scheduled_at", now)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("training_packages")
      .select("*, partner_profiles(id, display_name, logo_url, partner_type, avg_rating, review_count)")
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  ]);

  return {
    listings: (listingsRes.data ?? []) as unknown as ListingWithPartner[],
    packages: (packagesRes.data ?? []) as unknown as PackageWithPartner[],
  };
}

export function useHomeFeed() {
  return useQuery({
    queryKey: ["home-feed"],
    queryFn: fetchFeed,
    staleTime: 3 * 60 * 1000, // 3 min
  });
}
