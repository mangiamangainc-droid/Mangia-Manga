"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MediaDisplay } from "@/components/ui/MediaDisplay";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BookOpen, Home, Library, LogOut,
  User, ChevronDown, ChevronRight, Menu, X, Zap, Search, Shield, Clock, History
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import {
  doc, getDoc, collection, query, orderBy, limit,
  onSnapshot, updateDoc, arrayUnion, getDocs, where
} from "firebase/firestore";
import { t } from "@/lib/i18n/translations";
import { useLogo } from "@/hooks/useLogo";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const { locale } = useUIStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const logoURL = useLogo();
  const searchRef = useRef<HTMLDivElement>(null);

  // ── User avatar (fetched from Firestore) ────────────────────────────────
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userAvatarPosition, setUserAvatarPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "users", user.uid)).then(snap => {
      if (snap.exists()) {
        setUserAvatar(snap.data().photoURL || null);
        setUserAvatarPosition(snap.data().avatarPosition || { x: 50, y: 50 });
      }
    });
  }, [user?.uid]);
  // ────────────────────────────────────────────────────────────────────────

  // ── Search history state ────────────────────────────────────────────────
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("mangia_search_history");
    if (saved) setSearchHistory(JSON.parse(saved));
  }, []);

  // Save search to history when user clicks a result
  const saveToHistory = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...searchHistory.filter(h => h !== query)].slice(0, 8);
    setSearchHistory(updated);
    localStorage.setItem("mangia_search_history", JSON.stringify(updated));
  };

  // Clear all history
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("mangia_search_history");
  };

  // Remove single item from history
  const removeFromHistory = (item: string) => {
    const updated = searchHistory.filter(h => h !== item);
    setSearchHistory(updated);
    localStorage.setItem("mangia_search_history", JSON.stringify(updated));
  };
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    setLogoError(false);
  }, [logoURL]);

  // ── Notifications state ──────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Real-time Firestore listener for notifications
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(q, (snap) => {
      const now = new Date();
      const notifs = snap.docs
        .map(d => ({ id: d.id, ...d.data() as any }))
        .filter(n => {
          // HIDE scheduled notifications that haven't reached their time yet
          if (n.status === "scheduled") {
            const scheduledAt = n.scheduledAt?.toDate
              ? n.scheduledAt.toDate()
              : n.scheduledAt?.seconds
                ? new Date(n.scheduledAt.seconds * 1000)
                : null;

            if (scheduledAt && scheduledAt > now) {
              return false; // HIDE IT
            }
          }
          // Only show notifications not yet read by this user
          if (n.readBy && n.readBy.includes(user.uid)) {
            return false;
          }
          return true;
        });

      setNotifications(notifs);
      setUnreadCount(notifs.length);
    });

    return () => unsub();
  }, [user?.uid]);

  // Re-check every 60s in case a scheduled notification's time has now passed
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setNotifications(prev => prev.filter(n => {
        if (n.status === "scheduled") {
          const scheduledAt = n.scheduledAt?.toDate
            ? n.scheduledAt.toDate()
            : n.scheduledAt?.seconds
              ? new Date(n.scheduledAt.seconds * 1000)
              : null;
          return !scheduledAt || scheduledAt <= now;
        }
        return true;
      }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (notifId: string) => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, "notifications", notifId), {
        readBy: arrayUnion(user.uid)
      });
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.uid) return;
    const unread = notifications.filter(n => !n.readBy?.includes(user.uid));
    await Promise.all(
      unread.map(n => updateDoc(doc(db, "notifications", n.id), {
        readBy: arrayUnion(user.uid)
      }))
    );
  };

  // Simple helper for time ago
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };
  // ────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);



  const handleLogout = async () => {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
    setProfileOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveToHistory(searchQuery.trim());
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileOpen(false);
      setShowResults(false);
    }
  };

  const handleSearch = async (queryText: string) => {
    setSearchQuery(queryText);
    if (queryText.length < 2) {
      setSearchResults([]);
      // Keep results visible (to show history) if query is empty
      if (queryText.length > 0) setShowResults(false);
      else setShowResults(true);
      return;
    }

    // Step 1: Get all manga
    const mangaSnap = await getDocs(collection(db, "manga"));
    const allManga = mangaSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

    // Step 2: Filter by search query (check ALL possible field names)
    const filtered = allManga.filter((m: any) => {
      const searchIn = [
        m.nameEn, m.nameAr, m.titleEn, m.titleAr,
        m.titleEN, m.titleAR, m.nameEN, m.nameAR,
        m.name, m.title, m.Title, m.Name
      ].filter(Boolean).join(" ").toLowerCase();
      return searchIn.includes(queryText.toLowerCase());
    });

    // Step 3: For each manga, get latest season and latest episode
    const results = await Promise.all(
      filtered.slice(0, 5).map(async (manga: any) => {
        // Get seasons
        const seasonsSnap = await getDocs(
          query(collection(db, "seasons"),
            where("mangaId", "==", manga.id))
        );
        const seasons = seasonsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

        // Get all chapters for this manga
        const chaptersSnap = await getDocs(
          query(collection(db, "chapters"),
            where("mangaId", "==", manga.id))
        );

        let chapters = chaptersSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

        if (chapters.length === 0) {
          const epsSnap = await getDocs(
            query(collection(db, "episodes"),
              where("mangaId", "==", manga.id))
          );
          chapters = epsSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        }

        // Sort chapters by createdAt desc (newest first)
        chapters.sort((a: any, b: any) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          if (timeA !== timeB) return timeB - timeA;
          return (b.chapterNumber || b.episodeNumber || 0) - (a.chapterNumber || a.episodeNumber || 0);
        });

        const latestEpisode = chapters[0] || null;

        // Find the season corresponding to the latest episode
        let latestSeason = null;
        if (latestEpisode) {
          latestSeason = seasons.find((s: any) => s.id === latestEpisode.seasonId) || null;
        }

        // Fallback: just get the highest season number
        if (!latestSeason && seasons.length > 0) {
          latestSeason = seasons.sort((a: any, b: any) => (b.seasonNumber || 0) - (a.seasonNumber || 0))[0];
        }

        return { ...manga, latestSeason, latestEpisode, totalSeasons: seasons.length };
      })
    );

    setSearchResults(results);
    setShowResults(true);
  };

  const navLinks = [
    { href: "/", label: t("nav.home", locale), icon: Home },
    { href: "/library", label: t("nav.library", locale), icon: Library },
    { href: "/plans", label: t("nav.plans", locale), icon: Zap },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-bg/95 backdrop-blur-xl border-b border-border shadow-xl"
          : "bg-transparent"
      )}
    >
      <nav className="page-container flex items-center gap-4 h-16 sm:h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          {logoURL && !logoError ? (
            <img
              src={logoURL}
              alt="MANGIA"
              style={{ height: "40px", objectFit: "contain" }}
              onError={() => setLogoError(true)}
            />
          ) : (
            <>
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center glow-primary group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5 text-black" />
              </div>
              <span className="text-2xl font-black tracking-tight text-text hidden sm:block">
                MAN<span className="text-primary">GIA</span>
              </span>
            </>
          )}
        </Link>

        {/* Search bar */}
        <div className="flex-1 max-w-sm hidden md:flex ml-4 relative" ref={searchRef}>
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtext pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowResults(true)}
                onClick={() => setShowResults(true)}
                placeholder={t("common.search", locale) + " manga..."}
                className="w-full bg-card border border-border rounded-2xl pl-11 pr-4 py-2.5 text-sm text-text placeholder:text-subtext focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          </form>

          {/* Show history when focused + no query */}
          {showResults && searchQuery.length === 0 && searchHistory.length > 0 && (
            <div style={{
              position: "absolute",
              top: "45px", left: 0, right: 0,
              background: "#111",
              border: "1px solid #222",
              borderRadius: "12px",
              zIndex: 100,
              overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{
                padding: "10px 14px",
                borderBottom: "1px solid #1a1a1a",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <History width="14" height="14" style={{ color: "#888" }} />
                  <span style={{ fontSize: "0.8rem", color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Recent Searches
                  </span>
                </div>
                <button
                  onClick={clearHistory}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#01FF48",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Clear All
                </button>
              </div>

              {/* History items */}
              {searchHistory.map((item, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "10px 14px",
                    borderBottom: "1px solid #1a1a1a",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <Clock width="14" height="14" style={{ flexShrink: 0, marginRight: "10px", color: "#555" }} />

                  <span
                    onClick={() => {
                      setSearchQuery(item);
                      handleSearch(item);
                    }}
                    style={{ flex: 1, fontSize: "0.9rem", color: "#ccc" }}
                  >
                    {item}
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromHistory(item);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#555",
                      cursor: "pointer",
                      fontSize: "1rem",
                      padding: "0 4px",
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Search Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div style={{
              position: "absolute",
              top: "45px",
              left: 0,
              right: 0,
              background: "#111",
              border: "1px solid #222",
              borderRadius: "12px",
              zIndex: 100,
              overflow: "hidden",
            }}>
              {searchResults.map((manga: any) => (
                <div key={manga.id}>
                  {/* Main manga row */}
                  <div
                    onClick={() => {
                      saveToHistory(searchQuery.trim());
                      router.push(`/manga/${manga.id}`);
                      setShowResults(false);
                      setSearchQuery("");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 14px",
                      cursor: "pointer",
                      borderBottom: "1px solid #1a1a1a",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <img
                      src={manga.posterURL}
                      alt={manga.nameEn || manga.titleEN || "Poster"}
                      style={{ width: "36px", height: "48px", objectFit: "cover", borderRadius: "6px" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#fff" }}>
                        {manga.nameEn || manga.titleEN || manga.nameEN || manga.title || manga.name}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#888" }}>
                        {manga.nameAr || manga.titleAR || manga.nameAR}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#555", marginTop: "2px" }}>
                        {manga.totalSeasons} Seasons
                      </div>
                    </div>
                    <span style={{
                      background: "rgba(1,255,72,0.1)",
                      color: "#01FF48",
                      fontSize: "0.7rem",
                      padding: "2px 8px",
                      borderRadius: "20px",
                    }}>{manga.status}</span>
                  </div>

                  {/* Latest episode row */}
                  {manga.latestEpisode && (
                    <div
                      onClick={() => {
                        saveToHistory(searchQuery.trim());
                        router.push(`/manga/${manga.id}/chapter/${manga.latestEpisode.id}`);
                        setShowResults(false);
                        setSearchQuery("");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "8px 14px 8px 62px",
                        cursor: "pointer",
                        background: "#0a0a0a",
                        borderBottom: "1px solid #1a1a1a",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "#111")}
                      onMouseLeave={e => (e.currentTarget.style.background = "#0a0a0a")}
                    >
                      <div style={{ fontSize: "0.75rem", color: "#01FF48" }}>
                        ▶ Latest: {manga.latestSeason?.nameEn || manga.latestSeason?.nameEN} — Episode {manga.latestEpisode?.chapterNumber || manga.latestEpisode?.episodeNumber}: {manga.latestEpisode?.titleEn || manga.latestEpisode?.titleEN}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* View all results */}
              <div
                onClick={() => {
                  saveToHistory(searchQuery.trim());
                  router.push(`/search?q=${searchQuery}`);
                  setShowResults(false);
                }}
                style={{ padding: "10px 14px", textAlign: "center", color: "#01FF48", cursor: "pointer", fontSize: "0.85rem", background: "#0d1f0f" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#1a2f1c")}
                onMouseLeave={e => (e.currentTarget.style.background = "#0d1f0f")}
              >
                View all results for "{searchQuery}"
              </div>
            </div>
          )}

          {showResults && searchResults.length === 0 && searchQuery.length >= 2 && (
            <div style={{
              position: "absolute",
              top: "45px", left: 0, right: 0,
              background: "#111",
              border: "1px solid #222",
              borderRadius: "12px",
              padding: "20px",
              textAlign: "center",
              color: "#666",
              zIndex: 100,
            }}>
              No manga found for "{searchQuery}"
            </div>
          )}
        </div>

        {/* Desktop nav links */}
        <div className="hidden lg:flex items-center gap-6 ml-4">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative py-2 text-sm font-bold uppercase tracking-widest transition-all duration-200 group",
                isActive(href)
                  ? "text-[#01FF48]"
                  : "text-[#FFFFFF]"
              )}
            >
              {label}
              <span className={cn(
                "absolute left-0 bottom-0 w-full h-[2px] bg-[#01FF48] scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-200",
                isActive(href) && "scale-x-100"
              )} />
            </Link>
          ))}
        </div>

        <div className="flex-1" />

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* ── Notification Bell ── */}
              <div className="relative hidden sm:block" ref={notifRef}>
                <button
                  onClick={() => setShowNotifs((v) => !v)}
                  className="relative p-2.5 rounded-2xl text-subtext hover:text-primary hover:bg-card transition-all"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-4px",
                        right: "-4px",
                        background: "#01FF48",
                        color: "#000",
                        borderRadius: "50%",
                        width: "18px",
                        height: "18px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </div>
                  )}
                </button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                  {showNotifs && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: "absolute",
                        top: "52px",
                        right: "0",
                        width: "360px",
                        background: "#111",
                        border: "1px solid #222",
                        borderRadius: "12px",
                        zIndex: 100,
                        maxHeight: "420px",
                        overflowY: "auto",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
                      }}
                    >
                      {/* Header */}
                      <div
                        style={{
                          padding: "16px",
                          borderBottom: "1px solid #222",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          position: "sticky",
                          top: 0,
                          background: "#111",
                          zIndex: 1,
                        }}
                      >
                        <span style={{ fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            style={{
                              color: "#01FF48",
                              fontSize: "0.8rem",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>

                      {/* Notification items */}
                      {(() => {
                        const unreadList = notifications.filter(n => !n.readBy?.includes(user?.uid));

                        if (unreadList.length === 0) {
                          return (
                            <div
                              style={{
                                padding: "32px 24px",
                                textAlign: "center",
                                color: "#666",
                                fontSize: "0.9rem",
                              }}
                            >
                              <Bell style={{ width: 32, height: 32, margin: "0 auto 12px", opacity: 0.3 }} />
                              No notifications yet
                            </div>
                          );
                        }

                        return unreadList.map((n: any) => {
                          const isRead = false; // Always false since we filtered them
                          return (
                            <div
                              key={n.id}
                              onClick={() => markAsRead(n.id)}
                              style={{
                                padding: "14px 16px",
                                borderBottom: "1px solid #1a1a1a",
                                background: isRead ? "transparent" : "#0d1f0f",
                                cursor: "pointer",
                                opacity: isRead ? 0.6 : 1,
                                transition: "all 0.2s",
                              }}
                            >
                              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                                {/* Unread dot */}
                                <div
                                  style={{
                                    width: "8px",
                                    height: "8px",
                                    borderRadius: "50%",
                                    background: isRead ? "transparent" : "#01FF48",
                                    marginTop: "6px",
                                    flexShrink: 0,
                                    transition: "background 0.2s",
                                    boxShadow: isRead ? "none" : "0 0 6px #01FF48",
                                  }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontWeight: isRead ? 400 : 700,
                                      fontSize: "0.9rem",
                                      marginBottom: "2px",
                                      color: "#fff",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {n.titleEN}
                                  </div>
                                  <div style={{ fontSize: "0.8rem", color: "#888", lineHeight: 1.4 }}>
                                    {n.messageEN}
                                  </div>
                                  <div style={{ fontSize: "0.72rem", color: "#555", marginTop: "4px" }}>
                                    {n.createdAt?.toDate
                                      ? formatTimeAgo(n.createdAt.toDate())
                                      : "recently"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    overflow: "hidden",
                    cursor: "pointer",
                    flexShrink: 0,
                    background: "#1a1a1a",
                  }}>
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt="avatar"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: `${userAvatarPosition.x}% ${userAvatarPosition.y}%`,
                        }}
                      />
                    ) : (
                      <div style={{
                        width: "100%",
                        height: "100%",
                        background: "#01FF48",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#000",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                      }}>
                        {user?.displayName?.[0] || user?.email?.[0] || "?"}
                      </div>
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        style={{
                          position: "absolute",
                          top: "50px",
                          right: 0,
                          width: "240px",
                          background: "#111",
                          border: "1px solid #222",
                          borderRadius: "16px",
                          zIndex: 20,
                          overflow: "hidden",
                          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                        }}
                      >
                        {/* User info header */}
                        <div style={{
                          padding: "16px",
                          borderBottom: "1px solid #1a1a1a",
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}>
                          <div style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            overflow: "hidden",
                            flexShrink: 0,
                          }}>
                            {userAvatar ? (
                              <img src={userAvatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${userAvatarPosition.x}% ${userAvatarPosition.y}%` }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", background: "#01FF48", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 700 }}>
                                {user?.displayName?.[0] || "?"}
                              </div>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {user?.displayName || "User"}
                            </div>
                            <div style={{ color: "#01FF48", fontSize: "0.8rem" }}>
                              @{user?.username || ""}
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div style={{ padding: "8px" }}>
                          {[
                            { label: t("nav.profile", locale), icon: User, href: "/profile" },
                            { label: t("nav.library", locale), icon: Library, href: "/library" },
                            ...(user?.role === "admin" ? [{ label: t("nav.admin", locale), icon: Shield, href: "/admin", green: true }] : []),
                          ].map((item: any) => (
                            <div
                              key={item.href}
                              onClick={() => { router.push(item.href); setProfileOpen(false); }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "10px 12px",
                                borderRadius: "10px",
                                cursor: "pointer",
                                color: item.green ? "#01FF48" : "#ccc",
                                transition: "background 0.15s",
                                fontSize: "0.9rem",
                                fontWeight: item.green ? 700 : 400,
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                              <item.icon className="w-4 h-4" />
                              {item.label}
                            </div>
                          ))}

                          <div style={{ height: "1px", background: "#1a1a1a", margin: "6px 0" }} />

                          <div
                            onClick={handleLogout}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "10px 12px",
                              borderRadius: "10px",
                              cursor: "pointer",
                              color: "#ff5555",
                              transition: "background 0.15s",
                              fontSize: "0.9rem",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,85,85,0.08)")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <LogOut className="w-4 h-4" />
                            {t("nav.logout", locale)}
                          </div>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-3 ml-2">
              <Link href="/login" className="text-sm font-bold text-subtext hover:text-text transition-colors px-3">
                {t("nav.login", locale)}
              </Link>
              <Link href="/register" className="btn-primary py-2 px-6">
                {t("nav.register", locale)}
              </Link>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2.5 rounded-2xl text-subtext hover:text-text hover:bg-card transition-all">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border bg-bg/98 backdrop-blur-xl"
          >
            <div className="page-container py-6 space-y-6">
              {user && (
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-4 p-4 bg-card border border-border rounded-3xl mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-primary overflow-hidden flex items-center justify-center text-black text-lg font-black relative">
                    {user.photoURL ? (
                      <MediaDisplay
                        url={user.photoURL}
                        alt={user.displayName}
                        style={{
                          position: "absolute",
                          top: 0, left: 0,
                          width: "100%", height: "100%",
                          objectFit: "cover",
                          objectPosition: user.avatarPosition || "center center"
                        }}
                      />
                    ) : (
                      user.displayName?.[0]?.toUpperCase() ?? "U"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-text truncate">{user.displayName}</p>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest">{user.role}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-subtext" />
                </Link>
              )}
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-subtext" />
                <input type="text" value={searchQuery} onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setShowResults(true)}
                  placeholder="Search manga..."
                  className="w-full bg-card border border-border rounded-2xl pl-12 pr-4 py-3 text-sm" />
              </form>

              {/* Mobile Search History */}
              {showResults && searchQuery.length === 0 && searchHistory.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-2">
                    <div className="flex items-center gap-1.5 text-subtext">
                      <History className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Recent Searches</span>
                    </div>
                    <button onClick={clearHistory} className="text-[10px] font-bold text-primary uppercase tracking-widest">Clear All</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-card border border-border rounded-xl pl-3 pr-2 py-1.5">
                        <span
                          onClick={() => { setSearchQuery(item); handleSearch(item); }}
                          className="text-xs font-bold text-text cursor-pointer"
                        >
                          {item}
                        </span>
                        <button onClick={() => removeFromHistory(item)} className="text-subtext hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {navLinks.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                    className={cn("flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest",
                      isActive(href) ? "text-primary bg-primary/10" : "text-subtext")}>
                    <Icon className="w-5 h-5" /> {label}
                  </Link>
                ))}
              </div>

              {!user && (
                <div className="flex gap-4 pt-2">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 btn-secondary">Login</Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 btn-primary">Join</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
