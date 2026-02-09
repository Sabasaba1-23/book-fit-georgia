import { useBadges, useAllBadgeDefinitions } from "@/hooks/useBadges";
import { BadgeIcon } from "@/components/badges/BadgeIcon";
import { ArrowLeft, Award } from "lucide-react";

interface Props {
  partnerId: string;
  partnerType: string;
  onBack: () => void;
}

export default function PartnerBadgesScreen({ partnerId, partnerType, onBack }: Props) {
  const entityType = partnerType === "gym" ? "studio" as const : "trainer" as const;
  const { badges: earned, loading } = useBadges(entityType, partnerId);
  const allBadges = useAllBadgeDefinitions();

  const earnedKeys = new Set(earned.map((b) => b.badge_key));
  const relevantTiers = partnerType === "gym"
    ? ["trust", "performance"]
    : ["trust", "experience", "performance"];
  const unearned = allBadges.filter(
    (b) => !earnedKeys.has(b.key) && relevantTiers.includes(b.tier)
  );

  return (
    <div className="relative z-10 px-5 pt-4 pb-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-card transition-colors hover:bg-muted active:scale-95"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="text-[20px] font-semibold text-foreground">Badges & Achievements</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Earned Badges */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Earned Badges</p>
            {earned.length > 0 ? (
              <div className="space-y-2">
                {earned.map((eb) => (
                  <div
                    key={eb.badge_key}
                    className="flex items-center gap-3 rounded-2xl bg-card p-4"
                  >
                    <BadgeIcon icon={eb.badge.icon} tier={eb.badge.tier} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-foreground">{eb.badge.title}</p>
                      {eb.badge.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{eb.badge.description}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full dark:bg-emerald-950/30 dark:text-emerald-400">
                      Earned
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-card py-10 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
                  <Award className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No badges earned yet</p>
              </div>
            )}
          </div>

          {/* Available to Earn */}
          {unearned.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Available to Earn</p>
              <div className="space-y-2">
                {unearned.map((badge) => (
                  <div
                    key={badge.key}
                    className="flex items-center gap-3 rounded-2xl bg-card p-4 opacity-55"
                  >
                    <BadgeIcon icon={badge.icon} tier={badge.tier} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-foreground">{badge.title}</p>
                      {badge.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                      Locked
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Motivational footer */}
          <div className="rounded-2xl bg-primary/5 p-5 text-center">
            <p className="text-sm text-foreground/70 leading-relaxed">
              Complete sessions, verify your profile, and maintain ratings to earn badges.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
