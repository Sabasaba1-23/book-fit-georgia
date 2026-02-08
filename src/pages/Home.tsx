import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useHomeFeed, type ListingWithPartner, type PackageWithPartner } from "@/hooks/useHomeFeed";
import ListingCard from "@/components/ListingCard";
import PackageCard from "@/components/PackageCard";
import BottomNav from "@/components/BottomNav";
import FilterChips from "@/components/FilterChips";
import FilterOverlay, { DEFAULT_FILTERS, type FilterState } from "@/components/FilterOverlay";
import NotificationsPanel from "@/components/NotificationsPanel";
import UserMenuDropdown from "@/components/UserMenuDropdown";
import { Search, Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useHomeFeed();
  const listings = data?.listings ?? [];
  const packages = data?.packages ?? [];

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSport, setActiveSport] = useState("All");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showNotifications, setShowNotifications] = useState(false);

  const sports = useMemo(
    () => ["All", ...Array.from(new Set([...listings.map((l) => l.sport), ...packages.map((p) => p.sport)]))],
    [listings, packages]
  );

  const filteredListings = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return listings.filter((l) => {
      if (filters.sessionType === "package") return false;
      if (activeSport !== "All" && l.sport !== activeSport) return false;
      if (filters.activities.length > 0 && !filters.activities.includes(l.sport)) return false;
      if (filters.trainingType && l.training_type !== filters.trainingType) return false;
      if (l.price_gel < filters.budgetRange[0] || l.price_gel > filters.budgetRange[1]) return false;
      if (filters.selectedDate) {
        const listingDate = new Date(l.scheduled_at).toISOString().split("T")[0];
        if (listingDate !== filters.selectedDate) return false;
      }
      if (filters.timeRange) {
        const lt = new Date(l.scheduled_at);
        const hhmm = `${lt.getHours().toString().padStart(2, "0")}:${lt.getMinutes().toString().padStart(2, "0")}`;
        if (hhmm < filters.timeRange[0] || hhmm > filters.timeRange[1]) return false;
      }
      if (filters.city && l.location && !l.location.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (filters.district && l.location && !l.location.toLowerCase().includes(filters.district.toLowerCase())) return false;
      if (q) {
        const match = l.title_en.toLowerCase().includes(q) || l.sport.toLowerCase().includes(q) || l.partner_profiles?.display_name?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [listings, searchQuery, activeSport, filters]);

  const filteredPackages = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return packages.filter((p) => {
      if (filters.sessionType === "single") return false;
      if (activeSport !== "All" && p.sport !== activeSport) return false;
      if (filters.activities.length > 0 && !filters.activities.includes(p.sport)) return false;
      if (filters.trainingType && p.training_type !== filters.trainingType) return false;
      if (p.price_per_session_gel < filters.budgetRange[0] || p.price_per_session_gel > filters.budgetRange[1]) return false;
      if (filters.city && p.location && !p.location.toLowerCase().includes(filters.city.toLowerCase())) return false;
      if (q) {
        const match = p.title_en.toLowerCase().includes(q) || p.sport.toLowerCase().includes(q) || p.partner_profiles?.display_name?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [packages, searchQuery, activeSport, filters]);

  const feedItems = useMemo(() => {
    type FeedItem = { type: "listing"; data: ListingWithPartner } | { type: "package"; data: PackageWithPartner };
    const listingItems: FeedItem[] = filteredListings.map((l) => ({ type: "listing", data: l }));
    const packageItems: FeedItem[] = filteredPackages.map((p) => ({ type: "package", data: p }));

    if (listingItems.length === 0) return packageItems;
    if (packageItems.length === 0) return listingItems;

    const mixed: FeedItem[] = [];
    let pkgIdx = 0;
    listingItems.forEach((item, i) => {
      mixed.push(item);
      if ((i + 1) % 2 === 0 && pkgIdx < packageItems.length) {
        mixed.push(packageItems[pkgIdx++]);
      }
    });
    while (pkgIdx < packageItems.length) mixed.push(packageItems[pkgIdx++]);
    return mixed;
  }, [filteredListings, filteredPackages]);

  const hasResults = feedItems.length > 0;

  const handleFilterApply = useCallback((f: FilterState) => setFilters(f), []);
  const handleSportChange = useCallback((s: string) => setActiveSport(s), []);

  return (
    <div className="relative min-h-screen bg-background pb-24 overflow-x-hidden overscroll-none">
      <div className="blob-warm-1 pointer-events-none fixed -right-32 -top-32 h-80 w-80 rounded-full" />
      <div className="blob-warm-2 pointer-events-none fixed -left-20 top-1/3 h-64 w-64 rounded-full" />

      <header className="relative z-40 px-5 pb-2" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-medium tracking-[0.25em] uppercase text-primary">{t("community")}</p>
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-none mt-0.5">{t("discovery")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNotifications(true)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground transition-transform active:scale-95"
            >
              <Bell className="h-5 w-5 text-background" />
            </button>
            <UserMenuDropdown />
          </div>
        </div>
      </header>

      <div className="relative z-30 px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="glass-card flex flex-1 items-center gap-3 rounded-2xl px-4 py-3.5 ios-shadow">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <FilterOverlay filters={filters} onApply={handleFilterApply} />
        </div>
      </div>

      <FilterChips options={sports} active={activeSport} onChange={handleSportChange} />

      <main className="relative z-10 mx-auto max-w-lg space-y-7 px-5 py-5">
        {isLoading ? (
          <div className="space-y-7">
            {[1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-[1.75rem] ios-shadow">
                <Skeleton className="h-[420px] w-full" />
              </div>
            ))}
          </div>
        ) : !hasResults ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t("noListings")}</p>
          </div>
        ) : (
          <div className="space-y-7">
            {feedItems.map((item) => {
              if (item.type === "listing") {
                const l = item.data as ListingWithPartner;
                return (
                  <ListingCard
                    key={l.id}
                    listing={{ ...l, price_gel: Number(l.price_gel), partner_id: l.partner_id, partner: l.partner_profiles as any }}
                  />
                );
              }
              const p = item.data as PackageWithPartner;
              return <PackageCard key={p.id} pkg={p} />;
            })}
          </div>
        )}
      </main>

      <footer className="relative z-10 py-6 pb-28 flex flex-col items-center gap-2">
        <div className="flex justify-center gap-4">
          <button onClick={() => navigate("/privacy")} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
            {t("privacyPolicyLabel")}
          </button>
          <button onClick={() => navigate("/terms")} className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
            {t("termsAndConditionsLabel")}
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground/60">{t("allRightsReserved")}</p>
      </footer>

      <BottomNav />
      <NotificationsPanel open={showNotifications} onOpenChange={setShowNotifications} />
    </div>
  );
}
