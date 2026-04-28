"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, query, where, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Collections } from "@/lib/firebase/firestore";
import { Manga, Season, Chapter } from "@/types";
import { Play, Heart, BookmarkPlus, BookmarkCheck, Loader2, Info, Star, Eye, Calendar } from "lucide-react";
import { MediaDisplay } from "@/components/ui/MediaDisplay";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";

export default function MangaDetailPage({ params }: { params: { mangaId: string } }) {
  const [manga, setManga] = useState<Manga | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Chapter[]>([]);
  const [now, setNow] = useState(new Date());
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { user, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const seasonParam = searchParams.get("season");
  
  const [isSaved, setIsSaved] = useState(false);
  const [isLoved, setIsLoved] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // 1. Fetch Manga Data
  useEffect(() => {
    const fetchManga = async () => {
      const docRef = doc(db, Collections.MANGA, params.mangaId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setManga({ id: snap.id, ...snap.data() } as Manga);
      }
    };
    fetchManga();
  }, [params.mangaId]);

  // 2. Fetch Seasons (Real-time)
  useEffect(() => {
    const q = query(collection(db, Collections.SEASONS), where("mangaId", "==", params.mangaId));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() as any }))
        .sort((a, b) => a.seasonNumber - b.seasonNumber);
      setSeasons(data);
      
      // Auto-select season: priority: 1. URL param, 2. First season in list
      if (data.length > 0 && !selectedSeasonId) {
        if (seasonParam && data.find(s => s.id === seasonParam)) {
          setSelectedSeasonId(seasonParam);
        } else {
          setSelectedSeasonId(data[0].id);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, [params.mangaId, seasonParam]);

  // 3. Fetch All Episodes
  useEffect(() => {
    const q = query(collection(db, Collections.CHAPTERS), where("mangaId", "==", params.mangaId));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      setEpisodes(data);
    });
    return () => unsub();
  }, [params.mangaId]);

  // 4. Filter episodes for users — hide scheduled ones whose time hasn't passed
  const nowTime = new Date();
  
  const visibleEpisodes = episodes.filter((ep: any) => {
    // If no publishAt field → show it (old episodes)
    if (!ep.publishAt) return true;

    // Get publish date
    let publishDate: Date;
    if (ep.publishAt?.toDate) {
      publishDate = ep.publishAt.toDate(); // Firestore Timestamp
    } else if (ep.publishAt?.seconds) {
      publishDate = new Date(ep.publishAt.seconds * 1000); // Firestore Timestamp object
    } else {
      publishDate = new Date(ep.publishAt); // String or Date
    }

    // HIDE if publish time is in the future
    if (publishDate > nowTime) {
      console.log("HIDING scheduled episode:", ep.titleEN, "publishes at:", publishDate);
      return false;
    }

    return true;
  });

  // Update "now" every minute to trigger re-calculation of visibleEpisodes
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // 4. User Stats
  useEffect(() => {
    if (!user || !manga) return;
    const fetchStats = async () => {
      const libRef = doc(db, Collections.LIBRARY, `${user.uid}_${manga.id}`);
      const likeRef = doc(db, Collections.LIKES, `${user.uid}_${manga.id}`);
      const [lib, like] = await Promise.all([getDoc(libRef), getDoc(likeRef)]);
      setIsSaved(lib.exists());
      setIsLoved(like.exists());
    };
    fetchStats();
  }, [user, manga]);

  const toggleSave = async () => {
    if (!user) { toast.error("Please login first"); return; }
    setToggleLoading(true);
    try {
      const ref = doc(db, Collections.LIBRARY, `${user.uid}_${manga!.id}`);
      if (isSaved) { await deleteDoc(ref); setIsSaved(false); }
      else { await setDoc(ref, { userId: user.uid, mangaId: manga!.id, savedAt: new Date() }); setIsSaved(true); }
    } catch (e: any) { toast.error(e.message); } finally { setToggleLoading(false); }
  };

  const toggleLove = async () => {
    if (!user) { toast.error("Please login first"); return; }
    setToggleLoading(true);
    try {
      const ref = doc(db, Collections.LIKES, `${user.uid}_${manga!.id}`);
      if (isLoved) { await deleteDoc(ref); setIsLoved(false); }
      else { await setDoc(ref, { userId: user.uid, mangaId: manga!.id, likedAt: new Date() }); setIsLoved(true); }
    } catch (e: any) { toast.error(e.message); } finally { setToggleLoading(false); }
  };

  if (loading || authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;
  if (!manga) return <div className="min-h-screen flex items-center justify-center text-white">Manga not found.</div>;

  // Selected Season Data
  const selectedSeasonData = seasons.find(s => s.id === selectedSeasonId);
  const displayPoster = selectedSeasonData?.posterURL || manga.posterURL;

  return (
    <div className="min-h-screen pb-24 bg-[#050505]">
      {/* ── BANNER ── */}
      <div className="relative h-[300px] w-full overflow-hidden">
        <MediaDisplay url={manga.bannerURL} alt={manga.nameEn} className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent" />
      </div>

      {/* ── MANGA INFO SECTION ── */}
      <div className="max-w-6xl mx-auto px-6 -mt-32 relative z-10">
        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexDirection: "row" }} className="flex-col md:flex-row">
          {/* Left: Dynamic Poster */}
          <div style={{ width: "160px", flexShrink: 0, position: "relative" }}>
            <div style={{ paddingBottom: "140%", position: "relative", borderRadius: "16px", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.5)", border: "2px solid rgba(255,255,255,0.05)" }}>
              <MediaDisplay 
                url={displayPoster} 
                alt={manga.nameEn}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>

          {/* Right: Info */}
          <div style={{ flex: 1, paddingTop: "20px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${manga.status === "ongoing" ? "bg-primary/20 text-primary border border-primary/20" : "bg-white/10 text-white/60"}`}>
                {manga.status}
              </span>
              {manga.genres.map(g => (
                <span key={g} className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white/40 uppercase tracking-widest border border-white/5 bg-white/5">
                  {g}
                </span>
              ))}
            </div>

            <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", lineHeight: 1.1, marginBottom: "4px" }}>{manga.nameEn}</h1>
            <p style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", marginBottom: "16px" }}>{manga.nameAr}</p>

            {/* Selected Season Indicator */}
            {selectedSeasonData && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background: "rgba(1,255,72,0.1)",
                border: "1px solid rgba(1,255,72,0.3)",
                borderRadius: "12px",
                padding: "6px 16px",
                marginBottom: "20px",
                animation: "slideInRight 0.3s ease-out",
              }}>
                <span style={{ color: "#01FF48", fontWeight: 900, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  S{String(selectedSeasonData.seasonNumber).padStart(2,"0")} — {selectedSeasonData.nameEn || `Season ${selectedSeasonData.seasonNumber}`}
                </span>
              </div>
            )}

            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem", lineHeight: 1.6, maxWidth: "800px", marginBottom: "24px" }}>
              {manga.descriptionEn}
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={toggleSave} disabled={toggleLoading} className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all ${isSaved ? "bg-primary/20 text-primary border border-primary/30" : "bg-white text-black hover:scale-105"}`}>
                {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                {isSaved ? "Saved to Library" : "Save to Library"}
              </button>
              <button onClick={toggleLove} disabled={toggleLoading} className={`p-3 rounded-xl border transition-all ${isLoved ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-white/5 border-white/10 text-white/40 hover:text-red-500"}`}>
                <Heart className={`w-5 h-5 ${isLoved ? "fill-red-500" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* ── EPISODES SECTION ── */}
        {selectedSeasonId && (
          <div style={{ marginTop: "60px", animation: "fadeIn 0.5s ease-out" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#01FF48", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                Episodes
              </h3>
              <div style={{ flex: 1, height: "1px", background: "linear-gradient(to right, rgba(1,255,72,0.3), transparent)" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {visibleEpisodes
                .filter(ep => ep.seasonId === selectedSeasonId)
                .sort((a, b) => (a.episodeNumber ?? 0) - (b.episodeNumber ?? 0))
                .map(ep => (
                  <div
                    key={ep.id}
                    onClick={() => router.push(`/manga/${manga.id}/chapter/${ep.id}`)}
                    className="group"
                    style={{
                      display: "flex", alignItems: "center", gap: "16px", padding: "16px 20px",
                      background: "rgba(255,255,255,0.03)", borderRadius: "16px", cursor: "pointer",
                      border: "1px solid rgba(255,255,255,0.05)", transition: "all 0.2s ease"
                    }}
                  >
                    <div style={{
                      width: "44px", height: "44px", background: "#01FF48", borderRadius: "12px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#000", fontWeight: 900, fontSize: "1rem", flexShrink: 0,
                      boxShadow: "0 6px 15px rgba(1, 255, 72, 0.3)"
                    }}>
                      {ep.episodeNumber}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>{ep.titleEN}</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>{ep.titleAR}</div>
                    </div>
                    <div style={{
                      fontSize: "0.6rem", padding: "4px 8px", borderRadius: "6px",
                      background: ep.isFree ? "rgba(1,255,72,0.1)" : "rgba(255,165,0,0.1)",
                      color: ep.isFree ? "#01FF48" : "#FFA500", fontWeight: 900, textTransform: "uppercase"
                    }}>
                      {ep.isFree ? "FREE" : "PREMIUM"}
                    </div>
                  </div>
                ))}
              
              {visibleEpisodes.filter(ep => ep.seasonId === selectedSeasonId).length === 0 && (
                <div style={{ gridColumn: "1/-1", padding: "60px", textAlign: "center", background: "rgba(255,255,255,0.01)", borderRadius: "24px", border: "1px dashed rgba(255,255,255,0.1)" }}>
                  <p style={{ color: "#444", fontSize: "0.9rem" }}>No episodes uploaded for this season yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ALL SEASONS GRID ── */}
        <div style={{ marginTop: "80px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              All Seasons
            </h3>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: "20px",
          }}>
            {seasons.map((season) => (
              <div
                key={season.id}
                onClick={() => setSelectedSeasonId(season.id)}
                style={{
                  cursor: "pointer",
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: selectedSeasonId === season.id ? "3px solid #01FF48" : "3px solid transparent",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: selectedSeasonId === season.id ? "translateY(-6px)" : "none",
                  boxShadow: selectedSeasonId === season.id ? "0 15px 40px rgba(1, 255, 72, 0.2)" : "none",
                }}
              >
                <div style={{ width: "100%", paddingBottom: "140%", position: "relative", background: "#111" }}>
                  <MediaDisplay
                    url={season.posterURL || manga.posterURL}
                    alt={season.nameEn}
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  {/* Status badge */}
                  <div style={{
                    position: "absolute",
                    top: "8px", right: "8px",
                    background: season.status === "ongoing" ? "#01FF48" : season.status === "coming_soon" ? "#FFA500" : "#FF3232",
                    color: season.status === "ongoing" ? "#000" : "#fff",
                    fontSize: "0.55rem", fontWeight: 900, padding: "3px 6px", borderRadius: "6px",
                    textTransform: "uppercase",
                  }}>
                    {season.status === "ongoing" ? "ONGOING" : season.status === "coming_soon" ? "SOON" : "ENDED"}
                  </div>
                  {/* Overlay Info */}
                  <div style={{
                    position: "absolute",
                    bottom: 0, left: 0, right: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,1) 0%, transparent 100%)",
                    padding: "20px 10px 10px",
                  }}>
                    <div style={{ fontSize: "0.7rem", color: "#01FF48", fontWeight: 900, textTransform: "uppercase" }}>
                      S{String(season.seasonNumber).padStart(2, "0")}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#fff", fontWeight: 700, lineClamp: "1", display: "-webkit-box", WebkitLineClamp: "1", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {season.nameEn}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
