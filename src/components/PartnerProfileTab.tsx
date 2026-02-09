import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Camera, LogOut, ExternalLink, Pencil, Check, X, MapPin, Phone, Globe, Languages, Dumbbell } from "lucide-react";
import EditableTagsField from "@/components/EditableTagsField";
import { SPORTS } from "@/constants/sports";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import PartnerBadgesSection from "@/components/PartnerBadgesSection";

interface PartnerProfile {
  id: string;
  display_name: string;
  logo_url: string | null;
  partner_type: string;
  approved: boolean;
  bio: string | null;
  sports: string[] | null;
  location: string | null;
  languages: string[] | null;
  phone_number: string | null;
  verification_status: string;
}

interface Props {
  profile: PartnerProfile;
  user: User;
  onRefetch: () => void;
  onSignOut: () => Promise<void>;
}

export default function PartnerProfileTab({ profile, user, onRefetch, onSignOut }: Props) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/logo_${Date.now()}.${ext}`;

    // Delete old photo if exists
    if (profile.logo_url) {
      await supabase.storage.from("avatars").remove([profile.logo_url]);
    }

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

    await supabase.from("partner_profiles").update({ logo_url: publicUrl }).eq("id", profile.id);
    toast({ title: "Photo updated!" });
    onRefetch();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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
      toast({ title: "Failed to update", variant: "destructive" });
    } else {
      toast({ title: "Updated!" });
      onRefetch();
    }
    setEditingField(null);
    setSaving(false);
  }

  function cancelEdit() {
    setEditingField(null);
    setEditValue("");
  }

  return (
    <div className="relative z-10 px-5 pt-4 space-y-6 pb-8">
      {/* Profile photo + name */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar className="h-24 w-24 border-3 border-primary/20">
            {profile.logo_url ? <AvatarImage src={profile.logo_url} /> : null}
            <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
              {profile.display_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-90"
          >
            {uploading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-extrabold text-foreground">{profile.display_name}</h2>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary capitalize">{profile.partner_type}</p>
        </div>
      </div>

      {/* Preview public profile */}
      <button
        onClick={() => navigate(`/partner/${profile.id}`)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-primary/20 bg-primary/5 py-3.5 text-sm font-bold text-primary transition-all hover:bg-primary/10 active:scale-[0.98]"
      >
        <ExternalLink className="h-4 w-4" />
        Preview Public Profile
      </button>

      {/* Editable fields */}
      <div className="space-y-3">
        <ProfileField
          label="Display Name"
          value={profile.display_name}
          field="display_name"
          editing={editingField === "display_name"}
          editValue={editValue}
          saving={saving}
          onStartEdit={startEdit}
          onSave={saveEdit}
          onCancel={cancelEdit}
          onChange={setEditValue}
          icon={<Pencil className="h-4 w-4 text-muted-foreground" />}
        />
        <ProfileField
          label="Bio"
          value={profile.bio}
          field="bio"
          editing={editingField === "bio"}
          editValue={editValue}
          saving={saving}
          onStartEdit={startEdit}
          onSave={saveEdit}
          onCancel={cancelEdit}
          onChange={setEditValue}
          isTextarea
          icon={<Pencil className="h-4 w-4 text-muted-foreground" />}
        />
        <ProfileField
          label="Location"
          value={profile.location}
          field="location"
          editing={editingField === "location"}
          editValue={editValue}
          saving={saving}
          onStartEdit={startEdit}
          onSave={saveEdit}
          onCancel={cancelEdit}
          onChange={setEditValue}
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />}
        />
        <ProfileField
          label="Phone Number"
          value={profile.phone_number}
          field="phone_number"
          editing={editingField === "phone_number"}
          editValue={editValue}
          saving={saving}
          onStartEdit={startEdit}
          onSave={saveEdit}
          onCancel={cancelEdit}
          onChange={setEditValue}
          icon={<Phone className="h-4 w-4 text-muted-foreground" />}
        />

        {/* Read-only fields */}
        <div className="rounded-2xl bg-card border border-border/50 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Account Status</p>
          <p className={cn("text-sm font-semibold", profile.approved ? "text-emerald-600" : "text-amber-600")}>
            {profile.approved ? "Approved" : "Pending Approval"}
          </p>
        </div>

        {/* Editable Sports */}
        <EditableTagsField
          label="Sports"
          icon={<Dumbbell className="h-4 w-4 text-muted-foreground" />}
          values={profile.sports || []}
          allOptions={[...SPORTS]}
          field="sports"
          profileId={profile.id}
          onRefetch={onRefetch}
        />

        {/* Editable Languages */}
        <EditableTagsField
          label="Languages"
          icon={<Languages className="h-4 w-4 text-muted-foreground" />}
          values={profile.languages || []}
          allOptions={["English", "Georgian", "Russian", "Turkish", "Arabic", "French", "German", "Spanish", "Chinese", "Japanese", "Korean"]}
          field="languages"
          profileId={profile.id}
          onRefetch={onRefetch}
        />
      </div>

      {/* Log Out */}
      <button
        onClick={onSignOut}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-destructive/20 bg-destructive/5 py-3.5 text-sm font-bold text-destructive transition-all hover:bg-destructive/10 active:scale-[0.98]"
      >
        <LogOut className="h-4 w-4" />
        Log Out
      </button>
    </div>
  );
}

// Reusable editable field
function ProfileField({
  label,
  value,
  field,
  editing,
  editValue,
  saving,
  onStartEdit,
  onSave,
  onCancel,
  onChange,
  isTextarea,
  icon,
}: {
  label: string;
  value: string | null;
  field: string;
  editing: boolean;
  editValue: string;
  saving: boolean;
  onStartEdit: (field: string, val: string | null) => void;
  onSave: (field: string) => void;
  onCancel: () => void;
  onChange: (val: string) => void;
  isTextarea?: boolean;
  icon?: React.ReactNode;
}) {
  if (editing) {
    return (
      <div className="rounded-2xl bg-card border-2 border-primary/30 p-4 space-y-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{label}</p>
        {isTextarea ? (
          <Textarea
            value={editValue}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
            className="rounded-xl border-border bg-background resize-none text-sm"
            autoFocus
          />
        ) : (
          <Input
            value={editValue}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 rounded-xl border-border bg-background text-sm"
            autoFocus
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={() => onSave(field)}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground"
          >
            <Check className="h-3.5 w-3.5" /> Save
          </button>
          <button
            onClick={onCancel}
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
      onClick={() => onStartEdit(field, value)}
      className="w-full text-left rounded-2xl bg-card border border-border/50 p-4 flex items-start gap-3 transition-colors hover:border-primary/30 active:bg-muted/50"
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
        <p className={cn("text-sm", value ? "text-foreground" : "text-muted-foreground italic")}>
          {value || "Not set — tap to add"}
        </p>
      </div>
      <Pencil className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-1" />
    </button>
  );
}
