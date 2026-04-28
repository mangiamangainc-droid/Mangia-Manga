"use client";

import { useState } from "react";
import Link from "next/link";
import { MediaDisplay } from "@/components/ui/MediaDisplay";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Eye, BookOpen, Grid3X3, LayoutList } from "lucide-react";
import { Manga, MangaStatus } from "@/types";
import { formatNumber, cn } from "@/lib/utils";
import { MangaCardSkeleton } from "@/components/ui/Skeleton";

interface MangaGridProps {
  cards: any[];
  loading: boolean;
  title?: string;
  icon?: React.ReactNode;
  showFilters?: boolean;
}

type Filter = "all" | MangaStatus;
type ViewMode = "grid" | "list";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Completed", value: "completed" },
  { label: "On Hiatus", value: "hiatus" },
];

const SEASON_FILTERS: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Coming Soon", value: "coming_soon" },
  { label: "Ended", value: "ended" },
];

const getStatusBadge = (status: string) => {
  switch (status?.toLowerCase()) {
    case "ongoing":
      return { label: "Ongoing", bg: "#01FF48", color: "#000", border: "none" };
    case "completed":
    case "ended":
      return { label: "Ended", bg: "#ff4b4b", color: "#000", border: "none" };
    case "hiatus":
      return { label: "Hiatus", bg: "#ffb800", color: "#000", border: "none" };
    case "coming_soon":
      return { label: "Coming Soon", bg: "#01FF48", color: "#000", border: "none" };
    default:
      return { label: status, bg: "#333", color: "#fff", border: "none" };
  }
};

export function MangaGrid({
  cards,
  loading,
  title = "All Seasons",
  icon,
  showFilters = true,
}: MangaGridProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filtered =
    filter === "all" ? cards : cards.filter((c) => c.status === filter);

  return (
    <section className="page-container my-8 mb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <span className="text-dark-subtext text-sm">
            ({loading ? "..." : filtered.length})
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter tabs */}
          {showFilters && (
            <div className="flex items-center gap-1 bg-dark-card border border-dark-border rounded-xl p-1">
              {FILTERS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
                    filter === value
                      ? "bg-primary text-dark-bg"
                      : "text-dark-subtext hover:text-white"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-dark-card border border-dark-border rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === "grid" ? "bg-primary text-dark-bg" : "text-dark-subtext hover:text-white"
              )}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === "list" ? "bg-primary text-dark-bg" : "text-dark-subtext hover:text-white"
              )}
            >
              <LayoutList className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid / List */}
      <AnimatePresence mode="wait">
        <motion.div
          key={filter + viewMode}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {loading ? (
            <div className={viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              : "flex flex-col gap-3"
            }>
              {Array.from({ length: 12 }).map((_, i) =>
                viewMode === "grid"
                  ? <MangaCardSkeleton key={i} />
                  : <ListItemSkeleton key={i} />
              )}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState filter={filter} />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filtered.map((c, i) => (
                <GridItem key={c.id} card={c} index={i} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((c, i) => (
                <ListItem key={c.id} card={c} index={i} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

/* ── Grid Item ─────────────────────────────────────────────────────── */
function GridItem({ card, index }: { card: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <Link href={`/manga/${card.mangaId}?season=${card.seasonId}`} className="manga-card group block">
        {/* Poster */}
        <div className="relative w-full rounded-xl overflow-hidden bg-dark-muted" style={{ paddingBottom: "141%" }}>
          <MediaDisplay
            url={card.posterURL || "/images/placeholder-poster.svg"}
            alt={card.titleEN}
            style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
            className="group-hover:scale-110 transition-transform duration-500"
          />

          {/* Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Season badge */}
          <div className="absolute top-2 left-2">
            <span style={{ 
              background: "#01FF48", 
              color: "#000", 
              fontSize: "10px",
              fontWeight: 900,
              padding: "2px 6px",
              borderRadius: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              boxShadow: "0 2px 8px rgba(1,255,72,0.4)"
            }}>
              S{card.seasonNumber < 10 ? `0${card.seasonNumber}` : card.seasonNumber}
            </span>
          </div>

          {/* Rating - using averageRating if passed */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-lg px-1.5 py-0.5">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-white font-medium">
              {card.averageRating > 0 ? card.averageRating.toFixed(1) : "—"}
            </span>
          </div>

          {/* Hover info */}
          <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <div className="flex items-center gap-2 text-xs text-white/80">
              <Eye className="w-3 h-3" />
              {formatNumber(card.totalViews || 0)}
              <BookOpen className="w-3 h-3 ml-1" />
              {card.totalChapters || 0}ch
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-2 px-0.5">
          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {card.titleEN}
          </h3>
          <div className="flex items-center justify-between mt-1">
            {(() => { const b = getStatusBadge(card.status); return (
              <span style={{ background: b.bg, color: b.color, border: `1px solid ${b.border}`, fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>
                {b.label}
              </span>
            ); })()}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── List Item ─────────────────────────────────────────────────────── */
function ListItem({ card, index }: { card: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02, duration: 0.3 }}
    >
      <Link href={`/manga/${card.mangaId}?season=${card.seasonId}`}
        className="flex items-center gap-4 p-3 bg-dark-card border border-dark-border rounded-xl hover:border-primary/30 hover:bg-dark-muted transition-all group">
        {/* Thumbnail */}
        <div className="relative w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-dark-muted">
          <MediaDisplay
            url={card.posterURL || "/images/placeholder-poster.svg"}
            alt={card.titleEN}
            style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
            className="group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white group-hover:text-primary transition-colors line-clamp-1">
            {card.titleEN}
          </h3>
          <p className="text-xs text-dark-subtext line-clamp-2 mt-1 leading-relaxed">
            {card.titleAR}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span style={{ 
              background: "#01FF48", 
              color: "#000", 
              fontSize: "10px",
              fontWeight: 900,
              padding: "2px 6px",
              borderRadius: "4px",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}>
              S{card.seasonNumber < 10 ? `0${card.seasonNumber}` : card.seasonNumber}
            </span>
            {(() => { const b = getStatusBadge(card.status); return (
              <span style={{ background: b.bg, color: b.color, border: `1px solid ${b.border}`, fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>
                {b.label}
              </span>
            ); })()}
            <span className="flex items-center gap-1 text-xs text-dark-subtext">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              {card.averageRating > 0 ? card.averageRating.toFixed(1) : "New"}
            </span>
          </div>
        </div>

        {/* Chapter count */}
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-black text-primary">{card.totalChapters || 0}</p>
          <p className="text-xs text-dark-subtext">chapters</p>
        </div>
      </Link>
    </motion.div>
  );
}

/* ── Empty / Skeleton ──────────────────────────────────────────────── */
function EmptyState({ filter }: { filter: Filter }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <BookOpen className="w-12 h-12 text-dark-muted mb-4" />
      <p className="text-dark-subtext text-sm">
        No {filter === "all" ? "" : filter} manga found yet.
      </p>
    </div>
  );
}

function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 bg-dark-card border border-dark-border rounded-xl">
      <div className="w-14 h-20 rounded-lg bg-dark-muted animate-pulse flex-shrink-0" />
      <div className="flex-1">
        <div className="h-4 w-2/3 bg-dark-muted rounded animate-pulse mb-2" />
        <div className="h-3 w-full bg-dark-muted rounded animate-pulse mb-1" />
        <div className="h-3 w-3/4 bg-dark-muted rounded animate-pulse mb-3" />
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-dark-muted rounded-full animate-pulse" />
          <div className="h-5 w-10 bg-dark-muted rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
