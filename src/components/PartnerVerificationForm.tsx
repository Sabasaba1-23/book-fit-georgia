import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationData {
  id?: string;
  partner_id: string;
  date_of_birth: string | null;
  address: string | null;
  personal_id_number: string | null;
  whatsapp: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_tiktok: string | null;
  submitted_at: string | null;
}

interface DocData {
  id: string;
  document_type: string;
  document_url: string;
  file_name: string | null;
  status: string;
  admin_notes: string | null;
  uploaded_at: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  id_card: "ID Card",
  passport: "Passport",
  drivers_license: "Driver's License",
};

interface Props {
  partnerId: string;
  verificationStatus: string;
}

export default function PartnerVerificationForm({ partnerId, verificationStatus }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [documents, setDocuments] = useState<DocData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form fields
  const [dob, setDob] = useState("");
  const [address, setAddress] = useState("");
  const [personalId, setPersonalId] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [selectedDocType, setSelectedDocType] = useState<string>("id_card");

  useEffect(() => {
    loadData();
  }, [partnerId]);

  async function loadData() {
    setLoading(true);
    const [verRes, docRes] = await Promise.all([
      supabase
        .from("partner_verifications")
        .select("*")
        .eq("partner_id", partnerId)
        .maybeSingle(),
      supabase
        .from("partner_documents")
        .select("*")
        .eq("partner_id", partnerId)
        .order("uploaded_at", { ascending: false }),
    ]);

    if (verRes.data) {
      const v = verRes.data as unknown as VerificationData;
      setVerification(v);
      setDob(v.date_of_birth || "");
      setAddress(v.address || "");
      setPersonalId(v.personal_id_number || "");
      setWhatsapp(v.whatsapp || "");
      setInstagram(v.social_instagram || "");
      setFacebook(v.social_facebook || "");
      setTiktok(v.social_tiktok || "");
    }
    if (docRes.data) setDocuments(docRes.data as unknown as DocData[]);
    setLoading(false);
  }

  async function handleSave() {
    if (!dob || !address || !personalId) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload = {
      partner_id: partnerId,
      date_of_birth: dob,
      address: address.trim(),
      personal_id_number: personalId.trim(),
      whatsapp: whatsapp.trim() || null,
      social_instagram: instagram.trim() || null,
      social_facebook: facebook.trim() || null,
      social_tiktok: tiktok.trim() || null,
      submitted_at: new Date().toISOString(),
    };

    let error;
    if (verification?.id) {
      ({ error } = await supabase
        .from("partner_verifications")
        .update(payload)
        .eq("id", verification.id));
    } else {
      ({ error } = await supabase.from("partner_verifications").insert(payload));
    }

    if (!error) {
      // Update partner verification_status to pending
      await supabase
        .from("partner_profiles")
        .update({ verification_status: "pending" })
        .eq("id", partnerId);

      toast({ title: "Verification details submitted!" });
      loadData();
    } else {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  }

  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}_${selectedDocType}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("partner-documents")
      .upload(path, file);

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    // For private bucket, we store the path and use signed URLs
    const { error: insertError } = await supabase.from("partner_documents").insert({
      partner_id: partnerId,
      document_type: selectedDocType,
      document_url: path,
      file_name: file.name,
    });

    if (insertError) {
      toast({ title: "Error saving document", description: insertError.message, variant: "destructive" });
    } else {
      toast({ title: "Document uploaded!" });
      loadData();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDeleteDoc(docId: string, docUrl: string) {
    await supabase.storage.from("partner-documents").remove([docUrl]);
    await supabase.from("partner_documents").delete().eq("id", docId);
    toast({ title: "Document removed" });
    loadData();
  }

  const statusIcon = {
    unverified: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    pending: <Clock className="h-5 w-5 text-amber-500" />,
    verified: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
    rejected: <XCircle className="h-5 w-5 text-red-500" />,
  }[verificationStatus] || <AlertTriangle className="h-5 w-5 text-amber-500" />;

  const statusLabel = {
    unverified: "Not Verified — Please submit your details",
    pending: "Under Review — Our team is reviewing your documents",
    verified: "Verified ✓",
    rejected: "Rejected — Please update your details and resubmit",
  }[verificationStatus] || "Unknown";

  const isEditable = verificationStatus !== "verified";

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className={cn(
        "flex items-center gap-3 rounded-2xl p-4",
        verificationStatus === "verified" ? "bg-emerald-50" :
        verificationStatus === "rejected" ? "bg-red-50" : "bg-amber-50"
      )}>
        {statusIcon}
        <div>
          <p className={cn(
            "text-sm font-bold",
            verificationStatus === "verified" ? "text-emerald-700" :
            verificationStatus === "rejected" ? "text-red-700" : "text-amber-700"
          )}>
            Identity Verification
          </p>
          <p className={cn(
            "text-[13px]",
            verificationStatus === "verified" ? "text-emerald-600" :
            verificationStatus === "rejected" ? "text-red-600" : "text-amber-600"
          )}>
            {statusLabel}
          </p>
        </div>
      </div>

      {verificationStatus !== "verified" && (
        <p className="text-[13px] text-muted-foreground">
          Your listings can be created but won't be approved by admin until your identity is verified.
        </p>
      )}

      {/* Personal Details */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Personal Details <span className="text-destructive">*</span>
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Date of Birth</label>
            <Input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              disabled={!isEditable}
              className="h-12 rounded-xl border-border bg-card"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Address / Where you live</label>
            <Input
              placeholder="e.g. Tbilisi, Vake"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!isEditable}
              className="h-12 rounded-xl border-border bg-card"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Personal ID Number</label>
            <Input
              placeholder="Enter your personal ID number"
              value={personalId}
              onChange={(e) => setPersonalId(e.target.value)}
              disabled={!isEditable}
              className="h-12 rounded-xl border-border bg-card"
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Contact & Socials <span className="text-xs font-normal normal-case text-muted-foreground/60">(optional)</span>
        </p>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">WhatsApp</label>
            <Input
              placeholder="+995 5XX XXX XXX"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              disabled={!isEditable}
              className="h-12 rounded-xl border-border bg-card"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-muted-foreground">Instagram</label>
              <Input
                placeholder="@handle"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                disabled={!isEditable}
                className="h-10 rounded-xl border-border bg-card text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-muted-foreground">Facebook</label>
              <Input
                placeholder="URL"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                disabled={!isEditable}
                className="h-10 rounded-xl border-border bg-card text-xs"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-muted-foreground">TikTok</label>
              <Input
                placeholder="@handle"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                disabled={!isEditable}
                className="h-10 rounded-xl border-border bg-card text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Identity Document <span className="text-destructive">*</span>
        </p>

        {/* Existing documents */}
        {documents.length > 0 && (
          <div className="space-y-2 mb-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.file_name || DOC_TYPE_LABELS[doc.document_type]}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      "text-[10px] font-bold uppercase",
                      doc.status === "approved" ? "text-emerald-600" :
                      doc.status === "rejected" ? "text-red-500" : "text-amber-600"
                    )}>
                      {doc.status}
                    </span>
                    {doc.admin_notes && doc.status === "rejected" && (
                      <span className="text-[10px] text-red-400 italic truncate">{doc.admin_notes}</span>
                    )}
                  </div>
                </div>
                {isEditable && (
                  <button
                    onClick={() => handleDeleteDoc(doc.id, doc.document_url)}
                    className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {isEditable && (
          <div className="space-y-3">
            <div className="flex gap-2">
              {(["id_card", "passport", "drivers_license"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedDocType(t)}
                  className={cn(
                    "flex-1 rounded-xl py-2 text-[11px] font-bold uppercase tracking-wider transition-all",
                    selectedDocType === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {DOC_TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-6 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {uploading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleDocUpload}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Save button */}
      {isEditable && (
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground"
        >
          {saving ? "Saving..." : verification?.submitted_at ? "Update & Resubmit" : "Submit for Verification"}
        </Button>
      )}
    </div>
  );
}
