import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { X, Search, SlidersHorizontal, User, Users, CalendarDays, ArrowRight, MapPin, Package, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";

const ACTIVITIES = ["Yoga", "HIIT", "Tennis", "Boxing", "Pilates", "Swimming", "CrossFit", "MMA"];

const CITIES: Record<string, string[]> = {
  Tbilisi: ["Vake", "Saburtalo", "Old Town", "Vera", "Didube", "Gldani", "Isani", "Nadzaladevi", "Ortachala"],
  Batumi: ["Boulevard", "Old Batumi", "Gonio", "Khelvachauri", "Airport Area"],
  Kutaisi: ["City Center", "Nikea", "Balakhvani"],
};

const LANGUAGES_LIST = ["English", "Georgian", "Russian", "Spanish"];

export interface FilterState {
  activities: string[];
  selectedDate: string | null; // ISO string or null for "anytime"
  budgetRange: [number, number];
  trainingType: string | null; // "one_on_one" | "group" | "event" | null
  sessionType: string | null; // "single" | "package" | null
  languages: string[];
  city: string | null;
  district: string | null;
}

const DEFAULT_FILTERS: FilterState = {
  activities: [],
  selectedDate: null,
  budgetRange: [0, 500],
  trainingType: null,
  sessionType: null,
  languages: [],
  city: null,
  district: null,
};

interface FilterOverlayProps {
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  children?: React.ReactNode;
}

export default function FilterOverlay({ filters, onApply, children }: FilterOverlayProps) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<FilterState>(filters);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setLocal(filters);
    setOpen(isOpen);
  };

  const clearAll = () => setLocal(DEFAULT_FILTERS);

  const apply = () => {
    onApply(local);
    setOpen(false);
  };

  const toggleActivity = (a: string) =>
    setLocal((p) => ({
      ...p,
      activities: p.activities.includes(a) ? p.activities.filter((x) => x !== a) : [...p.activities, a],
    }));

  const toggleLanguage = (l: string) =>
    setLocal((p) => ({
      ...p,
      languages: p.languages.includes(l) ? p.languages.filter((x) => x !== l) : [...p.languages, l],
    }));

  // Next 7 days for date picker
  const dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, i);
      return { iso: d.toISOString().split("T")[0], day: format(d, "EEE"), date: format(d, "d") };
    });
  }, []);

  const activeCount = [
    local.activities.length > 0,
    local.selectedDate !== null,
    local.budgetRange[0] > 0 || local.budgetRange[1] < 500,
    local.trainingType !== null,
    local.sessionType !== null,
    local.languages.length > 0,
    local.city !== null,
  ].filter(Boolean).length;

  const districts = local.city ? CITIES[local.city] || [] : [];

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        {children || (
          <button className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground transition-transform active:scale-95">
            <SlidersHorizontal className="h-5 w-5 text-background" />
            {activeCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[92vh] rounded-t-[2rem] p-0 overflow-hidden border-0">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <button onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80">
              <X className="h-5 w-5 text-foreground" />
            </button>
            <SheetHeader className="flex-1 text-center">
              <SheetTitle className="text-xl font-extrabold text-foreground">Find Your Move</SheetTitle>
            </SheetHeader>
            <button onClick={clearAll} className="text-sm font-semibold text-primary">
              Clear all
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 pb-28 space-y-6">
            {/* Activity */}
            <Section title="Activity" icon={<Search className="h-4 w-4 text-primary" />}>
              <div className="flex flex-wrap gap-2">
                {ACTIVITIES.map((a) => (
                  <ChipButton key={a} active={local.activities.includes(a)} onClick={() => toggleActivity(a)}>
                    {a}
                  </ChipButton>
                ))}
              </div>
            </Section>

            {/* Location */}
            <Section title="Location" icon={<MapPin className="h-4 w-4 text-primary" />}>
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.keys(CITIES).map((city) => (
                  <ChipButton
                    key={city}
                    active={local.city === city}
                    onClick={() => setLocal((p) => ({ ...p, city: p.city === city ? null : city, district: null }))}
                  >
                    {city}
                  </ChipButton>
                ))}
              </div>
              {districts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {districts.map((d) => (
                    <ChipButton
                      key={d}
                      active={local.district === d}
                      onClick={() => setLocal((p) => ({ ...p, district: p.district === d ? null : d }))}
                      variant="outline"
                    >
                      {d}
                    </ChipButton>
                  ))}
                </div>
              )}
            </Section>

            {/* Date & Time */}
            <Section title="Date & Time" icon={<CalendarDays className="h-4 w-4 text-primary" />}>
              <div className="hide-scrollbar flex gap-2 overflow-x-auto">
                <ChipButton active={local.selectedDate === null} onClick={() => setLocal((p) => ({ ...p, selectedDate: null }))}>
                  Anytime
                </ChipButton>
                {dates.map((d) => (
                  <button
                    key={d.iso}
                    onClick={() => setLocal((p) => ({ ...p, selectedDate: p.selectedDate === d.iso ? null : d.iso }))}
                    className={cn(
                      "flex shrink-0 flex-col items-center rounded-2xl px-3.5 py-2 transition-all active:scale-95",
                      local.selectedDate === d.iso
                        ? "bg-foreground text-background shadow-lg"
                        : "border border-border bg-card text-muted-foreground"
                    )}
                  >
                    <span className="text-[10px] font-semibold uppercase">{d.day}</span>
                    <span className="text-lg font-bold">{d.date}</span>
                  </button>
                ))}
              </div>
            </Section>

            {/* Budget */}
            <Section title="Budget">
              <div className="px-1">
                <div className="mb-3 flex justify-between text-sm font-bold text-foreground">
                  <span>{local.budgetRange[0]}₾</span>
                  <span>{local.budgetRange[1]}₾</span>
                </div>
                <Slider
                  min={0}
                  max={500}
                  step={10}
                  value={local.budgetRange}
                  onValueChange={(v) => setLocal((p) => ({ ...p, budgetRange: v as [number, number] }))}
                />
              </div>
            </Section>

            {/* Training Type */}
            <Section title="Training Type">
              <div className="flex gap-2">
                {[
                  { key: "one_on_one", label: "Individual", icon: <User className="h-4 w-4" /> },
                  { key: "group", label: "Group", icon: <Users className="h-4 w-4" /> },
                  { key: "event", label: "Event", icon: <CalendarDays className="h-4 w-4" /> },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setLocal((p) => ({ ...p, trainingType: p.trainingType === t.key ? null : t.key }))}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-1.5 rounded-2xl py-3 transition-all active:scale-95",
                      local.trainingType === t.key
                        ? "bg-foreground text-background shadow-lg"
                        : "border border-border bg-card text-muted-foreground"
                    )}
                  >
                    {t.icon}
                    <span className="text-xs font-semibold">{t.label}</span>
                  </button>
                ))}
              </div>
            </Section>

            {/* Session Type */}
            <Section title="Session Type">
              <div className="flex gap-2">
                {[
                  { key: "single", label: "Single Session", icon: <Zap className="h-4 w-4" /> },
                  { key: "package", label: "Package Deal", icon: <Package className="h-4 w-4" /> },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => setLocal((p) => ({ ...p, sessionType: p.sessionType === s.key ? null : s.key }))}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 transition-all active:scale-95",
                      local.sessionType === s.key
                        ? "bg-foreground text-background shadow-lg"
                        : "border border-border bg-card text-muted-foreground"
                    )}
                  >
                    {s.icon}
                    <span className="text-xs font-semibold">{s.label}</span>
                  </button>
                ))}
              </div>
            </Section>

            {/* Language */}
            <Section title="Language">
              <div className="flex flex-wrap gap-2">
                {LANGUAGES_LIST.map((l) => (
                  <ChipButton key={l} active={local.languages.includes(l)} onClick={() => toggleLanguage(l)}>
                    {l}
                  </ChipButton>
                ))}
              </div>
            </Section>
          </div>

          {/* Apply button — fixed bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl px-5 pb-8 pt-4 border-t border-border/50">
            <button
              onClick={apply}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-4 text-sm font-bold uppercase tracking-wider text-background transition-all active:scale-[0.98] ios-shadow"
            >
              Apply Filters
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  children,
  variant = "default",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "outline";
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95",
        active
          ? "bg-foreground text-background shadow-lg"
          : variant === "outline"
            ? "border border-border/60 bg-transparent text-muted-foreground hover:border-primary/30"
            : "border border-border bg-card text-muted-foreground hover:border-primary/30"
      )}
    >
      {children}
    </button>
  );
}

export { DEFAULT_FILTERS };
export type { FilterState as FilterStateType };
