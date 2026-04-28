"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Sparkles } from "lucide-react";
import { useTrendingManga, useLatestManga } from "@/hooks/useManga";
import { useLibrary } from "@/hooks/useProgress";
import { HeroSection } from "@/components/home/HeroSection";
import { AdBanner } from "@/components/home/AdBanner";
import { ContinueReading } from "@/components/home/ContinueReading";
import { MangaGrid } from "@/components/home/MangaGrid";
import { MediaDisplay } from "@/components/ui/MediaDisplay";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import { getDocs, collection, query, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";

function formatTimeAgo(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

export default function HomePage() {
  const { user } = useAuthStore();
  const { manga: trending, loading: trendingLoading } = useTrendingManga(10);
  const { library } = useLibrary();

  // "Continue Reading" = library manga that user has started
  const libraryManga = useMemo(
    () => trending.filter((m) => library.includes(m.id)),
    [trending, library]
  );

  // Custom fetch logic for Seasons as separate cards
  const [seasonCards, setSeasonCards] = useState<any[]>([]);
  const [loadingSeasons, setLoadingSeasons] = useState(true);

  useEffect(() => {
    const fetchSeasonsAsCards = async () => {
      try {
        const mangaSnap = await getDocs(collection(db, "manga"));
        const allManga = mangaSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

        const seasonsSnap = await getDocs(collection(db, "seasons"));
        const allSeasons = seasonsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

        const cards = allSeasons
          .map((season: any) => {
            const manga = allManga.find((m) => m.id === season.mangaId);
            if (!manga) return null; // Filter out orphan seasons

            const mangaTitleEN = manga.nameEn || manga.nameEN || manga.titleEN || manga.title || "";
            const mangaTitleAR = manga.nameAr || manga.nameAR || manga.titleAR || manga.title || "";
            
            const seasonNameEN = season.nameEn || season.nameEN || `Season ${season.seasonNumber}`;
            const seasonNameAR = season.nameAr || season.nameAR || `الموسم ${season.seasonNumber}`;

            return {
              id: season.id,
              seasonId: season.id,
              mangaId: season.mangaId,
              posterURL: season.posterURL || manga.posterURL,
              titleEN: `${mangaTitleEN} — ${seasonNameEN}`,
              titleAR: `${mangaTitleAR} — ${seasonNameAR}`,
              seasonNumber: season.seasonNumber,
              status: season.status || manga.status || "ongoing",
              genres: manga.genres || [],
              mangaTitle: mangaTitleEN,
              averageRating: manga.averageRating || 0,
              totalViews: manga.totalViews || 0,
              totalChapters: season.totalChapters || 0,
            };
          })
          .filter(Boolean)
          .sort((a: any, b: any) => a.seasonNumber - b.seasonNumber);

        setSeasonCards(cards);
      } catch (err) {
        console.error("Failed to fetch seasons", err);
      } finally {
        setLoadingSeasons(false);
      }
    };

    fetchSeasonsAsCards();
  }, []);

  // Mock progress (in production use useReadingProgress per manga)
  const mockProgress: Record<string, number> = {};

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* ─── Hero + Trending ─────────────────────────────────── */}
      <div className="mb-8 pt-6">
        <HeroSection
          trending={trending}
          loading={trendingLoading}
        />
      </div>

      {/* ─── Admin Ad Banner ──────────────────────────────────── */}
      <AdBanner />

      {/* ─── Latest Updates ───────────────────────────────────── */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <LatestSection />
      </motion.div>

      {/* ─── Continue Reading (only if logged in + has library) ── */}
      {user && (
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="px-4 mb-8"
        >
          <ContinueReading
            manga={libraryManga}
            loading={trendingLoading}
            progress={mockProgress}
          />
        </motion.div>
      )}

      {/* ─── All Manga Grid ───────────────────────────────────── */}
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="px-4 pb-12"
      >
        <MangaGrid
          cards={seasonCards}
          loading={loadingSeasons}
          title="All Seasons"
          icon={<BookOpen className="w-5 h-5" />}
          showFilters
        />
      </motion.div>
    </div>
  );
}

/* ── Latest Updates horizontal scroll row ──────────────────────────── */
/* ── Latest Updates section (Dynamic Chapters) ────────────────────────── */
function LatestSection() {
  const [latestEpisodes, setLatestEpisodes] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const now = new Date();

        // Get latest 12 episodes sorted by upload date
        const snap = await getDocs(
          query(
            collection(db, "chapters"),
            orderBy("createdAt", "desc"),
            limit(12)
          )
        );

        const eps = snap.docs
          .map(d => ({ id: d.id, ...d.data() as any }))
          .filter(ep => {
            if (!ep.publishAt) return true;
            const pub = ep.publishAt?.toDate ? ep.publishAt.toDate()
              : ep.publishAt?.seconds ? new Date(ep.publishAt.seconds * 1000)
              : new Date(ep.publishAt);
            return pub <= now;
          });

        // Get manga info for each episode
        const enriched = await Promise.all(eps.map(async ep => {
          const [mangaSnap, seasonSnap] = await Promise.all([
            getDoc(doc(db, "manga", ep.mangaId)),
            ep.seasonId ? getDoc(doc(db, "seasons", ep.seasonId)) : Promise.resolve(null),
          ]);
          return {
            ...ep,
            manga: mangaSnap.exists() ? { id: mangaSnap.id, ...mangaSnap.data() } : null,
            season: seasonSnap?.exists() ? seasonSnap.data() : null,
          };
        }));

        setLatestEpisodes(enriched.filter(ep => ep.manga));
      } catch (error) {
        console.error("Error fetching latest updates:", error);
      }
    };

    fetchLatest();
  }, []);

  return (
    <>
      <div style={{ padding: "0 16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <div style={{ width: "3px", height: "18px", background: "#01FF48", borderRadius: "2px" }} />
          <span style={{ fontSize: "1rem", fontWeight: 700 }}>Latest Updates</span>
        </div>

        {/* Horizontal scroll container */}
        <div 
          className="latest-updates-scroll"
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            paddingBottom: "8px",
            scrollbarWidth: "none", // Hide scrollbar Firefox
            msOverflowStyle: "none", // Hide scrollbar IE
          }}
        >
          {latestEpisodes.map(ep => (
            <div
              key={ep.id}
              onClick={() => router.push(`/manga/${ep.mangaId}/chapter/${ep.id}`)}
              style={{
                display: "flex",
                gap: "10px",
                background: "#111",
                border: "1px solid #1a1a1a",
                borderRadius: "12px",
                padding: "10px",
                cursor: "pointer",
                minWidth: "220px",
                maxWidth: "220px",
                flexShrink: 0,
                transition: "border-color 0.2s",
                alignItems: "center",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = "#01FF48")}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "#1a1a1a")}
            >
              {/* Poster */}
              <div style={{
                width: "44px",
                height: "56px",
                borderRadius: "6px",
                overflow: "hidden",
                flexShrink: 0,
                background: "#1a1a1a",
              }}>
                <img
                  src={ep.manga?.posterURL}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.7rem", color: "#01FF48", fontWeight: 700, marginBottom: "2px" }}>
                  Ep {ep.episodeNumber}
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.82rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ep.manga?.titleEN || ep.manga?.nameEN}
                </div>
                <div style={{ fontSize: "0.74rem", color: "#888", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {ep.titleEN}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px" }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: ep.isFree ? "#01FF48" : "#FFA500",
                    color: "#000",
                    padding: "3px 8px",
                    borderRadius: "5px",
                    fontWeight: 800,
                    fontSize: "0.65rem",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}>
                    {ep.isFree ? <Sparkles className="w-3 h-3" /> : null}
                    {ep.isFree ? "FREE" : "PREMIUM"}
                  </span>
                  <span style={{ fontSize: "0.68rem", color: "#555", marginLeft: "auto" }}>
                    {ep.createdAt?.toDate ? formatTimeAgo(ep.createdAt.toDate()) : ""}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hide scrollbar webkit */}
      <style>{`
        .latest-updates-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </>
  );
}
