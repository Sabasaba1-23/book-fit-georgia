import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon } from "@icon-park/react";
import { X, Clock, TrendingUp, MapPin, Star, Package as PackageIcon, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  /** Optional: pre-seeded query when opening */
  initialQuery?: string;
}

interface ListingResult {
  id: string;
  title_en: string;
  sport: string;
  scheduled_at: string;
  price_gel: number;
  location: string | null;
  background_image_url: string | null;
  partner_profiles: { id: string; display_name: string; logo_url: string | null } | null;
}

interface PackageResult {
  id: string;
  title_en: string;
  sport: string;
  price_per_session_gel: number;
  sessions_count: number;
  location: string | null;
  background_image_url: string | null;
  partner_profiles: { id: string; display_name: string; logo_url: string | null } | null;
}

interface PartnerResult {
  id: string;
  display_name: string;
  partner_type: string;
  logo_url: string | null;
  location: string | null;
  avg_rating: number | null;
  review_count: number | null;
}

const RECENT_KEY = "bookfit:recentSearches";
const POPULAR = ["Yoga", "Boxing", "Pilates", "CrossFit", "Tennis", "Swimming", "Gym", "Running"];

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

function saveRecent(items: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(items.slice(0, 8)));
  } catch {
    /* ignore */
  }
}

