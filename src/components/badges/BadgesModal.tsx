import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BadgeIcon } from "./BadgeIcon";
import type { EntityBadge } from "@/hooks/useBadges";
import { cn } from "@/lib/utils";

const TIER_LABELS: Record<string, string> = {
  trust: "Trust & Verification",
  experience: "Experience",
  performance: "Performance",
  loyalty: "Loyalty",
};

const TIER_ORDER = ["trust", "experience", "performance", "loyalty"];

interface BadgesModalProps {
  badges: EntityBadge[];
  name: string;
  children: React.ReactNode;
}

export function BadgesModal({ badges, name, children }: BadgesModalProps) {
  // Group by tier
  const grouped = TIER_ORDER.reduce<Record<string, EntityBadge[]>>((acc, tier) => {
    const items = badges.filter((b) => b.badge.tier === tier);
    if (items.length > 0) acc[tier] = items;
    return acc;
  }, {});

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg">{name}'s Badges</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          {Object.entries(grouped).map(([tier, items]) => (
            <div key={tier}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5">
                {TIER_LABELS[tier] || tier}
              </p>
              <div className="space-y-2">
                {items.map((eb) => (
                  <div
                    key={eb.badge_key}
                    className="flex items-start gap-3 rounded-xl bg-muted/30 border border-border/50 p-3"
                  >
                    <BadgeIcon icon={eb.badge.icon} tier={eb.badge.tier} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{eb.badge.title}</p>
                      {eb.badge.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{eb.badge.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
