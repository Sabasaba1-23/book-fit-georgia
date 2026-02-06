import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import ListingCard from "@/components/ListingCard";
import BottomNav from "@/components/BottomNav";
import FilterChips from "@/components/FilterChips";
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
  partner_profiles: {
    display_name: string;
    logo_url: string | null;
    partner_type: string;
    bio: string | null;
  };
}

export default function Home() {
  const { t } = useLanguage();
  const [listings, setListings] = useState<ListingWithPartner[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSport, setActiveSport] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      const { data, error } = await supabase
        .from("training_listings")
        .select("*, partner_profiles(display_name, logo_url, partner_type, bio)")
        .eq("status", "approved")
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true });

      if (!error && data) {
        setListings(data as unknown as ListingWithPartner[]);
      }
      setLoading(false);
    }
    fetchListings();
  }, []);

  // Unique sports for filter chips
  const sports = ["All", ...Array.from(new Set(listings.map((l) => l.sport)))];

  const filtered = listings.filter((l) => {
    const matchesSport = activeSport === "All" || l.sport === activeSport;
    const matchesSearch =
      !searchQuery ||
      l.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.partner_profiles as any)?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSport && matchesSearch;
  });

  return (
    <div className="relative min-h-screen bg-background pb-24 overflow-hidden">
      {/* Background blobs */}
      <div className="blob-warm-1 pointer-events-none fixed -right-32 -top-32 h-80 w-80 rounded-full" />
      <div className="blob-warm-2 pointer-events-none fixed -left-20 top-1/3 h-64 w-64 rounded-full" />

      {/* Header */}
      <header className="relative z-40 px-5 pt-5 pb-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary">Community</p>
            <h1 className="text-3xl font-extrabold text-foreground -mt-0.5">Discovery</h1>
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

      {/* Search bar - always visible */}
      <div className="relative z-30 px-5 py-3">
        <div className="glass-card flex items-center gap-3 rounded-2xl px-4 py-3 ios-shadow">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search trainers, gyms or yoga..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      {/* Filter chips */}
      <FilterChips
        options={sports}
        active={activeSport}
        onChange={setActiveSport}
      />

      {/* Listings feed */}
      <main className="relative z-10 mx-auto max-w-lg space-y-5 px-5 py-2">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Search className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t("noListings")}</p>
          </div>
        ) : (
          filtered.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={{
                ...listing,
                price_gel: Number(listing.price_gel),
                partner: listing.partner_profiles as any,
              }}
            />
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
}
