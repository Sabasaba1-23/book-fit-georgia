import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Feed Ranking Algorithm
 * 
 * Scoring weights:
 *   Interest match  → 40 pts  (sport matches a user_interest tag)
 *   Trainer rating  → 25 pts  (scaled: avg_rating / 5 * 25)
 *   Popularity      → 20 pts  (log-scaled review_count, capped)
 *   Recency         → 10 pts  (newer = higher, decays over 30 days)
 *   Freshness bonus →  5 pts  (created in last 48h)
 * 
 * Total max ≈ 100 pts per item
 */

const WEIGHTS = {
  interestMatch: 40,
  rating: 25,
  popularity: 20,
  recency: 10,
  freshness: 5,
} as const;

const RECENCY_DECAY_DAYS = 30;
const POPULARITY_CAP = 50; // review_count at which score maxes out (log-scaled)

function useUserInterests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["userInterests", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_interests")
        .select("tag")
        .eq("user_id", user.id);
      return (data ?? []).map((r) => r.tag.toLowerCase());
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

interface ScoredItem<T> {
  item: T;
  score: number;
}

interface Scorable {
  sport: string;
  partner_profiles: {
    avg_rating: number | null;
    review_count: number | null;
  };
}

interface ScorableListing extends Scorable {
  scheduled_at: string;
  created_at?: string;
}

interface ScorablePackage extends Scorable {
  created_at?: string;
}

function computeScore(
  sport: string,
  avgRating: number | null,
  reviewCount: number | null,
  referenceDate: string | undefined, // scheduled_at or created_at
  interests: string[]
): number {
  let score = 0;

  // 1. Interest match (exact sport or goal match)
  const sportLower = sport.toLowerCase();
  if (interests.length > 0 && interests.some((tag) => sportLower.includes(tag) || tag.includes(sportLower))) {
    score += WEIGHTS.interestMatch;
  }

  // 2. Trainer rating (0–25 scaled)
  const rating = avgRating ?? 0;
  score += (Math.min(rating, 5) / 5) * WEIGHTS.rating;

  // 3. Popularity via review count (log-scaled, 0–20)
  const reviews = reviewCount ?? 0;
  if (reviews > 0) {
    const logScore = Math.log(reviews + 1) / Math.log(POPULARITY_CAP + 1);
    score += Math.min(logScore, 1) * WEIGHTS.popularity;
  }

  // 4. Recency decay (0–10, newer = higher)
  if (referenceDate) {
    const now = Date.now();
    const refTime = new Date(referenceDate).getTime();
    const daysDiff = Math.max(0, (now - refTime) / (1000 * 60 * 60 * 24));
    const recencyFactor = Math.max(0, 1 - daysDiff / RECENCY_DECAY_DAYS);
    score += recencyFactor * WEIGHTS.recency;
  }

  // 5. Freshness bonus (created within last 48h)
  if (referenceDate) {
    const hoursSince = (Date.now() - new Date(referenceDate).getTime()) / (1000 * 60 * 60);
    if (hoursSince <= 48) {
      score += WEIGHTS.freshness;
    }
  }

  return score;
}

export function useFeedRanking<L extends ScorableListing, P extends ScorablePackage>(
  listings: L[],
  packages: P[]
): { rankedListings: L[]; rankedPackages: P[]; interestsLoading: boolean } {
  const { data: interests = [], isLoading: interestsLoading } = useUserInterests();

  const rankedListings = useMemo(() => {
    const scored: ScoredItem<L>[] = listings.map((l) => ({
      item: l,
      score: computeScore(
        l.sport,
        l.partner_profiles?.avg_rating,
        l.partner_profiles?.review_count,
        l.scheduled_at,
        interests
      ),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.item);
  }, [listings, interests]);

  const rankedPackages = useMemo(() => {
    const scored: ScoredItem<P>[] = packages.map((p) => ({
      item: p,
      score: computeScore(
        p.sport,
        p.partner_profiles?.avg_rating,
        p.partner_profiles?.review_count,
        p.created_at,
        interests
      ),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.item);
  }, [packages, interests]);

  return { rankedListings, rankedPackages, interestsLoading };
}
