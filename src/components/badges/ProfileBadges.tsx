import { BadgePill } from "./BadgePill";
import { BadgesModal } from "./BadgesModal";
import type { EntityBadge } from "@/hooks/useBadges";

interface ProfileBadgesProps {
  badges: EntityBadge[];
  name: string;
  maxVisible?: number;
}

export function ProfileBadges({ badges, name, maxVisible = 3 }: ProfileBadgesProps) {
  if (badges.length === 0) return null;

  const visible = badges.slice(0, maxVisible);
  const hasMore = badges.length > maxVisible;

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
      {visible.map((eb) => (
        <BadgePill
          key={eb.badge_key}
          title={eb.badge.title}
          icon={eb.badge.icon}
          tier={eb.badge.tier}
        />
      ))}
      {hasMore && (
        <BadgesModal badges={badges} name={name}>
          <button className="text-[11px] font-semibold text-muted-foreground hover:text-primary transition-colors px-2 py-1">
            +{badges.length - maxVisible} more
          </button>
        </BadgesModal>
      )}
    </div>
  );
}
