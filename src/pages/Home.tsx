import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import ListingCard from "@/components/ListingCard";
import PackageCard from "@/components/PackageCard";
import BottomNav from "@/components/BottomNav";
import FilterChips from "@/components/FilterChips";
import FilterOverlay, { DEFAULT_FILTERS, type FilterState } from "@/components/FilterOverlay";
import { Search, Bell } from "lucide-react";

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
  };
}

export default function Home() {
  const { t } = useLanguage();
  const [listings, setListings] = useState<ListingWithPartner[]>([]);
  const [packages, setPackages] = useState<PackageWithPartner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSport, setActiveSport] = useState("All");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  useEffect(() => {
    async function fetchAll() {
      const [listingsRes, packagesRes] = await Promise.all([
        supabase
          .from("training_listings")
          .select("*, partner_profiles(id, display_name, logo_url, partner_type, bio)")
          .eq("status", "approved")
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true }),
        supabase
          .from("training_packages")
          .select("*, partner_profiles(id, display_name, logo_url, partner_type)")
          .eq("status", "approved")
          .order("created_at", { ascending: false }),
      ]);

      if (!listingsRes.error && listingsRes.data) {
        setListings(listingsRes.data as unknown as ListingWithPartner[]);
      }
      if (!packagesRes.error && packagesRes.data) {
        setPackages(packagesRes.data as unknown as PackageWithPartner[]);
      }
      setLoading(false);
    }
    fetchAll();
  }, []);

  // Unique sports for filter chips
  const sports = ["All", ...Array.from(new Set([...listings.map((l) => l.sport), ...packages.map((p) => p.sport)]))];

  // Apply all filters
  const filteredListings = listings.filter((l) => {
    if (filters.sessionType === "package") return false;
    if (activeSport !== "All" && l.sport !== activeSport) return false;
    if (filters.activities.length > 0 && !filters.activities.includes(l.sport)) return false;
    if (filters.trainingType && l.training_type !== filters.trainingType) return false;
    if (l.price_gel < filters.budgetRange[0] || l.price_gel > filters.budgetRange[1]) return false;
    if (filters.selectedDate) {
      const listingDate = new Date(l.scheduled_at).toISOString().split("T")[0];
      if (listingDate !== filters.selectedDate) return false;
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
  });

  const filteredPackages = packages.filter((p) => {
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
  });

  const hasResults = filteredListings.length > 0 || filteredPackages.length > 0;

  return (
    <div className="relative min-h-screen bg-background pb-24 overflow-hidden">
      {/* Background blobs */}
      <div className="blob-warm-1 pointer-events-none fixed -right-32 -top-32 h-80 w-80 rounded-full" />
      <div className="blob-warm-2 pointer-events-none fixed -left-20 top-1/3 h-64 w-64 rounded-full" />

      {/* Header */}
      <header className="relative z-40 px-5 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-primary">Community</p>
            <h1 className="text-[28px] font-extrabold tracking-tight text-foreground leading-none mt-0.5">Discovery</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground transition-transform active:scale-95">
              <Bell className="h-5 w-5 text-background" />
            </button>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary p-[2px]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-background">
                <span className="text-sm font-bold text-primary">K</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search bar + filter button */}
      <div className="relative z-30 px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="glass-card flex flex-1 items-center gap-3 rounded-2xl px-4 py-3.5 ios-shadow">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search trainers, gyms or yoga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <FilterOverlay filters={filters} onApply={setFilters} />
        </div>
      </div>

      {/* Filter chips */}
      <FilterChips options={sports} active={activeSport} onChange={setActiveSport} />

      {/* Feed */}
      <main className="relative z-10 mx-auto max-w-lg space-y-5 px-5 py-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            </div>
          </div>
        ) : !hasResults ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t("noListings")}</p>
          </div>
        ) : (
          <>
            {/* Packages section */}
            {filteredPackages.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">📦 Package Deals</h2>
                {filteredPackages.map((pkg) => (
                  <PackageCard key={pkg.id} pkg={pkg} />
                ))}
              </div>
            )}

            {/* Single sessions */}
            {filteredListings.length > 0 && (
              <div className="space-y-5">
                {filteredPackages.length > 0 && (
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-2">⚡ Single Sessions</h2>
                )}
                {filteredListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={{
                      ...listing,
                      price_gel: Number(listing.price_gel),
                      partner_id: listing.partner_id,
                      partner: listing.partner_profiles as any,
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
