"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, User, BookOpen, Clock, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { db } from "@/lib/firebase/config";
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from "firebase/firestore";
import { Collections } from "@/lib/firebase/firestore";

const routeLabels: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/manga": "Manga Management",
  "/admin/seasons": "Seasons & Chapters",
  "/admin/users": "Users Management",
  "/admin/ads": "Ads Management",
  "/admin/settings": "Settings",
};

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ type: 'manga' | 'user'; id: string; title: string; subtitle: string }[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const pageTitle = Object.entries(routeLabels).find(([key]) =>
    key === "/admin" ? pathname === "/admin" : pathname.startsWith(key)
  )?.[1] ?? "Admin";

  // 1. Admin Search Logic
  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      const results: any[] = [];
      try {
        // Search Manga
        const mSnap = await getDocs(collection(db, Collections.MANGA));
        const filteredManga = mSnap.docs
          .map(d => ({ id: d.id, ...d.data() as any }))
          .filter(m => m.nameEn?.toLowerCase().includes(search.toLowerCase()) || m.nameAr?.includes(search))
          .slice(0, 5)
          .map(m => ({ type: 'manga', id: m.id, title: m.nameEn, subtitle: 'Manga' }));
        
        // Search Users
        const uSnap = await getDocs(collection(db, Collections.USERS));
        const filteredUsers = uSnap.docs
          .map(d => ({ id: d.id, ...d.data() as any }))
          .filter(u => u.email?.toLowerCase().includes(search.toLowerCase()) || u.displayName?.toLowerCase().includes(search.toLowerCase()))
          .slice(0, 5)
          .map(u => ({ type: 'user', id: u.id, title: u.displayName || u.email, subtitle: u.email }));

        setSearchResults([...filteredManga, ...filteredUsers]);
      } catch (e) { console.error(e); }
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  // 2. Notifications Logic
  useEffect(() => {
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"), limit(10));
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <header className="h-16 bg-dark-card border-b border-dark-border flex items-center justify-between px-6 sticky top-0 z-30">
      <h1 className="text-lg font-bold text-white">{pageTitle}</h1>

      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="relative" ref={searchRef}>
          <div className="hidden md:flex items-center gap-2 bg-dark-muted border border-dark-border rounded-xl px-3 py-2 w-64">
            <Search className="w-4 h-4 text-dark-subtext flex-shrink-0" />
            <input
              type="text"
              placeholder="Search manga or users..."
              className="bg-transparent text-sm text-dark-text placeholder:text-dark-subtext flex-1 outline-none"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
            />
          </div>
          
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-2">
                {searchResults.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => {
                      router.push(res.type === 'manga' ? `/admin/manga` : `/admin/users`);
                      setShowSearch(false);
                      setSearch("");
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-left transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${res.type === 'manga' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'}`}>
                      {res.type === 'manga' ? <BookOpen className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white line-clamp-1">{res.title}</p>
                      <p className="text-[10px] text-dark-subtext uppercase tracking-widest">{res.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2.5 rounded-xl transition-all ${showNotifications ? 'bg-primary text-black' : 'bg-dark-muted text-dark-subtext hover:text-white'}`}
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-dark-card" />}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-dark-border flex justify-between items-center">
                <h3 className="text-sm font-black uppercase tracking-widest text-white">Notifications</h3>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md">{notifications.length} NEW</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="p-4 border-b border-dark-border hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <p className="text-xs font-bold text-white">{n.titleEn}</p>
                    <p className="text-[10px] text-dark-subtext mt-1 line-clamp-2">{n.bodyEn}</p>
                    <div className="flex items-center gap-1 mt-2 text-[8px] text-dark-muted uppercase font-black">
                      <Clock className="w-2 h-2" /> Just now
                    </div>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="p-8 text-center text-dark-subtext">No new notifications.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-dark-border">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white leading-none">{user?.displayName || 'Admin'}</p>
            <p className="text-[10px] text-dark-subtext mt-1 uppercase tracking-widest font-black">Owner</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-black">
            {user?.displayName?.[0]?.toUpperCase() || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
}
