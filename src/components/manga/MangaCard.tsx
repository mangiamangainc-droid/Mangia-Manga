import { cn } from "@/lib/utils";
import { MediaDisplay } from "@/components/ui/MediaDisplay";
import Link from "next/link";
import { Star, Eye, BookOpen } from "lucide-react";
import { Manga } from "@/types";
import { formatNumber } from "@/lib/utils";

interface MangaCardProps {
  manga: Manga;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { card: "w-32", image: "h-44", title: "text-xs" },
  md: { card: "w-44", image: "h-60", title: "text-sm" },
  lg: { card: "w-52", image: "h-72", title: "text-sm" },
};

export function MangaCard({ manga, className, size = "md" }: MangaCardProps) {
  const s = sizes[size];

  return (
    <Link
      href={`/manga/${manga.id}`}
      className={cn("manga-card group flex-shrink-0 block", s.card, className)}
    >
      {/* Poster */}
      <div className="relative w-full">
        <div style={{
          width: "100%",
          paddingBottom: "133%",
          position: "relative",
          borderRadius: "12px",
          overflow: "hidden",
          background: "#111",
        }}>
          <MediaDisplay
            url={manga.posterURL || "/images/placeholder-poster.svg"}
            alt={manga.nameEn}
            style={{
              position: "absolute",
              top: 0, left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top center",
            }}
            className="transition-transform duration-500 group-hover:scale-110 block"
          />
        </div>

        {/* Gradient overlay */}
        <div className="manga-card-overlay absolute inset-0 rounded-[12px] pointer-events-none" />

        {/* Status badge */}
        <div className="absolute top-2 left-2">
          <span
            className={cn(
              "badge text-xs",
              manga.status === "ongoing" && "badge-primary",
              manga.status === "completed" && "bg-blue-500/20 text-blue-400 border-blue-500/30",
              manga.status === "hiatus" && "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
            )}
          >
            {manga.status}
          </span>
        </div>

        {/* Rating */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-lg px-1.5 py-0.5">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-white font-medium">
            {manga.averageRating.toFixed(1)}
          </span>
        </div>

        {/* Hover overlay info */}
        <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-2 text-xs text-white/80">
            <Eye className="w-3 h-3" />
            {formatNumber(manga.totalViews)}
            <BookOpen className="w-3 h-3 ml-1" />
            {manga.totalChapters}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="mt-2 px-0.5">
        <h3
          className={cn(
            "font-semibold text-[var(--text)] line-clamp-2 leading-tight",
            s.title
          )}
        >
          {manga.nameEn}
        </h3>
        <p className="text-xs text-[var(--subtext)] mt-0.5">
          {manga.totalSeasons} Season{manga.totalSeasons !== 1 ? "s" : ""}
        </p>
      </div>
    </Link>
  );
}
