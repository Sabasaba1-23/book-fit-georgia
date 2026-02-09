import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { X } from "lucide-react";

interface MediaItem {
  id: string;
  image_url: string;
}

interface Props {
  items: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}

export default function MediaLightbox({ items, initialIndex, onClose }: Props) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    startIndex: initialIndex,
    loop: false,
  });
  const [current, setCurrent] = useState(initialIndex);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrent(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") emblaApi?.scrollPrev();
      if (e.key === "ArrowRight") emblaApi?.scrollNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [emblaApi, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 relative z-10">
        <div className="w-10" />
        <span className="text-sm font-semibold text-white/80">
          {current + 1} / {items.length}
        </span>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 active:scale-95"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Carousel */}
      <div className="flex-1 flex items-center overflow-hidden" ref={emblaRef}>
        <div className="flex h-full w-full">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex min-w-0 shrink-0 grow-0 basis-full items-center justify-center px-4"
            >
              <img
                src={item.image_url}
                alt=""
                className="max-h-full max-w-full rounded-lg object-contain"
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
