import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BadgeIcon } from "@/components/badges/BadgeIcon";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, X, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface BadgeDef {
  key: string;
  title: string;
  description: string | null;
  icon: string;
  tier: string;
  visibility_priority: number;
}

interface EntityBadgeRow {
  id: string;
  entity_type: string;
  entity_id: string;
  badge_key: string;
  status: string;
  source: string;
  awarded_at: string;
  revoked_at: string | null;
  notes: string | null;
  entity_name?: string;
}

export default function AdminBadges() {
  const { toast } = useToast();
  const [badges, setBadges] = useState<BadgeDef[]>([]);
  const [entityBadges, setEntityBadges] = useState<EntityBadgeRow[]>([]);
  const [partners, setPartners] = useState<{ id: string; display_name: string; partner_type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAward, setShowAward] = useState(false);
  const [awardEntity, setAwardEntity] = useState<{ id: string; name: string; type: string } | null>(null);
  const [awardBadgeKey, setAwardBadgeKey] = useState("");
  const [awardNotes, setAwardNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchAll() {
    setLoading(true);
    const [badgesRes, entityRes, partnersRes] = await Promise.all([
      supabase.from("badges").select("key, title, description, icon, tier, visibility_priority").order("visibility_priority", { ascending: false }),
      supabase.from("entity_badges").select("*").order("awarded_at", { ascending: false }),
      supabase.from("partner_profiles").select("id, display_name, partner_type"),
    ]);
    if (badgesRes.data) setBadges(badgesRes.data as BadgeDef[]);
    if (entityRes.data) setEntityBadges(entityRes.data as EntityBadgeRow[]);
    if (partnersRes.data) setPartners(partnersRes.data as any[]);
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  const getEntityName = (entityId: string) => {
    const p = partners.find((pp) => pp.id === entityId);
    return p?.display_name || entityId.slice(0, 8);
  };

  async function handleAward() {
    if (!awardEntity || !awardBadgeKey) return;
    setSaving(true);
    const entityType = awardEntity.type === "gym" ? "studio" : "trainer";
    const { error } = await supabase.from("entity_badges").upsert({
      entity_type: entityType,
      entity_id: awardEntity.id,
      badge_key: awardBadgeKey,
      status: "active",
      source: "manual_admin",
      awarded_at: new Date().toISOString(),
      notes: awardNotes || null,
    }, { onConflict: "entity_type,entity_id,badge_key" });

    if (error) {
      toast({ title: "Failed to award badge", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Badge awarded!" });
      setShowAward(false);
      setAwardBadgeKey("");
      setAwardNotes("");
      setAwardEntity(null);
      fetchAll();
    }
    setSaving(false);
  }

  async function handleRevoke(eb: EntityBadgeRow) {
    const { error } = await supabase.from("entity_badges")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("id", eb.id);
    if (error) {
      toast({ title: "Failed to revoke", variant: "destructive" });
    } else {
      toast({ title: "Badge revoked" });
      fetchAll();
    }
  }

  const filteredBadges = entityBadges.filter((eb) => {
    if (!search) return true;
    const name = getEntityName(eb.entity_id);
    return name.toLowerCase().includes(search.toLowerCase()) || eb.badge_key.includes(search.toLowerCase());
  });

  // Trust badges only (admin-controlled)
  const trustBadges = badges.filter((b) => b.tier === "trust");

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="px-5 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-extrabold text-foreground">Badges</h1>
        </div>
        <button
          onClick={() => setShowAward(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Award Badge
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by partner name or badge..."
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Awarded badges list */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Awarded Badges ({filteredBadges.length})
        </p>
        {filteredBadges.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No badges awarded yet</p>
        ) : (
          filteredBadges.map((eb) => {
            const badge = badges.find((b) => b.key === eb.badge_key);
            if (!badge) return null;
            return (
              <div
                key={eb.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl bg-card border border-border/50 p-4",
                  eb.status === "revoked" && "opacity-50"
                )}
              >
                <BadgeIcon icon={badge.icon} tier={badge.tier} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{badge.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {getEntityName(eb.entity_id)} · {eb.entity_type} · {eb.source.replace("_", " ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                    eb.status === "active" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" :
                    eb.status === "revoked" ? "bg-red-50 text-red-500 dark:bg-red-950/30 dark:text-red-400" :
                    "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                  )}>
                    {eb.status}
                  </span>
                  {eb.status === "active" && (
                    <button
                      onClick={() => handleRevoke(eb)}
                      className="text-xs text-destructive font-semibold hover:underline"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Award Badge Dialog */}
      <Dialog open={showAward} onOpenChange={setShowAward}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Award Badge</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Select Partner */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Select Partner</p>
              <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded-xl p-2">
                {partners.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setAwardEntity({ id: p.id, name: p.display_name, type: p.partner_type })}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      awardEntity?.id === p.id ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
                    )}
                  >
                    {p.display_name}
                    <span className="text-xs text-muted-foreground ml-1.5">({p.partner_type})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Select Badge */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Select Badge</p>
              <div className="space-y-1.5">
                {trustBadges.map((badge) => (
                  <button
                    key={badge.key}
                    onClick={() => setAwardBadgeKey(badge.key)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-colors",
                      awardBadgeKey === badge.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    )}
                  >
                    <BadgeIcon icon={badge.icon} tier={badge.tier} size="sm" />
                    <span className="text-sm font-semibold">{badge.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Notes (optional)</p>
              <Input
                value={awardNotes}
                onChange={(e) => setAwardNotes(e.target.value)}
                placeholder="Reason for awarding..."
                className="rounded-xl"
              />
            </div>

            <button
              onClick={handleAward}
              disabled={!awardEntity || !awardBadgeKey || saving}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Awarding..." : "Award Badge"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
