import { useMemo } from "react";
import {
  Flame, Zap, Trophy, Star, Heart, Award,
  Building2, Clock, Repeat, Target, Crown, Gem,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Stats {
  sessions: number;
  studios: number;
  hours: number;
}

interface AchievementDef {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  tier: "bronze" | "silver" | "gold" | "platinum";
  category: "sessions" | "studios" | "hours";
  threshold: number;
}

const ACHIEVEMENTS: AchievementDef[] = [
  // Sessions
  { key: "first_step", label: "First Step", description: "Complete your first session", icon: Zap, tier: "bronze", category: "sessions", threshold: 1 },
  { key: "getting_started", label: "Getting Started", description: "Complete 5 sessions", icon: Flame, tier: "silver", category: "sessions", threshold: 5 },
  { key: "dedicated", label: "Dedicated", description: "Complete 15 sessions", icon: Trophy, tier: "gold", category: "sessions", threshold: 15 },
  { key: "unstoppable", label: "Unstoppable", description: "Complete 50 sessions", icon: Crown, tier: "platinum", category: "sessions", threshold: 50 },
  // Studios
  { key: "explorer", label: "Explorer", description: "Visit 1 studio", icon: Building2, tier: "bronze", category: "studios", threshold: 1 },
  { key: "adventurer", label: "Adventurer", description: "Visit 3 different studios", icon: Target, tier: "silver", category: "studios", threshold: 3 },
  { key: "wanderer", label: "Wanderer", description: "Visit 7 different studios", icon: Star, tier: "gold", category: "studios", threshold: 7 },
  // Hours
  { key: "warm_up", label: "Warm Up", description: "Train for 1 hour", icon: Clock, tier: "bronze", category: "hours", threshold: 1 },
  { key: "committed", label: "Committed", description: "Train for 10 hours", icon: Heart, tier: "silver", category: "hours", threshold: 10 },
  { key: "powerhouse", label: "Powerhouse", description: "Train for 50 hours", icon: Gem, tier: "gold", category: "hours", threshold: 50 },
  { key: "legend", label: "Legend", description: "Train for 100 hours", icon: Award, tier: "platinum", category: "hours", threshold: 100 },
];

const TIER_STYLES = {
  bronze: {
    unlocked: "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-400",
    locked: "bg-muted/40 border-border/30 text-muted-foreground/30",
    ring: "ring-amber-300/50 dark:ring-amber-700/50",
  },
  silver: {
    unlocked: "bg-slate-100 border-slate-400 text-slate-600 dark:bg-slate-900/40 dark:border-slate-500 dark:text-slate-300",
    locked: "bg-muted/40 border-border/30 text-muted-foreground/30",
    ring: "ring-slate-300/50 dark:ring-slate-500/50",
  },
  gold: {
    unlocked: "bg-yellow-50 border-yellow-400 text-yellow-600 dark:bg-yellow-950/40 dark:border-yellow-600 dark:text-yellow-400",
    locked: "bg-muted/40 border-border/30 text-muted-foreground/30",
    ring: "ring-yellow-300/50 dark:ring-yellow-500/50",
  },
  platinum: {
    unlocked: "bg-violet-50 border-violet-400 text-violet-600 dark:bg-violet-950/40 dark:border-violet-500 dark:text-violet-300",
    locked: "bg-muted/40 border-border/30 text-muted-foreground/30",
    ring: "ring-violet-300/50 dark:ring-violet-500/50",
  },
};

function getStatValue(stats: Stats, category: AchievementDef["category"]) {
  if (category === "sessions") return stats.sessions;
  if (category === "studios") return stats.studios;
  return stats.hours;
}

export default function ClientAchievements({ stats }: { stats: Stats }) {
  const computed = useMemo(() => {
    return ACHIEVEMENTS.map((a) => {
      const current = getStatValue(stats, a.category);
      const unlocked = current >= a.threshold;
      const progress = Math.min(current / a.threshold, 1);
      return { ...a, unlocked, progress, current };
    });
  }, [stats]);

  const unlockedCount = computed.filter((a) => a.unlocked).length;

  // Find next achievement to unlock
  const nextUp = computed.find((a) => !a.unlocked);

  return (
    <div className="space-y-4">
      {/* Summary line */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted-foreground">
          <span className="text-foreground font-bold">{unlockedCount}</span> / {ACHIEVEMENTS.length} unlocked
        </p>
        {nextUp && (
          <p className="text-[12px] text-muted-foreground/70">
            Next: {nextUp.label}
          </p>
        )}
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-4 gap-3">
        {computed.map((a) => {
          const Icon = a.icon;
          const style = TIER_STYLES[a.tier];
          return (
            <div key={a.key} className="group relative flex flex-col items-center gap-1.5">
              {/* Badge circle */}
              <div
                className={cn(
                  "relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-all duration-300",
                  a.unlocked
                    ? `${style.unlocked} ring-2 ${style.ring} shadow-sm`
                    : style.locked,
                )}
              >
                <Icon className={cn("h-6 w-6 transition-transform", a.unlocked && "drop-shadow-sm")} />
                {/* Progress ring for locked */}
                {!a.unlocked && a.progress > 0 && (
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
                    <circle
                      cx="28" cy="28" r="24"
                      fill="none"
                      stroke="hsl(var(--primary) / 0.25)"
                      strokeWidth="3"
                      strokeDasharray={`${a.progress * 150.8} 150.8`}
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </div>
              {/* Label */}
              <span className={cn(
                "text-[10px] font-semibold text-center leading-tight max-w-[60px]",
                a.unlocked ? "text-foreground" : "text-muted-foreground/50",
              )}>
                {a.label}
              </span>
              {/* Hover tooltip */}
              <div className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap rounded-lg bg-foreground/85 backdrop-blur-sm px-2.5 py-1.5 text-[11px] font-medium text-background shadow-lg">
                {a.description}
                {!a.unlocked && <span className="ml-1 text-background/60">({a.current}/{a.threshold})</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
