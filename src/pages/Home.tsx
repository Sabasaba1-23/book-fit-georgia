import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import ListingCard from "@/components/ListingCard";
import PackageCard from "@/components/PackageCard";
import BottomNav from "@/components/BottomNav";
import FilterChips from "@/components/FilterChips";
import FilterOverlay, { DEFAULT_FILTERS, type FilterState } from "@/components/FilterOverlay";
import NotificationsPanel from "@/components/NotificationsPanel";
import UserMenuDropdown from "@/components/UserMenuDropdown";
import { Search as SearchIcon, Alarm } from "@icon-park/react";
import { SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ListingWithPartner {
  id: string;
  title_en: string;
  title_ka: string | null;
  description_en: string | null;
  description_ka: string | null;
  sport: string;
  training_type: string;
  scheduled_at: string;
  duration_minutes: number;
  price_gel: number;
  max_spots: number;
  background_image_url: string | null;
  equipment_notes_en: string | null;
  equipment_notes_ka: string | null;
  status: string;
  partner_id: string;
  location: string | null;
  partner_profiles: {
    id: string;
    display_name: string;
    logo_url: string | null;
    partner_type: string;
    bio: string | null;
    avg_rating: number | null;
    review_count: number | null;
  };
}

interface PackageWithPartner {
  id: string;
  title_en: string;
  title_ka: string | null;
  sport: string;
  training_type: string;
  sessions_count: number;
  price_per_session_gel: number;
  total_price_gel: number;
  duration_minutes: number;
  max_spots: number;
  background_image_url: string | null;
  location: string | null;
  partner_profiles: {
    id: string;
    display_name: string;
    logo_url: string | null;
    partner_type: string;
    avg_rating: number | null;
    review_count: number | null;
  };
}

async function fetchHomeFeed() {
  const [listingsRes, packagesRes] = await Promise.all([
    supabase
      .from("training_listings")
      .select("*, partner_profiles(id, display_name, logo_url, partner_type, bio, avg_rating, review_count)")
      .eq("status", "approved")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("training_packages")
      .select("*, partner_profiles(id, display_name, logo_url, partner_type, avg_rating, review_count)")
      .eq("status", "approved")
      .order("created_at", { ascending: false }),
  ]);

  return {
    listings: (listingsRes.data ?? []) as unknown as ListingWithPartner[],
    packages: (packagesRes.data ?? []) as unknown as PackageWithPartner[],
  };
}

type FeedItem =
  | { type: "listing"; data: ListingWithPartner }
  | { type: "package"; data: PackageWithPartner };

export default function Home() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSport, setActiveSport] = useState("All");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [showNotifications, setShowNotifications] = useState(false);

  const { data, isLoading: loading } = useQuery({
    queryKey: ["homeFeed"],
    queryFn: fetchHomeFeed,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const listings = data?.listings ?? [];
  const packages = data?.packages ?? [];

  const handleSportChange = useCallback((v: string) => setActiveSport(v), []);
  const handleFiltersApply = useCallback((f: FilterState) => setFilters(f), []);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value), []);

  const sports = useMemo(
    () => ["All", ...Array.from(new Set([...listings.map((l) => l.sport), ...packages.map((p) => p.sport)]))],
    [listings, packages]
  );

  const filteredListings = useMemo(() => listings.filter((l) => {
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
      const listingTime = new Date(l.scheduled_at);
      const hhmm = `${listingTime.getHours().toString().padStart(2, "0")}:${listingTime.getMinutes().toString().padStart(2, "0")}`;
      if (hhmm < filters.timeRange[0] || hhmm > filters.timeRange[1]) return false;
    }
    if (filters.city && l.location) {
      if (!l.location.toLowerCase().includes(filters.city.toLowerCase())) return false;
    }
    if (filters.district && l.location) {
      if (!l.location.toLowerCase().includes(filters.district.toLowerCase())) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        l.title_en.toLowerCase().includes(q) ||
        l.sport.toLowerCase().includes(q) ||
        l.partner_profiles?.display_name?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    return true;
  }), [listings, filters, activeSport, searchQuery]);

  const filteredPackages = useMemo(() => packages.filter((p) => {
    if (filters.sessionType === "single") return false;
    if (activeSport !== "All" && p.sport !== activeSport) return false;
    if (filters.activities.length > 0 && !filters.activities.includes(p.sport)) return false;
    if (filters.trainingType && p.training_type !== filters.trainingType) return false;
    if (p.price_per_session_gel < filters.budgetRange[0] || p.price_per_session_gel > filters.budgetRange[1]) return false;
    if (filters.city && p.location) {
      if (!p.location.toLowerCase().includes(filters.city.toLowerCase())) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.title_en.toLowerCase().includes(q) ||
        p.sport.toLowerCase().includes(q) ||
        p.partner_profiles?.display_name?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    return true;
  }), [packages, filters, activeSport, searchQuery]);

  const feedItems = useMemo(() => {
    const listingItems: FeedItem[] = filteredListings.map((l) => ({ type: "listing", data: l }));
    const packageItems: FeedItem[] = filteredPackages.map((p) => ({ type: "package", data: p }));
    const mixed: FeedItem[] = [];
    let pkgIdx = 0;

    if (listingItems.length === 0) return packageItems;
    if (packageItems.length === 0) return listingItems;

    listingItems.forEach((item, i) => {
      mixed.push(item);
      if ((i + 1) % 2 === 0 && pkgIdx < packageItems.length) {
        mixed.push(packageItems[pkgIdx++]);
      }
    });
    while (pkgIdx < packageItems.length) {
      mixed.push(packageItems[pkgIdx++]);
    }
    return mixed;
  }, [filteredListings, filteredPackages]);

  const hasResults = feedItems.length > 0;

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || null;

  return (
    <div className="relative min-h-screen bg-background overflow-x-hidden overscroll-none mx-auto max-w-7xl pb-[calc(60px+var(--sab))]">

      {/* Header */}
      <header className="relative z-40 px-5 md:px-6 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            {firstName && (
              <p className="text-meta mb-1">
                {t("greeting") || "Good morning"}, {firstName}
              </p>
            )}
            <h1 className="text-page-title">
              {t("discovery")}
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1 mr-2">
              <button onClick={() => navigate("/bookings")} className="px-4 py-2 rounded-full text-[14px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                {t("navBookings")}
              </button>
              <button onClick={() => navigate("/messages")} className="px-4 py-2 rounded-full text-[14px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                {t("navChat")}
              </button>
            </nav>
            <button
              onClick={() => setShowNotifications(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-foreground transition-colors hover:bg-muted active:scale-95"
            >
              <BellRing size={20} fill="currentColor" />
            </button>
            <UserMenuDropdown />
          </div>
        </div>
      </header>

      {/* Search bar */}
      <div className="relative z-30 px-5 md:px-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex flex-1 items-center gap-2.5 rounded-full border border-border/30 bg-card px-4 py-2.5 premium-shadow">
            <SearchIcon size={16} fill="hsl(var(--muted-foreground) / 0.5)" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-transparent text-[15px] font-normal outline-none placeholder:text-muted-foreground/40"
            />
          </div>
          <FilterOverlay filters={filters} onApply={handleFiltersApply} />
        </div>
      </div>

      {/* Category chips */}
      <FilterChips options={sports} active={activeSport} onChange={handleSportChange} />

      {/* Section header */}
      <div className="px-5 md:px-6 pt-6 pb-4 flex items-center justify-between">
        <h2 className="text-section-title">{t("recommended") || "Recommended"}</h2>
      </div>

      {/* Feed */}
      <main className="relative z-10 px-5 md:px-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
            {[1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-[22px] border border-border/60">
                <Skeleton className="w-full" style={{ height: "clamp(220px, 55vw, 320px)" }} />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : !hasResults ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <SearchIcon size={24} fill="hsl(var(--muted-foreground))" />
            </div>
            <p className="text-muted-foreground text-sm">{t("noListings")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">
            {feedItems.map((item) => {
              if (item.type === "listing") {
                const l = item.data;
                return (
                  <ListingCard
                    key={l.id}
                    listing={{
                      ...l,
                      price_gel: Number(l.price_gel),
                      partner_id: l.partner_id,
                      partner: l.partner_profiles as any,
                    }}
                  />
                );
              }
              const p = item.data as PackageWithPartner;
              return <PackageCard key={p.id} pkg={p} />;
            })}
          </div>
        )}
      </main>

      <footer className="relative z-10 pt-4 pb-1 flex flex-col items-center gap-1.5">
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate("/privacy")}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            {t("privacyPolicyLabel")}
          </button>
          <button
            onClick={() => navigate("/terms")}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
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
