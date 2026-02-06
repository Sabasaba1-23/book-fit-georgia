import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Eye } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Listing {
  id: string;
  title_en: string;
  title_ka: string | null;
  sport: string;
  training_type: string;
  scheduled_at: string;
  duration_minutes: number;
  price_gel: number;
  max_spots: number;
  status: string;
  description_en: string | null;
  description_ka: string | null;
  equipment_notes_en: string | null;
  admin_notes: string | null;
  background_image_url: string | null;
  created_at: string;
  partner_profiles: {
    display_name: string;
    partner_type: string;
    location: string | null;
  };
}

export default function AdminListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [tab, setTab] = useState("pending");
  const { toast } = useToast();

  const fetchListings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("training_listings")
      .select("*, partner_profiles(display_name, partner_type, location)")
      .order("created_at", { ascending: false });

    if (data) setListings(data as unknown as Listing[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const updateStatus = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("training_listings")
      .update({ status, admin_notes: adminNotes || null })
      .eq("id", id);

    if (error) {
      toast({ title: "Error updating listing", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Listing ${status}` });
      setSelected(null);
      setAdminNotes("");
      fetchListings();
    }
  };

  const filteredListings = listings.filter((l) => {
    if (tab === "all") return true;
    return l.status === tab;
  });

  const statusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      approved: "default",
      pending: "secondary",
      rejected: "destructive",
      draft: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-bold text-foreground">Listing Management</h2>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({listings.filter((l) => l.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <p className="text-muted-foreground py-8 text-center">Loading...</p>
          ) : filteredListings.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">No listings in this category</p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredListings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="font-medium">{listing.title_en}</TableCell>
                      <TableCell>{(listing.partner_profiles as any)?.display_name}</TableCell>
                      <TableCell>{listing.sport}</TableCell>
                      <TableCell className="capitalize">{listing.training_type.replace("_", " ")}</TableCell>
                      <TableCell>{Number(listing.price_gel)} GEL</TableCell>
                      <TableCell>{format(new Date(listing.scheduled_at), "MMM d, HH:mm")}</TableCell>
                      <TableCell>{statusBadge(listing.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => { setSelected(listing); setAdminNotes(listing.admin_notes || ""); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {listing.status === "pending" && (
                            <>
                              <Button size="sm" variant="ghost" className="text-primary" onClick={() => updateStatus(listing.id, "approved")}>
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatus(listing.id, "rejected")}>
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.title_en}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {selected.background_image_url && (
                <img src={selected.background_image_url} alt="" className="h-40 w-full rounded-lg object-cover" />
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Partner:</span>
                  <p className="font-medium">{(selected.partner_profiles as any)?.display_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium capitalize">{(selected.partner_profiles as any)?.partner_type}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Sport:</span>
                  <p className="font-medium">{selected.sport}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Training:</span>
                  <p className="font-medium capitalize">{selected.training_type.replace("_", " ")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Price:</span>
                  <p className="font-medium">{Number(selected.price_gel)} GEL</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Spots:</span>
                  <p className="font-medium">{selected.max_spots}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium">{format(new Date(selected.scheduled_at), "MMM d, yyyy HH:mm")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <p className="font-medium">{selected.duration_minutes} min</p>
                </div>
              </div>

              {selected.description_en && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{selected.description_en}</p>
                </div>
              )}

              {selected.equipment_notes_en && (
                <div>
                  <p className="text-sm text-muted-foreground">Equipment Notes</p>
                  <p className="text-sm italic">{selected.equipment_notes_en}</p>
                </div>
              )}

              <div>
                <p className="mb-1 text-sm text-muted-foreground">Admin Notes</p>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes for the partner (optional)..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => updateStatus(selected.id, "approved")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => updateStatus(selected.id, "rejected")}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
