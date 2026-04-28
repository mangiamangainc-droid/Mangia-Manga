"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Collections } from "@/lib/firebase/firestore";
import { Manga } from "@/types";
import { Loader2, BookmarkCheck, Heart, History, BookOpen, Play, Clock, ArrowRight } from "lucide-react";
import { MediaDisplay } from "@/components/ui/MediaDisplay";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "saved" | "loved" | "history";

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function LibraryPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>("saved");
  const [loading, setLoading] = useState(true);
  
  const [savedManga, setSavedManga] = useState<Manga[]>([]);
  const [lovedManga, setLovedManga] = useState<Manga[]>([]);
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchLibraryData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Saved
        const savedQ = query(collection(db, Collections.LIBRARY), where("userId", "==", user.uid));
        const savedSnap = await getDocs(savedQ);
        const savedIds = savedSnap.docs.map(d => d.data().mangaId);
        
        // 2. Fetch Loved
        const lovedQ = query(collection(db, Collections.LIKES), where("userId", "==", user.uid));
        const lovedSnap = await getDocs(lovedQ);
        const lovedIds = lovedSnap.docs.map(d => d.data().mangaId);

        const fetchMangaByIds = async (ids: string[]) => {
          const results: Manga[] = [];
          for (const id of ids) {
            const mDoc = await getDoc(doc(db, Collections.MANGA, id));
            if (mDoc.exists()) results.push({ id: mDoc.id, ...mDoc.data() } as Manga);
          }
          return results;
        };

        const [sManga, lManga] = await Promise.all([
          fetchMangaByIds(savedIds),
          fetchMangaByIds(lovedIds)
        ]);

        setSavedManga(sManga);
        setLovedManga(lManga);

        // 3. Fetch History
        const histQ = query(collection(db, "readingProgress"), where("userId", "==", user.uid));
        const histSnap = await getDocs(histQ);
        const history = histSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => {
            const timeA = a.lastRead?.toMillis?.() || 0;
            const timeB = b.lastRead?.toMillis?.() || 0;
            return timeB - timeA;
          });
        
        const populatedHistory = await Promise.all(
          history.slice(0, 30).map(async (item: any) => {
            let mTitle = item.mangaTitle || "Manga";
            let mPoster = item.posterURL || "";
            if (item.mangaId) {
              const mDoc = await getDoc(doc(db, "manga", item.mangaId));
              if (mDoc.exists()) {
                mTitle = mDoc.data().nameEn || mTitle;
                mPoster = mDoc.data().posterURL || mPoster;
              }
            }
            return { ...item, mangaTitle: mTitle, mangaPoster: mPoster };
          })
        );
        
        setHistoryItems(populatedHistory);
      } catch (error) {
        console.error("Library error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLibraryData();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-[90vh] flex flex-col items-center justify-center p-8 text-center bg-[#050505]">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
          <BookOpen className="w-12 h-12 text-primary" />
        </div>
        <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Your Library Awaits</h1>
        <p className="text-dark-subtext max-w-md mb-8 text-lg">Sign in to track your reading progress, save your favorite series, and sync across all your devices.</p>
        <Link href="/login" className="px-10 py-4 bg-primary text-black font-black rounded-2xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(1,255,72,0.3)]">
          GET STARTED
        </Link>
      </div>
    );
  }

  const tabItems = [
    { id: "saved", label: "Saved", icon: BookmarkCheck },
    { id: "loved", label: "Favorites", icon: Heart },
    { id: "history", label: "Recent", icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#050505] pb-24">
      {/* HEADER SECTION */}
      <div className="relative pt-16 pb-12 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-5xl font-black text-white tracking-tighter mb-2">MY LIBRARY</h1>
              <p className="text-dark-subtext text-lg font-medium">Manage your collection and reading history.</p>
            </div>
            
            <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/5">
              {tabItems.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all duration-300 ${
                    activeTab === tab.id 
                      ? "bg-primary text-black shadow-[0_4px_20px_rgba(1,255,72,0.2)]" 
                      : "text-white/40 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "animate-bounce" : ""}`} />
                  <span className="uppercase tracking-widest">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div className="max-w-7xl mx-auto px-6">
        {loading ? (
          <div className="py-32 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="text-dark-subtext font-bold uppercase tracking-widest animate-pulse">Syncing Library...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {(activeTab === "saved" || activeTab === "loved") && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8">
                  {(activeTab === "saved" ? savedManga : lovedManga).map((m) => (
                    <Link key={m.id} href={`/manga/${m.id}`} className="group block">
                      <div className="relative aspect-[3/4.2] rounded-2xl overflow-hidden mb-4 border border-white/5 group-hover:border-primary/50 transition-colors duration-500 shadow-2xl">
                        <MediaDisplay 
                          url={m.posterURL} 
                          alt={m.nameEn} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-4">
                          <div className="bg-primary text-black font-black text-[10px] py-2.5 rounded-xl flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-xl">
                            <Play className="w-3 h-3 fill-black" /> VIEW DETAILS
                          </div>
                        </div>
                        {activeTab === "loved" && (
                          <div className="absolute top-3 right-3 w-9 h-9 bg-black/60 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-black text-white text-sm line-clamp-1 group-hover:text-primary transition-colors mb-1">{m.nameEn}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest">{m.status}</span>
                        <div className="w-1 h-1 bg-white/10 rounded-full" />
                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{m.genres?.[0] || "Manga"}</span>
                      </div>
                    </Link>
                  ))}
                  {(activeTab === "saved" ? savedManga : lovedManga).length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white/5 rounded-[32px] border border-white/5 border-dashed">
                      <p className="text-dark-subtext text-lg">No items found in your {activeTab} list.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "history" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {historyItems.map((item, idx) => (
                    <Link 
                      key={idx} 
                      href={`/manga/${item.mangaId}/chapter/${item.chapterId}`}
                      className="group relative bg-[#0B0B0E] border border-white/5 hover:border-primary/30 transition-all duration-300 p-5 rounded-[24px] flex items-center gap-5 overflow-hidden"
                    >
                      {/* Glow effect */}
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                      
                      <div className="w-24 h-32 shrink-0 rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                        <MediaDisplay 
                          url={item.mangaPoster} 
                          alt="Poster"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      </div>

                      <div className="flex-1 min-w-0 z-10">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                            EPISODE {item.episodeNumber}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-dark-subtext uppercase tracking-widest">
                            <Clock className="w-3 h-3" />
                            {item.lastRead?.toDate ? formatTimeAgo(item.lastRead.toDate()) : "recently"}
                          </div>
                        </div>

                        <h3 className="text-white font-black text-lg line-clamp-1 group-hover:text-primary transition-colors mb-1 leading-tight">{item.mangaTitle}</h3>
                        <p className="text-sm text-dark-subtext font-medium line-clamp-1 mb-5">{item.episodeTitle || "Continue from last session"}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 group/btn bg-primary text-black px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:shadow-[0_4px_15px_rgba(1,255,72,0.4)]">
                            CONTINUE READING
                            <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                  {historyItems.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white/5 rounded-[32px] border border-white/5 border-dashed">
                      <p className="text-dark-subtext text-lg">Your reading history is empty. Start a new series!</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
