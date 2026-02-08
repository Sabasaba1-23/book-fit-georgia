import { useState, useMemo, useRef, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { SPORTS } from "@/constants/sports";
import { cn } from "@/lib/utils";

interface ActivitySearchSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ActivitySearchSelect({ value, onChange }: ActivitySearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return [...SPORTS];
    const q = search.toLowerCase();
    return SPORTS.filter((s) => s.toLowerCase().includes(q));
  }, [search]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center justify-between h-14 rounded-2xl border-0 bg-muted/60 px-4 text-[15px] font-medium transition-colors",
          value ? "text-foreground" : "text-muted-foreground/60"
        )}
      >
        <span className="truncate">{value || "Search & select activity..."}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-2xl border border-border bg-card shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activities..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              autoFocus
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="shrink-0">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">No activities found</p>
            ) : (
              filtered.map((sport) => (
                <button
                  key={sport}
                  type="button"
                  onClick={() => {
                    onChange(sport);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/60",
                    value === sport ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                  )}
                >
                  {sport}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
