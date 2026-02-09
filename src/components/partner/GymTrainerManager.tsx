import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Search, UserPlus, X, ChevronLeft } from "lucide-react";

interface TrainerResult {
  id: string;
  display_name: string;
  logo_url: string | null;
  sports: string[] | null;
  partner_type: string;
}

interface LinkedTrainer {
  id: string;
  trainer_partner_id: string;
  display_name: string;
  logo_url: string | null;
  sports: string[] | null;
}

interface Props {
  gymPartnerId: string;
  onBack: () => void;
}

export default function GymTrainerManager({ gymPartnerId, onBack }: Props) {
  const { toast } = useToast();
  const [linkedTrainers, setLinkedTrainers] = useState<LinkedTrainer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TrainerResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchLinked = async () => {
    const { data } = await supabase
      .from("gym_trainers")
      .select("id, trainer_partner_id")
      .eq("gym_partner_id", gymPartnerId)
      .eq("status", "active");

    if (data && data.length > 0) {
      const trainerIds = data.map((d) => d.trainer_partner_id);
      const { data: profiles } = await supabase
        .from("partner_profiles")
        .select("id, display_name, logo_url, sports")
        .in("id", trainerIds);

      const linked = data.map((d) => {
        const p = profiles?.find((pp) => pp.id === d.trainer_partner_id);
        return {
          id: d.id,
          trainer_partner_id: d.trainer_partner_id,
          display_name: p?.display_name || "Unknown",
          logo_url: p?.logo_url || null,
          sports: p?.sports || null,
        };
      });
      setLinkedTrainers(linked);
    } else {
      setLinkedTrainers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLinked();
  }, [gymPartnerId]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from("partner_profiles")
      .select("id, display_name, logo_url, sports, partner_type")
      .eq("partner_type", "individual")
      .eq("approved", true)
      .ilike("display_name", `%${query.trim()}%`)
      .limit(10);

    const linkedIds = linkedTrainers.map((t) => t.trainer_partner_id);
    setSearchResults((data || []).filter((r) => !linkedIds.includes(r.id)) as TrainerResult[]);
    setSearching(false);
  };

  const addTrainer = async (trainer: TrainerResult) => {
    const { error } = await supabase.from("gym_trainers").upsert(
      {
        gym_partner_id: gymPartnerId,
        trainer_partner_id: trainer.id,
        status: "active",
      },
      { onConflict: "gym_partner_id,trainer_partner_id" }
    );

    if (error) {
      toast({ title: "Failed to add trainer", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${trainer.display_name} added!` });
      setSearchQuery("");
      setSearchResults([]);
      fetchLinked();
    }
  };

  const removeTrainer = async (linkId: string, name: string) => {
    const { error } = await supabase
      .from("gym_trainers")
      .delete()
      .eq("id", linkId);

    if (error) {
      toast({ title: "Failed to remove", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${name} removed` });
      fetchLinked();
    }
  };

  return (
    <div className="relative z-10 px-5 pt-4 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-card transition-colors hover:bg-muted active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-[20px] font-semibold text-foreground">Manage Trainers</h2>
      </div>

      <p className="text-[13px] text-muted-foreground leading-relaxed">
        Search and add trainers that work at your gym. They'll appear on your public profile. Trainers can remove themselves if needed.
      </p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search trainers by name..."
          className="pl-10 h-12 rounded-2xl border-border bg-card text-sm"
        />
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Search Results</p>
          {searchResults.map((trainer) => (
            <div
              key={trainer.id}
              className="flex items-center gap-3 rounded-2xl bg-card border border-border/50 p-3"
            >
              <Avatar className="h-10 w-10">
                {trainer.logo_url && <AvatarImage src={trainer.logo_url} />}
                <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                  {trainer.display_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{trainer.display_name}</p>
                {trainer.sports && trainer.sports.length > 0 && (
                  <p className="text-[11px] text-muted-foreground truncate">{trainer.sports.slice(0, 3).join(", ")}</p>
                )}
              </div>
              <button
                onClick={() => addTrainer(trainer)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20 active:scale-95"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {searching && (
        <div className="flex justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Linked Trainers */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Your Trainers ({linkedTrainers.length})
        </p>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : linkedTrainers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-10 text-center">
            <UserPlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No trainers added yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Search above to add trainers</p>
          </div>
        ) : (
          <div className="space-y-2">
            {linkedTrainers.map((trainer) => (
              <div
                key={trainer.id}
                className="flex items-center gap-3 rounded-2xl bg-card border border-border/50 p-3"
              >
                <Avatar className="h-10 w-10">
                  {trainer.logo_url && <AvatarImage src={trainer.logo_url} />}
                  <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                    {trainer.display_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{trainer.display_name}</p>
                  {trainer.sports && trainer.sports.length > 0 && (
                    <p className="text-[11px] text-muted-foreground truncate">{trainer.sports.slice(0, 3).join(", ")}</p>
                  )}
                </div>
                <button
                  onClick={() => removeTrainer(trainer.id, trainer.display_name)}
                  className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors active:scale-95"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
