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
import { Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
}

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Partner | null>(null);
  const { toast } = useToast();

  const fetchPartners = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("partner_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setPartners(data as Partner[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchPartners();
  }, []);

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
                <TableHead>Location</TableHead>
                <TableHead>Sports</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners.map((partner) => (
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
                  <TableCell>{partner.location || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {partner.sports?.slice(0, 3).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                      {(partner.sports?.length ?? 0) > 3 && (
                        <Badge variant="secondary" className="text-xs">+{(partner.sports?.length ?? 0) - 3}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={partner.approved}
                      onCheckedChange={(checked) => toggleApproval(partner.id, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setSelected(partner)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.display_name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
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
                  onCheckedChange={(checked) => {
                    toggleApproval(selected.id, checked);
                    setSelected({ ...selected, approved: checked });
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
