import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Badge {
  key: string;
  title: string;
  description: string | null;
  icon: string;
  tier: string;
  visibility_priority: number;
}

export interface EntityBadge {
  badge_key: string;
  status: string;
  source: string;
  awarded_at: string;
  badge: Badge;
}

export function useBadges(entityType: "trainer" | "studio" | "user", entityId: string | undefined) {
  const [badges, setBadges] = useState<EntityBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) {
      setLoading(false);
      return;
    }

    async function fetch() {
      const { data } = await supabase
        .from("entity_badges")
        .select("badge_key, status, source, awarded_at, badges(key, title, description, icon, tier, visibility_priority)")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .eq("status", "active");

      if (data) {
        const mapped = (data as any[]).map((eb) => ({
          badge_key: eb.badge_key,
          status: eb.status,
          source: eb.source,
          awarded_at: eb.awarded_at,
          badge: eb.badges as Badge,
        }));
        // Sort by visibility_priority descending (highest first)
        mapped.sort((a, b) => b.badge.visibility_priority - a.badge.visibility_priority);
        setBadges(mapped);
      }
      setLoading(false);
    }

    fetch();
  }, [entityType, entityId]);

  return { badges, loading };
}

export function useAllBadgeDefinitions() {
  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from("badges")
        .select("key, title, description, icon, tier, visibility_priority")
        .eq("is_active", true)
        .order("visibility_priority", { ascending: false });
      if (data) setBadges(data as Badge[]);
    }
    fetch();
  }, []);

  return badges;
}
