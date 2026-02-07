import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, FileText, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Partner {
  id: string;
  display_name: string;
  partner_type: string;
  bio: string | null;
  location: string | null;
  sports: string[] | null;
  languages: string[] | null;
  logo_url: string | null;
  approved: boolean;
  created_at: string;
  phone_number: string | null;
  verification_status: string;
}

interface Verification {
  id: string;
  partner_id: string;
  date_of_birth: string | null;
  address: string | null;
  personal_id_number: string | null;
  whatsapp: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  social_tiktok: string | null;
  submitted_at: string | null;
  admin_notes: string | null;
}

interface Doc {
  id: string;
  partner_id: string;
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

const VERIFICATION_STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  unverified: { bg: "bg-muted", text: "text-muted-foreground" },
  pending: { bg: "bg-amber-50", text: "text-amber-600" },
  verified: { bg: "bg-emerald-50", text: "text-emerald-600" },
  rejected: { bg: "bg-red-50", text: "text-red-500" },
};

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Partner | null>(null);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [docUrls, setDocUrls] = useState<Record<string, string>>({});
  const [adminNotes, setAdminNotes] = useState("");
  const { toast } = useToast();

  const fetchPartners = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("partner_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setPartners(data as unknown as Partner[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const openPartner = async (partner: Partner) => {
    setSelected(partner);
    setAdminNotes("");

    // Load verification and documents
    const [verRes, docRes] = await Promise.all([
      supabase
        .from("partner_verifications")
        .select("*")
        .eq("partner_id", partner.id)
        .maybeSingle(),
      supabase
        .from("partner_documents")
        .select("*")
        .eq("partner_id", partner.id)
        .order("uploaded_at", { ascending: false }),
    ]);

    setVerification(verRes.data as unknown as Verification | null);
    const docs = (docRes.data as unknown as Doc[]) || [];
    setDocuments(docs);

    // Get signed URLs for documents
    const urls: Record<string, string> = {};
    for (const doc of docs) {
      const { data } = await supabase.storage
        .from("partner-documents")
        .createSignedUrl(doc.document_url, 3600);
      if (data?.signedUrl) urls[doc.id] = data.signedUrl;
    }
    setDocUrls(urls);
  };

  const toggleApproval = async (id: string, approved: boolean) => {
    const { error } = await supabase
      .from("partner_profiles")
      .update({ approved })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: approved ? "Partner approved" : "Partner suspended" });
      fetchPartners();
      if (selected?.id === id) setSelected({ ...selected, approved });
    }
  };

  const updateVerificationStatus = async (partnerId: string, status: string) => {
    const { error } = await supabase
      .from("partner_profiles")
      .update({ verification_status: status })
      .eq("id", partnerId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Update admin notes on verification if provided
    if (adminNotes.trim() && verification) {
      await supabase
        .from("partner_verifications")
        .update({ admin_notes: adminNotes.trim() })
        .eq("id", verification.id);
    }

    toast({ title: `Verification ${status}` });
    fetchPartners();
    if (selected) setSelected({ ...selected, verification_status: status });
  };

  const updateDocStatus = async (docId: string, status: string, note?: string) => {
    const update: Record<string, unknown> = {
      status,
      reviewed_at: new Date().toISOString(),
    };
    if (note) update.admin_notes = note;

    const { error } = await supabase
      .from("partner_documents")
      .update(update)
      .eq("id", docId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Document ${status}` });
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status, admin_notes: note || d.admin_notes } : d))
      );
    }
  };

  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-bold text-foreground">Partner Management</h2>

      {loading ? (
        <p className="text-muted-foreground py-8 text-center">Loading...</p>
      ) : partners.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">No partners yet</p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((partner) => {
                const vs = VERIFICATION_STATUS_STYLES[partner.verification_status] || VERIFICATION_STATUS_STYLES.unverified;
                return (
                  <TableRow key={partner.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {partner.logo_url && <AvatarImage src={partner.logo_url} />}
                          <AvatarFallback className="text-xs">{partner.display_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{partner.display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{partner.partner_type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{partner.phone_number || "—"}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px] font-bold uppercase", vs.bg, vs.text)}>
                        {partner.verification_status || "unverified"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={partner.approved}
                        onCheckedChange={(checked) => toggleApproval(partner.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => openPartner(partner)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.display_name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="info" className="flex-1">Info</TabsTrigger>
                <TabsTrigger value="verification" className="flex-1">Verification</TabsTrigger>
                <TabsTrigger value="documents" className="flex-1">Documents</TabsTrigger>
              </TabsList>

              {/* Info tab */}
              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    {selected.logo_url && <AvatarImage src={selected.logo_url} />}
                    <AvatarFallback>{selected.display_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selected.display_name}</p>
                    <Badge variant="outline" className="capitalize">{selected.partner_type}</Badge>
                  </div>
                </div>

                {selected.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground">Bio</p>
                    <p className="text-sm">{selected.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="font-medium">{selected.location || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-medium">{selected.phone_number || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Languages</p>
                    <p className="font-medium">{selected.languages?.join(", ") || "Not set"}</p>
                  </div>
                </div>

                {selected.sports && selected.sports.length > 0 && (
                  <div>
                    <p className="mb-1 text-sm text-muted-foreground">Sports</p>
                    <div className="flex flex-wrap gap-1">
                      {selected.sports.map((s) => (
                        <Badge key={s} variant="secondary">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <span className="text-sm font-medium">Approved</span>
                  <Switch
                    checked={selected.approved}
                    onCheckedChange={(checked) => toggleApproval(selected.id, checked)}
                  />
                </div>
              </TabsContent>

              {/* Verification tab */}
              <TabsContent value="verification" className="space-y-4 mt-4">
                {verification ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Date of Birth</p>
                        <p className="font-medium">{verification.date_of_birth || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Personal ID</p>
                        <p className="font-medium">{verification.personal_id_number || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Address</p>
                        <p className="font-medium">{verification.address || "Not set"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">WhatsApp</p>
                        <p className="font-medium">{verification.whatsapp || "Not set"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Instagram</p>
                        <p className="font-medium text-xs">{verification.social_instagram || "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Facebook</p>
                        <p className="font-medium text-xs">{verification.social_facebook || "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">TikTok</p>
                        <p className="font-medium text-xs">{verification.social_tiktok || "—"}</p>
                      </div>
                    </div>

                    {/* Admin notes input */}
                    <div>
                      <label className="text-sm text-muted-foreground">Admin Notes</label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes for this partner..."
                        className="mt-1 w-full rounded-lg border border-border bg-background p-3 text-sm resize-none"
                        rows={2}
                      />
                    </div>

                    {/* Verification actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => updateVerificationStatus(selected.id, "verified")}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => updateVerificationStatus(selected.id, "rejected")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No verification details submitted yet.
                  </p>
                )}
              </TabsContent>

              {/* Documents tab */}
              <TabsContent value="documents" className="space-y-3 mt-4">
                {documents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No documents uploaded yet.
                  </p>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {doc.file_name || DOC_TYPE_LABELS[doc.document_type]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {DOC_TYPE_LABELS[doc.document_type]} · {new Date(doc.uploaded_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            doc.status === "approved"
                              ? "bg-emerald-50 text-emerald-600"
                              : doc.status === "rejected"
                              ? "bg-red-50 text-red-500"
                              : "bg-amber-50 text-amber-600"
                          )}
                        >
                          {doc.status}
                        </Badge>
                      </div>

                      {/* View document */}
                      {docUrls[doc.id] && (
                        <a
                          href={docUrls[doc.id]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          View Document
                        </a>
                      )}

                      {/* Approve/Reject buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => updateDocStatus(doc.id, "approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => updateDocStatus(doc.id, "rejected")}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
