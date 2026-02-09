import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Star, Trash2, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaItem {
  id: string;
  image_url: string;
  sort_order: number;
  is_featured: boolean;
}

interface Props {
  partnerId: string;
  userId: string;
  onBack: () => void;
}

export default function PartnerPhotosMedia({ partnerId, userId, onBack }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function fetchMedia() {
    const { data } = await supabase
      .from("partner_media" as any)
      .select("id, image_url, sort_order, is_featured")
      .eq("partner_id", partnerId)
      .order("sort_order", { ascending: true });
    if (data) setMedia(data as any as MediaItem[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchMedia();
  }, [partnerId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/media_${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

    const nextOrder = media.length > 0 ? Math.max(...media.map(m => m.sort_order)) + 1 : 0;
    await (supabase.from("partner_media" as any) as any).insert({
      partner_id: partnerId,
      image_url: publicUrl,
      sort_order: nextOrder,
      is_featured: media.length < 4,
    });
    toast({ title: "Photo uploaded!" });
    fetchMedia();
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDelete(item: MediaItem) {
    await (supabase.from("partner_media" as any) as any).delete().eq("id", item.id);
    toast({ title: "Photo deleted" });
    fetchMedia();
  }

  async function toggleFeatured(item: MediaItem) {
    await (supabase.from("partner_media" as any) as any)
      .update({ is_featured: !item.is_featured })
      .eq("id", item.id);
    fetchMedia();
  }

  return (
    <div className="relative z-10 px-5 pt-4 pb-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-card transition-colors hover:bg-muted active:scale-95"
        >
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h2 className="text-[20px] font-semibold text-foreground flex-1">Photos & Media</h2>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-transform active:scale-95"
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : media.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
            <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-[15px] font-semibold text-foreground mb-1">No photos yet</p>
          <p className="text-sm text-muted-foreground mb-6">Upload photos to showcase your work and space</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" /> Upload Photos
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            <Star className="inline h-3 w-3 text-amber-500 mr-1" />
            Starred photos appear on your public profile
          </p>
          <div className="grid grid-cols-3 gap-2">
            {media.map((item) => (
              <div key={item.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-muted">
                <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                {/* Featured indicator */}
                {item.is_featured && (
                  <div className="absolute top-1.5 left-1.5">
                    <Star className="h-4 w-4 text-amber-400 fill-amber-400 drop-shadow" />
                  </div>
                )}
                {/* Actions overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => toggleFeatured(item)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground transition-transform active:scale-90"
                  >
                    <Star className={cn("h-4 w-4", item.is_featured ? "text-amber-500 fill-amber-500" : "text-muted-foreground")} />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-destructive transition-transform active:scale-90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
