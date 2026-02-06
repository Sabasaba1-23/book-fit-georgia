import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import ListingCard from "@/components/ListingCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import BottomNav from "@/components/BottomNav";

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

  const filtered = searchQuery
    ? listings.filter(
        (l) =>
          l.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
          l.sport.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (l.partner_profiles as any)?.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : listings;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur px-4 py-3">
        <h1 className="text-xl font-bold text-foreground">FitBook</h1>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </header>

      {/* Listings feed */}
      <main className="mx-auto max-w-lg space-y-3 px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <p className="text-muted-foreground">{t("loading")}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex justify-center py-12">
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
