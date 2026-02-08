import { useState } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Pencil, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableTagsFieldProps {
  label: string;
  icon: React.ReactNode;
  values: string[];
  allOptions: string[];
  field: string;
  profileId: string;
  onRefetch: () => void;
}

export default function EditableTagsField({
  label,
  icon,
  values,
  allOptions,
  field,
  profileId,
  onRefetch,
}: EditableTagsFieldProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>(values);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const toggle = (item: string) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((s) => s !== item) : [...prev, item]
    );
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("partner_profiles")
      .update({ [field]: selected.length > 0 ? selected : null })
      .eq("id", profileId);

    if (error) {
      toast({ title: "Failed to update", variant: "destructive" });
    } else {
      toast({ title: "Updated!" });
      onRefetch();
    }
    setEditing(false);
    setSaving(false);
  };

  const cancel = () => {
    setSelected(values);
    setSearch("");
    setEditing(false);
  };

  if (editing) {
    const filtered = allOptions.filter((o) =>
      o.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div className="rounded-2xl bg-card border-2 border-primary/30 p-4 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{label}</p>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((s) => (
              <button
                key={s}
                onClick={() => toggle(s)}
                className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground transition-all active:scale-95"
              >
                {s}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="h-10 rounded-xl border-border bg-background pl-9 text-sm"
            autoFocus
          />
        </div>

        {/* Options grid */}
        <div className="max-h-40 overflow-y-auto flex flex-wrap gap-1.5">
          {filtered
            .filter((o) => !selected.includes(o))
            .map((o) => (
              <button
                key={o}
                onClick={() => toggle(o)}
                className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground transition-all hover:border-primary/40 active:scale-95"
              >
                {o}
              </button>
            ))}
        </div>

        {/* Save/Cancel */}
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground"
          >
            <Check className="h-3.5 w-3.5" /> Save
          </button>
          <button
            onClick={cancel}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-bold text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setSelected(values); setEditing(true); }}
      className="w-full text-left rounded-2xl bg-card border border-border/50 p-4 flex items-start gap-3 transition-colors hover:border-primary/30 active:bg-muted/50"
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">{label}</p>
        {values.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {values.map((s) => (
              <span key={s} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{s}</span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Not set — tap to add</p>
        )}
      </div>
      <Pencil className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-1" />
    </button>
  );
}