export default function SearchOverlay({ open, onClose, initialQuery = "" }: SearchOverlayProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(query);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recents + focus input on open
  useEffect(() => {
    if (!open) return;
    setRecent(loadRecent());
    setQuery(initialQuery);
    const id = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(id);
  }, [open, initialQuery]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Debounce input
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 220);
    return () => clearTimeout(id);
  }, [query]);

  const enabled = open && debounced.length >= 2;

  const { data, isFetching } = useQuery({
    queryKey: ["searchOverlay", debounced],
    enabled,
    staleTime: 30_000,
    queryFn: async () => {
      const like = `%${debounced}%`;
      const [listingsRes, packagesRes, partnersRes] = await Promise.all([
        supabase
          .from("training_listings")
          .select(
            "id, title_en, sport, scheduled_at, price_gel, location, background_image_url, partner_profiles(id, display_name, logo_url)"
          )
          .eq("status", "approved")
          .gte("scheduled_at", new Date().toISOString())
          .or(`title_en.ilike.${like},sport.ilike.${like},location.ilike.${like}`)
          .order("scheduled_at", { ascending: true })
          .limit(8),
        supabase
          .from("training_packages")
          .select(
            "id, title_en, sport, price_per_session_gel, sessions_count, location, background_image_url, partner_profiles(id, display_name, logo_url)"
          )
          .eq("status", "approved")
          .or(`title_en.ilike.${like},sport.ilike.${like},location.ilike.${like}`)
          .limit(6),
        supabase
          .from("partner_profiles")
          .select("id, display_name, partner_type, logo_url, location, avg_rating, review_count")
          .eq("approved", true)
          .or(`display_name.ilike.${like},location.ilike.${like}`)
          .limit(6),
      ]);

      return {
        listings: (listingsRes.data ?? []) as unknown as ListingResult[],
        packages: (packagesRes.data ?? []) as unknown as PackageResult[],
        partners: (partnersRes.data ?? []) as unknown as PartnerResult[],
      };
    },
  });

  const totalResults = useMemo(() => {
    if (!data) return 0;
    return data.listings.length + data.packages.length + data.partners.length;
  }, [data]);

  const commitRecent = (term: string) => {
    const v = term.trim();
    if (!v) return;
    const next = [v, ...recent.filter((r) => r.toLowerCase() !== v.toLowerCase())].slice(0, 8);
    setRecent(next);
    saveRecent(next);
  };

  const clearRecent = () => {
    setRecent([]);
    saveRecent([]);
  };

  const goPartner = (id: string) => {
    commitRecent(query);
    onClose();
    navigate(`/partner/${id}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background animate-in fade-in duration-150">
      {/* Header */}
      <div
        className="flex items-center gap-2 border-b border-border/40 bg-background px-3 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close search"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted active:scale-95"
        >
          <X size={20} />
        </button>
        <div className="flex flex-1 items-center gap-2.5 rounded-full border border-border/40 bg-card px-4 py-2.5 premium-shadow gradient-border">
          <SearchIcon size={16} fill="hsl(var(--primary))" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRecent(query);
            }}
            placeholder={t("searchPlaceholder")}
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Clear"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div
        className="flex-1 overflow-y-auto px-4 pt-5"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
      >
        {/* Empty state: recents + popular */}
        {debounced.length < 2 && (
          <div className="space-y-7">
            {recent.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-meta">
                    <Clock size={14} />
                    <span className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Recent
                    </span>
                  </div>
                  <button
                    onClick={clearRecent}
                    className="text-[12px] text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <button
                      key={r}
                      onClick={() => setQuery(r)}
                      className="rounded-full border border-border/40 bg-card px-3.5 py-1.5 text-[13px] font-medium text-foreground hover:border-primary/40 hover:bg-muted/60 transition-colors"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="mb-3 flex items-center gap-2">
                <TrendingUp size={14} className="text-primary" />
                <span className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Popular
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((p) => (
                  <button
                    key={p}
                    onClick={() => setQuery(p)}
                    className="rounded-full gradient-primary px-3.5 py-1.5 text-[13px] font-semibold text-primary-foreground premium-gradient-shadow hover:opacity-95 transition-opacity"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* Results */}
        {debounced.length >= 2 && (
          <div className="space-y-7">
            {isFetching && !data && (
              <div className="space-y-3 pt-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-2xl bg-muted/60 animate-pulse"
                  />
                ))}
              </div>
            )}

            {data && totalResults === 0 && !isFetching && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <SearchIcon size={24} fill="hsl(var(--muted-foreground))" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No results for "{debounced}"
                </p>
              </div>
            )}

            {data && data.partners.length > 0 && (
              <ResultSection title="Trainers & Gyms" count={data.partners.length}>
                <ul className="space-y-2">
                  {data.partners.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => goPartner(p.id)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-border/40 bg-card p-3 text-left premium-shadow hover:border-primary/30 transition-colors active:scale-[0.99]"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                          {p.logo_url ? (
                            <img
                              src={p.logo_url}
                              alt={p.display_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <SearchIcon size={16} fill="currentColor" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[15px] font-semibold text-foreground">
                            {p.display_name}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted-foreground">
                            <span className="capitalize">{p.partner_type}</span>
                            {p.location && (
                              <>
                                <span className="opacity-50">·</span>
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin size={11} /> {p.location}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        {p.avg_rating != null && (
                          <div className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-foreground">
                            <Star size={12} className="fill-primary text-primary" />
                            {Number(p.avg_rating).toFixed(1)}
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </ResultSection>
            )}

            {data && data.listings.length > 0 && (
              <ResultSection title="Sessions" count={data.listings.length}>
                <ul className="space-y-2">
                  {data.listings.map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => goPartner(l.partner_profiles?.id ?? "")}
                        className="flex w-full items-center gap-3 rounded-2xl border border-border/40 bg-card p-3 text-left premium-shadow hover:border-primary/30 transition-colors active:scale-[0.99]"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                          {l.background_image_url ? (
                            <img
                              src={l.background_image_url}
                              alt={l.title_en}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <Calendar size={16} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[15px] font-semibold text-foreground">
                            {l.title_en}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted-foreground">
                            <span>{l.sport}</span>
                            <span className="opacity-50">·</span>
                            <span>
                              {new Date(l.scheduled_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-[13px] font-semibold gradient-text">
                          {Number(l.price_gel)} ₾
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </ResultSection>
            )}

            {data && data.packages.length > 0 && (
              <ResultSection title="Packages" count={data.packages.length}>
                <ul className="space-y-2">
                  {data.packages.map((pk) => (
                    <li key={pk.id}>
                      <button
                        type="button"
                        onClick={() => goPartner(pk.partner_profiles?.id ?? "")}
                        className="flex w-full items-center gap-3 rounded-2xl border border-border/40 bg-card p-3 text-left premium-shadow hover:border-primary/30 transition-colors active:scale-[0.99]"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl gradient-primary text-primary-foreground">
                          {pk.background_image_url ? (
                            <img
                              src={pk.background_image_url}
                              alt={pk.title_en}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <PackageIcon size={18} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[15px] font-semibold text-foreground">
                            {pk.title_en}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted-foreground">
                            <span>{pk.sport}</span>
                            <span className="opacity-50">·</span>
                            <span>{pk.sessions_count} sessions</span>
                          </div>
                        </div>
                        <div className="shrink-0 text-[13px] font-semibold gradient-text">
                          {Number(pk.price_per_session_gel)} ₾
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </ResultSection>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between px-1">
        <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        <span className="text-[11px] font-medium text-muted-foreground/70">{count}</span>
      </div>
      {children}
    </section>
  );
}
