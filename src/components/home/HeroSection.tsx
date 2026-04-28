"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, BookOpen, Eye, Heart, Clock, Circle } from "lucide-react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Manga } from "@/types";
import { formatNumber } from "@/lib/utils";
import { MediaDisplay } from "@/components/ui/MediaDisplay";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { useRouter } from "next/navigation";

/* ── Ad document shape (mirrors what admin/ads saves) ── */
interface HeroAd {
  id: string;
  type?: "existing" | "coming_soon";
  isComingSoon?: boolean;
  mangaId?: string;
  mangaName?: string;
  titleEN?: string;
  titleAR?: string;
  imageURL: string;
  description: string;
  languages: string[];
  hasHD: boolean;
  launchAt?: any;
}

interface HeroSectionProps {
  trending: Manga[];   // still used for the Trending sidebar
  loading: boolean;
}

export function HeroSection({ trending, loading }: HeroSectionProps) {
  const [ads, setAds] = useState<HeroAd[]>([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [launchedAds, setLaunchedAds] = useState<string[]>([]);
  const router = useRouter();

  /* Live-fetch ads from Firestore */
  useEffect(() => {
    const q = query(collection(db, "ads"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as HeroAd));
        setAds(list);
        setAdsLoading(false);
      },
      (err) => {
        console.error("HeroSection ads fetch error:", err);
        setAdsLoading(false);
      }
    );
    return () => unsub();
  }, []);

  /* Reset slide index when ads change */
  useEffect(() => {
    setCurrent(0);
  }, [ads.length]);

  const goTo = useCallback((index: number, dir: number) => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  const prev = () => {
    if (!ads.length) return;
    goTo((current - 1 + ads.length) % ads.length, -1);
  };
  const next = useCallback(() => {
    if (!ads.length) return;
    goTo((current + 1) % ads.length, 1);
  }, [current, ads.length, goTo]);

  /* Auto-advance every 5 s */
  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, ads.length]);

  const ad = ads[current];

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? "8%" : "-8%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:  (d: number) => ({ x: d > 0 ? "-8%" : "8%", opacity: 0 }),
  };

  const isLoading = adsLoading;

  return (
    <section className="relative w-full" style={{ minHeight: "520px" }}>
      <div className="page-container py-0 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-6 pt-16">

          {/* ── Hero Feature (left 2/3) ─────────────────────────── */}
          <div
            className="lg:col-span-2 relative rounded-2xl overflow-hidden"
            style={{ minHeight: "480px" }}
          >
            {isLoading ? (
              <HeroSkeleton />
            ) : !ad ? (
              /* No ads configured — friendly fallback */
              <div className="absolute inset-0 bg-dark-card flex flex-col items-center justify-center gap-3">
                <p className="text-dark-subtext text-sm">No hero ads configured yet.</p>
                <Link href="/admin/ads" className="btn-primary text-xs">
                  Go to Ads Manager
                </Link>
              </div>
            ) : (
              <>
                {/* Background image / GIF */}
                <AnimatePresence custom={direction} mode="sync">
                  <motion.div
                    key={ad.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute inset-0"
                  >
                    <MediaDisplay
                      url={ad.imageURL}
                      alt={ad.mangaName}
                      className="w-full h-full object-cover"
                    />
                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-bg/70 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/80 via-transparent to-transparent" />
                  </motion.div>
                </AnimatePresence>

                {/* Content */}
                <div
                  className="relative z-10 p-6 md:p-10 flex flex-col justify-end h-full"
                  style={{ minHeight: "480px" }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={ad.id + "-content"}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {ad.isComingSoon && !launchedAds.includes(ad.id) ? (
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "#FFA500",
                            borderRadius: "6px",
                            padding: "4px 12px",
                            marginBottom: "12px",
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <span style={{
                              color: "#000",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              letterSpacing: "0.5px",
                            }}>
                              COMING SOON
                            </span>
                          </div>
                        ) : (
                          <>
                            {ad.languages?.includes("AR") && (
                              <span style={{ 
                                background: "#01FF48", 
                                color: "#000", 
                                borderRadius: "100px", 
                                padding: "4px 12px", 
                                fontSize: "0.7rem", 
                                fontWeight: 900,
                                textTransform: "uppercase"
                              }}>AR</span>
                            )}
                            {ad.languages?.includes("EN") && (
                              <span style={{ 
                                background: "#01FF48", 
                                color: "#000", 
                                borderRadius: "100px", 
                                padding: "4px 12px", 
                                fontSize: "0.7rem", 
                                fontWeight: 900,
                                textTransform: "uppercase"
                              }}>EN</span>
                            )}
                            {ad.hasHD && (
                              <span style={{ 
                                background: "#3B82F6", 
                                color: "#000", 
                                borderRadius: "100px", 
                                padding: "4px 12px", 
                                fontSize: "0.7rem", 
                                fontWeight: 900,
                                textTransform: "uppercase"
                              }}>HD</span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Title */}
                      <h1 className="text-3xl md:text-5xl font-black text-white mb-3 leading-tight drop-shadow-lg">
                        {ad.titleEN || ad.mangaName}
                      </h1>

                      {/* Description */}
                      {ad.description && (
                        <p className="text-dark-subtext text-sm leading-relaxed max-w-md line-clamp-3 mb-6">
                          {ad.description}
                        </p>
                      )}

                      {/* CTA */}
                      <div className="flex items-center gap-3">
                        {ad.isComingSoon ? (
                          ad.launchAt ? (
                            <CountdownTimer
                              launchAt={ad.launchAt?.toDate ? ad.launchAt.toDate() : new Date(ad.launchAt)}
                              onLaunched={() => setLaunchedAds(prev => [...prev, ad.id])}
                              onClick={() => router.push(`/manga/${ad.mangaId}`)}
                            />
                          ) : (
                            <button style={{
                              background: "#01FF48",
                              color: "#000",
                              padding: "12px 32px",
                              borderRadius: "100px",
                              fontWeight: 900,
                              border: "none",
                              cursor: "default",
                              marginTop: "16px",
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              textTransform: "uppercase",
                              fontSize: "0.85rem",
                              letterSpacing: "0.05em"
                            }}>
                              <Play className="w-4 h-4 fill-black text-black" /> 
                              Coming Soon
                            </button>
                          )
                        ) : (
                          <>
                            <Link href={`/manga/${ad.mangaId}`} className="btn-primary gap-2">
                              <Play className="w-4 h-4 fill-dark-bg" />
                              Read Now
                            </Link>
                            <Link href={`/manga/${ad.mangaId}`} className="btn-secondary gap-2">
                              <BookOpen className="w-4 h-4" />
                              Details
                            </Link>
                          </>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Dots + arrows */}
                  {ads.length > 1 && (
                    <div className="flex items-center gap-3 mt-8">
                      <button
                        onClick={prev}
                        className="w-8 h-8 rounded-full bg-dark-muted/60 border border-dark-border flex items-center justify-center text-white hover:border-primary hover:text-primary transition-all"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1.5">
                        {ads.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => goTo(i, i > current ? 1 : -1)}
                            className={`transition-all duration-300 rounded-full ${
                              i === current
                                ? "w-6 h-2 bg-primary"
                                : "w-2 h-2 bg-dark-muted hover:bg-dark-subtext"
                            }`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={next}
                        className="w-8 h-8 rounded-full bg-dark-muted/60 border border-dark-border flex items-center justify-center text-white hover:border-primary hover:text-primary transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Trending list (right 1/3) ───────────────────────── */}
          <div className="hidden lg:flex flex-col gap-3 pt-4 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-primary font-bold text-sm">⚡</span>
              <h2 className="text-white font-bold text-base">Trending</h2>
            </div>

            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TrendingItemSkeleton key={i} rank={i + 1} />
              ))
            ) : (
              trending.slice(0, 5).map((m, i) => (
                <TrendingItem key={m.id} manga={m} rank={i + 1} />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Trending Item ─────────────────────────────────────────────────── */
function TrendingItem({ manga, rank }: { manga: Manga; rank: number }) {
  return (
    <Link
      href={`/manga/${manga.id}`}
      className="flex items-center gap-3 p-2 rounded-xl hover:bg-dark-card transition-all group"
    >
      <span className={`text-2xl font-black w-8 text-center flex-shrink-0 ${rank <= 3 ? "text-primary" : "text-dark-muted"}`}>
        {String(rank).padStart(2, "0")}
      </span>

      <div className="relative w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-dark-muted">
        {manga.posterURL && (
          <MediaDisplay
            url={manga.posterURL}
            alt={manga.nameEn}
            position={manga.posterPosition}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white line-clamp-1 group-hover:text-primary transition-colors">
          {manga.nameEn}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-dark-subtext">
            <Eye className="w-3 h-3" />
            {formatNumber(manga.totalViews)}
          </span>
          <span className="flex items-center gap-1 text-xs text-dark-subtext">
            <Heart className="w-3 h-3" />
            {formatNumber(manga.totalRatings * 40)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── Skeletons ─────────────────────────────────────────────────────── */
function HeroSkeleton() {
  return (
    <div className="absolute inset-0 bg-dark-card animate-pulse">
      <div className="p-10 flex flex-col justify-end h-full">
        <div className="flex gap-2 mb-3">
          {[1, 2, 3].map(i => <div key={i} className="h-6 w-10 bg-dark-muted rounded-md" />)}
        </div>
        <div className="h-12 w-2/3 bg-dark-muted rounded mb-3" />
        <div className="h-16 w-full max-w-md bg-dark-muted rounded mb-6" />
        <div className="flex gap-3">
          <div className="h-11 w-32 bg-dark-muted rounded-xl" />
          <div className="h-11 w-28 bg-dark-muted rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function TrendingItemSkeleton({ rank }: { rank: number }) {
  return (
    <div className="flex items-center gap-3 p-2">
      <span className="text-2xl font-black w-8 text-center text-dark-muted">
        {String(rank).padStart(2, "0")}
      </span>
      <div className="w-12 h-16 rounded-lg bg-dark-muted animate-pulse" />
      <div className="flex-1">
        <div className="h-4 w-3/4 bg-dark-muted rounded animate-pulse mb-2" />
        <div className="h-3 w-1/2 bg-dark-muted rounded animate-pulse" />
      </div>
    </div>
  );
}
