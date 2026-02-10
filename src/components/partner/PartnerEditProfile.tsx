import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { ArrowLeft, Pencil, Check, X, MapPin, Phone, Languages, Dumbbell, FileText } from "lucide-react";
import EditableTagsField from "@/components/EditableTagsField";
import { SPORTS } from "@/constants/sports";

interface PartnerProfile {
  id: string;
  display_name: string;
  bio: string | null;
  location: string | null;
  phone_number: string | null;
  sports: string[] | null;
  languages: string[] | null;
}

interface Props {
  profile: PartnerProfile;
  onBack: () => void;
  onRefetch: () => void;
}

export default function PartnerEditProfile({ profile, onBack, onRefetch }: Props) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit(field: string, currentValue: string | null) {
    setEditingField(field);
    setEditValue(currentValue || "");
  }

  async function saveEdit(field: string) {
    setSaving(true);
    const { error } = await supabase
      .from("partner_profiles")
      .update({ [field]: editValue.trim() || null })
      .eq("id", profile.id);

    if (error) {
      toast({ title: t("failedToUpdate"), variant: "destructive" });
    } else {
      toast({ title: t("updatedLabel") });
      onRefetch();
    }
    setEditingField(null);
    setSaving(false);
  }

  function cancelEdit() {
    setEditingField(null);
    setEditValue("");
  }

  const fields: {
    key: string;
    label: string;
    value: string | null;
    icon: React.ReactNode;
    isTextarea?: boolean;
  }[] = [
    { key: "display_name", label: t("displayNameLabel"), value: profile.display_name, icon: <Pencil className="h-4 w-4 text-muted-foreground" /> },
    { key: "bio", label: t("bioAbout"), value: profile.bio, icon: <FileText className="h-4 w-4 text-muted-foreground" />, isTextarea: true },
    { key: "location", label: t("locationField"), value: profile.location, icon: <MapPin className="h-4 w-4 text-muted-foreground" /> },
    { key: "phone_number", label: t("phoneField"), value: profile.phone_number, icon: <Phone className="h-4 w-4 text-muted-foreground" /> },
  ];

  return (
    <div className="relative z-10 px-5 pt-4 pb-8 space-y-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-card transition-colors hover:bg-muted active:scale-95"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="text-[20px] font-semibold text-foreground">{t("editPublicProfileTitle")}</h2>
      </div>

      <div className="space-y-3">
        {fields.map((f) => (
          <EditableField
            key={f.key}
            label={f.label}
            value={f.value}
            field={f.key}
            editing={editingField === f.key}
            editValue={editValue}
            saving={saving}
            onStartEdit={startEdit}
            onSave={saveEdit}
            onCancel={cancelEdit}
            onChange={setEditValue}
            isTextarea={f.isTextarea}
            icon={f.icon}
            saveLabel={t("saveBtn")}
            cancelLabel={t("cancel")}
            notSetLabel={t("notSetTapToAdd")}
          />
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">{t("specializationsLanguages")}</p>
        <EditableTagsField
          label={t("sportsLabel")}
          icon={<Dumbbell className="h-4 w-4 text-muted-foreground" />}
          values={profile.sports || []}
          allOptions={[...SPORTS]}
          field="sports"
          profileId={profile.id}
          onRefetch={onRefetch}
        />
        <EditableTagsField
          label={t("languagesLabel")}
          icon={<Languages className="h-4 w-4 text-muted-foreground" />}
          values={profile.languages || []}
          allOptions={["English", "Georgian", "Russian", "Turkish", "Arabic", "French", "German", "Spanish", "Chinese", "Japanese", "Korean"]}
          field="languages"
          profileId={profile.id}
          onRefetch={onRefetch}
        />
      </div>
    </div>
  );
}

function EditableField({
  label, value, field, editing, editValue, saving,
  onStartEdit, onSave, onCancel, onChange, isTextarea, icon,
  saveLabel, cancelLabel, notSetLabel,
}: {
  label: string; value: string | null; field: string; editing: boolean;
  editValue: string; saving: boolean;
  onStartEdit: (field: string, val: string | null) => void;
  onSave: (field: string) => void; onCancel: () => void;
  onChange: (val: string) => void; isTextarea?: boolean; icon?: React.ReactNode;
  saveLabel: string; cancelLabel: string; notSetLabel: string;
}) {
  if (editing) {
    return (
      <div className="rounded-2xl bg-card border-2 border-primary/30 p-4 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{label}</p>
        {isTextarea ? (
          <Textarea value={editValue} onChange={(e) => onChange(e.target.value)} rows={3} className="rounded-xl border-border bg-background resize-none text-sm" autoFocus />
        ) : (
          <Input value={editValue} onChange={(e) => onChange(e.target.value)} className="h-11 rounded-xl border-border bg-background text-sm" autoFocus />
        )}
        <div className="flex gap-2">
          <button onClick={() => onSave(field)} disabled={saving} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground">
            <Check className="h-3.5 w-3.5" /> {saveLabel}
          </button>
          <button onClick={onCancel} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border py-2.5 text-xs font-bold text-muted-foreground">
            <X className="h-3.5 w-3.5" /> {cancelLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => onStartEdit(field, value)} className="w-full text-left rounded-2xl bg-card border border-border/50 p-4 flex items-start gap-3 transition-colors hover:border-primary/30 active:bg-muted/50">
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
        <p className={cn("text-sm", value ? "text-foreground" : "text-muted-foreground italic")}>
          {value || notSetLabel}
        </p>
      </div>
      <Pencil className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-1" />
    </button>
  );
}
