import { useBadges, useAllBadgeDefinitions, type EntityBadge, type Badge } from "@/hooks/useBadges";
import { BadgeIcon } from "@/components/badges/BadgeIcon";
import { cn } from "@/lib/utils";

interface Props {
  partnerId: string;
  partnerType: string;
}

export default function PartnerBadgesSection({ partnerId, partnerType }: Props) {
  const entityType = partnerType === "gym" ? "studio" as const : "trainer" as const;
  const { badges: earned, loading } = useBadges(entityType, partnerId);
  const allBadges = useAllBadgeDefinitions();

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const earnedKeys = new Set(earned.map((b) => b.badge_key));

  // Filter relevant badges based on entity type
  const relevantTiers = partnerType === "gym"
    ? ["trust", "performance"]
    : ["trust", "experience", "performance"];

  const unearned = allBadges.filter(
    (b) => !earnedKeys.has(b.key) && relevantTiers.includes(b.tier)
  );

  return (
    <div className="relative z-10 px-5 pt-4 space-y-6 pb-8">
      <h2 className="text-lg font-extrabold text-foreground">Your Badges</h2>

      {/* Earned badges */}
      {earned.length > 0 ? (
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Earned</p>
          {earned.map((eb) => (
            <div
              key={eb.badge_key}
              className="flex items-center gap-3 rounded-2xl bg-card border border-border/50 p-4"
            >
              <BadgeIcon icon={eb.badge.icon} tier={eb.badge.tier} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{eb.badge.title}</p>
                {eb.badge.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{eb.badge.description}</p>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-950/30 dark:text-emerald-400">
                Earned
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border py-8 text-center">
          <BadgeIcon icon="award" tier="trust" size="md" className="mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No badges earned yet</p>
          <p className="text-xs text-muted-foreground mt-1">Complete sessions and verify your profile to earn badges</p>
        </div>
      )}

      {/* Locked / available badges */}
      {unearned.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Available to Earn</p>
          {unearned.map((badge) => (
            <div
              key={badge.key}
              className="flex items-center gap-3 rounded-2xl bg-card border border-border/50 p-4 opacity-60"
            >
              <BadgeIcon icon={badge.icon} tier={badge.tier} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{badge.title}</p>
                {badge.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Locked
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
