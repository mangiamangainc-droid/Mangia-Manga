"use client";

import { useRef } from "react";
import Link from "next/link";
import { MediaDisplay } from "@/components/ui/MediaDisplay";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Manga } from "@/types";
import { getReadingPercent } from "@/lib/utils";
import { MangaCardSkeleton } from "@/components/ui/Skeleton";

interface ContinueReadingProps {
  manga: Manga[];
  loading: boolean;
  // Reading progress data: mangaId → lastPage%
  progress?: Record<string, number>;
}

export function ContinueReading({ manga, loading, progress = {} }: ContinueReadingProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  if (!loading && manga.length === 0) return null;

  return (
    <section className="page-container my-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Play className="w-5 h-5 text-primary fill-primary" />
          <h2 className="text-lg font-bold text-white">Continue Reading</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-8 h-8 rounded-full bg-dark-card border border-dark-border flex items-center justify-center text-dark-subtext hover:text-primary hover:border-primary transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-8 h-8 rounded-full bg-dark-card border border-dark-border flex items-center justify-center text-dark-subtext hover:text-primary hover:border-primary transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scroll row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <MangaCardSkeleton key={i} />)
          : manga.map((m, i) => (
              <ContinueReadingCard
                key={m.id}
                manga={m}
                progressPct={progress[m.id] ?? 0}
                index={i}
              />
            ))}
      </div>
    </section>
  );
}

function ContinueReadingCard({
  manga,
  progressPct,
  index,
}: {
  manga: Manga;
  progressPct: number;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex-shrink-0 w-40 group"
    >
      <Link href={`/manga/${manga.id}`}>
        {/* Poster */}
        <div className="relative w-full h-56 rounded-xl overflow-hidden bg-dark-muted">
          <MediaDisplay
            url={manga.posterURL || "/images/placeholder-poster.svg"}
            alt={manga.nameEn}
            style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
            className="group-hover:scale-110 transition-transform duration-500"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badge */}
          <div className="absolute top-2 left-2">
            <span className="badge bg-primary/20 text-primary border border-primary/30 text-xs font-bold">
              EN
            </span>
          </div>

          {/* Play icon on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
              <Play className="w-4 h-4 text-dark-bg fill-dark-bg ml-0.5" />
            </div>
          </div>

          {/* Progress bar */}
          {progressPct > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-dark-muted/60">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>

        {/* Title */}
        <div className="mt-2">
          <p className="text-sm font-semibold text-white line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {manga.nameEn}
          </p>
          {progressPct > 0 && (
            <p className="text-xs text-dark-subtext mt-0.5">{progressPct}% read</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
