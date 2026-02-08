import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Upload, Shield, CheckCircle2, FileText, Trash2, Building2, User } from "lucide-react";

const REPRESENTATIVE_ROLES = ["Owner", "Manager", "Representative"];
const BUSINESS_TYPES = ["Gym", "Studio", "Sports Club", "Wellness Center", "Other"];

interface DocData {
  id: string;
  document_type: string;
  document_url: string;
  file_name: string | null;
  status: string;
}

interface Props {
  partnerId: string;
  displayName: string;
  onComplete: () => void;
  onClose: () => void;
}

export default function GymVerificationFlow({ partnerId, displayName, onComplete, onClose }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const personalDocRef = useRef<HTMLInputElement>(null);
  const businessDocRef = useRef<HTMLInputElement>(null);

  const [activePart, setActivePart] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState<DocData[]>([]);

  // Part 1 - Representative
  const [repName, setRepName] = useState("");
  const [repRole, setRepRole] = useState("");

  // Part 2 - Business
  const [bizName, setBizName] = useState(displayName || "");
  const [bizType, setBizType] = useState("");
  const [bizAddress, setBizAddress] = useState("");
  const [websiteSocial, setWebsiteSocial] = useState("");

  useEffect(() => {
    loadExisting();
    loadDocuments();
  }, [partnerId]);

  async function loadExisting() {
    const { data } = await supabase
      .from("partner_verifications")
      .select("*")
      .eq("partner_id", partnerId)
      .maybeSingle();

    if (data) {
      const d = data as any;
      setRepName(d.full_name || "");
      setRepRole(d.representative_role || "");
      setBizName(d.country_city ? displayName : displayName);
      setBizType(d.business_type || "");
      setBizAddress(d.country_city || d.address || "");
      setWebsiteSocial(d.website_social || "");
    }
  }

  async function loadDocuments() {
    const { data } = await supabase
      .from("partner_documents")
      .select("id, document_type, document_url, file_name, status")
      .eq("partner_id", partnerId)
      .order("uploaded_at", { ascending: false });
    if (data) setDocuments(data as DocData[]);
  }

  async function handleSubmit() {
    if (!repName.trim()) {
      toast({ title: "Please enter the representative's name", variant: "destructive" });
      setActivePart(1);
      return;
    }

    setSaving(true);
    const payload = {
      partner_id: partnerId,
      full_name: repName.trim(),
      representative_role: repRole,
      business_type: bizType,
      country_city: bizAddress.trim(),
      website_social: websiteSocial.trim() || null,
      verification_step: 2,
      submitted_at: new Date().toISOString(),
    } as any;

    const { data: existing } = await supabase
      .from("partner_verifications")
      .select("id")
      .eq("partner_id", partnerId)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase.from("partner_verifications").update(payload).eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("partner_verifications").insert(payload));
    }

    if (!error) {
      await supabase
        .from("partner_profiles")
        .update({ verification_status: "pending" })
        .eq("id", partnerId);
      toast({ title: "Verification submitted! 🎉", description: "We'll review your business within 24-48 hours." });
      onComplete();
    } else {
      toast({ title: "Error submitting", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  }

  async function handleDocUpload(e: React.ChangeEvent<HTMLInputElement>, docType: string) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}_${docType}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("partner-documents").upload(path, file);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    await supabase.from("partner_documents").insert({
      partner_id: partnerId,
      document_type: docType,
      document_url: path,
      file_name: file.name,
    });

    toast({ title: "Document uploaded!" });
    loadDocuments();
    setUploading(false);
    if (personalDocRef.current) personalDocRef.current.value = "";
    if (businessDocRef.current) businessDocRef.current.value = "";
  }

  async function handleDeleteDoc(docId: string, docUrl: string) {
    await supabase.storage.from("partner-documents").remove([docUrl]);
    await supabase.from("partner_documents").delete().eq("id", docId);
    toast({ title: "Document removed" });
    loadDocuments();
  }

  const personalDocs = documents.filter((d) => d.document_type === "id_card" || d.document_type === "passport" || d.document_type === "drivers_license");
  const businessDocs = documents.filter((d) => d.document_type === "business_registration");

  const part1Complete = !!repName.trim() && personalDocs.length > 0;
  const part2Complete = !!bizName.trim() && !!bizType;
  const progressPercent = ((part1Complete ? 1 : 0) + (part2Complete ? 1 : 0)) / 2 * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pb-4 pt-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            Business Verification
          </p>
          <button onClick={onClose} className="text-xs font-medium text-muted-foreground hover:text-foreground">
            Save & Close
          </button>
        </div>
        <Progress value={progressPercent} className="h-1.5 rounded-full" />
      </div>

      {/* Part Tabs */}
      <div className="mx-5 mb-4 flex gap-2">
        <button
          onClick={() => setActivePart(1)}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all",
            activePart === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          <User className="h-4 w-4" />
          Representative
          {part1Complete && <CheckCircle2 className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => setActivePart(2)}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all",
            activePart === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          <Building2 className="h-4 w-4" />
          Business
          {part2Complete && <CheckCircle2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {activePart === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Representative</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tell us about the person representing your business.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Full Name <span className="text-destructive">*</span></label>
                <Input value={repName} onChange={(e) => setRepName(e.target.value)} placeholder="Representative's full name" className="h-12 rounded-xl border-border bg-card" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-foreground">Role</label>
                <div className="flex gap-2">
                  {REPRESENTATIVE_ROLES.map((role) => (
                    <button
                      key={role}
                      onClick={() => setRepRole(role)}
                      className={cn(
                        "flex-1 rounded-xl py-2.5 text-xs font-bold transition-all",
                        repRole === role ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Personal ID</label>
                <div className="rounded-xl bg-primary/5 p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p className="text-[11px] text-muted-foreground">Only visible to our admin team. Never shown publicly.</p>
                  </div>
                </div>

                {personalDocs.map((doc) => (
                  <div key={doc.id} className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <p className="flex-1 text-sm font-medium text-foreground truncate">{doc.file_name || doc.document_type}</p>
                    <button onClick={() => handleDeleteDoc(doc.id, doc.document_url)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => personalDocRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-6 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {uploading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading..." : "Upload ID Document"}
                </button>
                <input ref={personalDocRef} type="file" accept="image/*,.pdf" onChange={(e) => handleDocUpload(e, "id_card")} className="hidden" />
              </div>
            </div>
          </div>
        )}

        {activePart === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Business Details</h2>
              <p className="mt-1 text-sm text-muted-foreground">Tell us about your gym or studio.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Business Name <span className="text-destructive">*</span></label>
                <Input value={bizName} onChange={(e) => setBizName(e.target.value)} placeholder="Your business name" className="h-12 rounded-xl border-border bg-card" />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-foreground">Business Type <span className="text-destructive">*</span></label>
                <div className="flex flex-wrap gap-2">
                  {BUSINESS_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setBizType(type)}
                      className={cn(
                        "rounded-full px-3.5 py-2 text-xs font-semibold transition-all",
                        bizType === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">City / Address</label>
                <Input value={bizAddress} onChange={(e) => setBizAddress(e.target.value)} placeholder="e.g. Tbilisi, Vake district" className="h-12 rounded-xl border-border bg-card" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Business Registration Document
                  <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(optional)</span>
                </label>

                {businessDocs.map((doc) => (
                  <div key={doc.id} className="mb-2 flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <p className="flex-1 text-sm font-medium text-foreground truncate">{doc.file_name || "Business doc"}</p>
                    <button onClick={() => handleDeleteDoc(doc.id, doc.document_url)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted text-muted-foreground">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => businessDocRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {uploading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading..." : "Upload Document"}
                </button>
                <input ref={businessDocRef} type="file" accept="image/*,.pdf" onChange={(e) => handleDocUpload(e, "business_registration")} className="hidden" />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">
                  Website or Social Link
                  <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">(optional)</span>
                </label>
                <Input value={websiteSocial} onChange={(e) => setWebsiteSocial(e.target.value)} placeholder="https://..." className="h-12 rounded-xl border-border bg-card" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm px-5 pb-6 pt-3">
        <Button onClick={handleSubmit} disabled={saving || uploading} className="h-12 w-full rounded-xl font-bold">
          {saving ? "Submitting..." : "Submit for Verification"}
          <CheckCircle2 className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
