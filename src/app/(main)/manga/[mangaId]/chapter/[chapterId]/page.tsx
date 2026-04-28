"use client";

import { useEffect, useState, useRef } from "react";
import { doc, getDoc, setDoc, Timestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Collections } from "@/lib/firebase/firestore";
import { useAuthStore } from "@/store/authStore";
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Chapter } from "@/types";

interface Props {
  params: { mangaId: string; chapterId: string };
}

function getGoogleDriveEmbedURL(url: string): string {
  if (!url) return "";
  // Handle different Google Drive URL formats
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://drive.google.com/file/d/${match[1]}/preview?usp=sharing`;
    }
  }
  return url;
}

export default function ChapterReaderPage({ params }: Props) {
  const [episode, setEpisode] = useState<any>(null);
  const [allEpisodes, setAllEpisodes] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const router = useRouter();

  // Block right click and keyboard shortcuts
  useEffect(() => {
    const blockRightClick = (e: MouseEvent) => e.preventDefault();
    const blockShortcuts = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === "s" || e.key === "u" || e.key === "p")) ||
        e.key === "F12"
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", blockRightClick);
    document.addEventListener("keydown", blockShortcuts);

    return () => {
      document.removeEventListener("contextmenu", blockRightClick);
      document.removeEventListener("keydown", blockShortcuts);
    };
  }, []);

  useEffect(() => {
    const fetchEpisodeData = async () => {
      try {
        const snap = await getDoc(doc(db, Collections.CHAPTERS || "chapters", params.chapterId));
        if (snap.exists()) {
          const epData = { id: snap.id, ...snap.data() } as any;
          setEpisode(epData);
          
          if (epData.mangaId) {
            // Fetch all episodes for navigation
            const q = query(
              collection(db, Collections.CHAPTERS || "chapters"), 
              where("mangaId", "==", epData.mangaId)
            );
            const epsSnap = await getDocs(q);
            const epsList = epsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Chapter));
            epsList.sort((a: any, b: any) => {
              const numA = a.episodeNumber ?? a.chapterNumber ?? 0;
              const numB = b.episodeNumber ?? b.chapterNumber ?? 0;
              return numA - numB;
            });
            setAllEpisodes(epsList);
          }
        } else {
          toast.error("Episode not found!");
        }
      } catch (error) {
        console.error("Failed to load episode:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEpisodeData();
  }, [params.chapterId]);

  useEffect(() => {
    if (!episode) return;

    // Check if episode is scheduled and time hasn't come yet
    if (episode.publishAt) {
      let publishDate: Date;
      if (episode.publishAt?.toDate) {
        publishDate = episode.publishAt.toDate();
      } else if (episode.publishAt?.seconds) {
        publishDate = new Date(episode.publishAt.seconds * 1000);
      } else {
        publishDate = new Date(episode.publishAt);
      }

      if (publishDate > new Date()) {
        // Episode not yet available - redirect to manga page
        toast.error("This episode is not available yet!");
        router.push(`/manga/${params.mangaId}`);
        return;
      }
    }
  }, [episode, router, params.mangaId]);

  // Save to history when episode opens
  useEffect(() => {
    if (!user?.uid || !episode) return;
    
    console.log("Saving progress for user:", user?.uid, "chapter:", params.chapterId);
    
    const progressRef = doc(db, "readingProgress", `${user.uid}_${params.chapterId}`);
    setDoc(progressRef, {
      userId: user.uid,
      mangaId: params.mangaId,
      chapterId: params.chapterId,
      mangaTitle: episode.mangaTitle || "",
      episodeNumber: episode.episodeNumber || episode.chapterNumber || 0,
      episodeTitle: episode.titleEN || episode.titleEn || "",
      posterURL: episode.posterURL || "",
      progress: 0,
      lastRead: new Date(),
    }, { merge: true });
  }, [user, episode, params.mangaId, params.chapterId]);

  // Update progress on scroll
  useEffect(() => {
    if (!user?.uid || !params.chapterId) return;

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

      const progressRef = doc(db, "readingProgress", `${user.uid}_${params.chapterId}`);
      setDoc(progressRef, {
        userId: user.uid,
        mangaId: params.mangaId,
        chapterId: params.chapterId,
        progress: percentage,
        lastRead: new Date(),
      }, { merge: true });
    };

    // Debounce scroll updates (every 2 seconds)
    let timer: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(updateProgress, 2000);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [user, params.chapterId, params.mangaId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!episode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white">Episode not found.</p>
      </div>
    );
  }

  const isPDF = episode.contentType === "pdf" || !!episode.pdfURL;
  const isExternal = episode.contentType === "external" || episode.contentType === "link";
  const sourceURL = episode.contentURL || episode.pdfURL || episode.externalURL;

  const currentIndex = allEpisodes.findIndex(e => e.id === episode.id);
  const prevEpisode = currentIndex > 0 ? allEpisodes[currentIndex - 1] : null;
  const nextEpisode = currentIndex < allEpisodes.length - 1 ? allEpisodes[currentIndex + 1] : null;

  return (
    <div
      id="chapter-reader"
      data-manga-id={params.mangaId}
      data-chapter-id={params.chapterId}
      className="min-h-screen bg-black flex flex-col"
    >
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-50 bg-black/95 border-b border-white/10 backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-2xl">
        <Link 
          href={`/manga/${params.mangaId}`}
          className="flex items-center gap-2 text-dark-subtext hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-bold uppercase tracking-widest">Back</span>
        </Link>
        
        <div className="text-center flex-1 px-4">
          <h1 className="text-sm md:text-base font-black text-white truncate max-w-sm mx-auto">
            {episode.titleEN || episode.titleEn}
          </h1>
          <p className="text-[10px] md:text-xs text-primary font-bold tracking-widest mt-0.5">
            EPISODE {episode.episodeNumber || episode.chapterNumber}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            disabled={!prevEpisode}
            onClick={() => prevEpisode && router.push(`/manga/${params.mangaId}/chapter/${prevEpisode.id}`)}
            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            disabled={!nextEpisode}
            onClick={() => nextEpisode && router.push(`/manga/${params.mangaId}/chapter/${nextEpisode.id}`)}
            className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 w-full max-w-4xl mx-auto bg-black relative">
        {(isExternal || isPDF) && sourceURL && (
          <div style={{ position: "relative", width: "100%", height: "100vh" }}>
            {/* Invisible overlay to block clicks on Google Drive/PDF UI toolbar (top) */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: isExternal ? "60px" : "40px",
              zIndex: 10,
              background: "#0a0a0a",
            }} />

            {/* Bottom overlay for Google Drive */}
            {isExternal && (
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "40px",
                zIndex: 10,
                background: "#0a0a0a",
              }} />
            )}

            <iframe
              ref={iframeRef}
              src={isExternal ? getGoogleDriveEmbedURL(sourceURL) : `${sourceURL}#toolbar=0&navpanes=0&scrollbar=0`}
              style={{
                width: "100%",
                height: "100vh",
                border: "none",
                display: "block",
              }}
              sandbox="allow-scripts allow-same-origin"
              allow="autoplay"
              referrerPolicy="no-referrer"
              title="Content Viewer"
            />
          </div>
        )}
        
        {!sourceURL && (
          <div className="p-10 text-center text-dark-subtext">
            No content source available.
          </div>
        )}
      </div>
    </div>
  );
}
