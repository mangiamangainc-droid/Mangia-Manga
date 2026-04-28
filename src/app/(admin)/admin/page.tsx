"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, CreditCard, BookOpen, Layers, ArrowUpRight, ArrowDownRight, Clock, Plus, UserPlus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from "firebase/firestore";
import { Collections } from "@/lib/firebase/firestore";
import { formatNumber, formatCurrency } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalReaders: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    totalManga: 0,
    totalSeasons: 0,
    totalEpisodes: 0,
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersSnap, subsSnap, mangaSnap, seasonsSnap, epsSnap] = await Promise.all([
          getDocs(collection(db, Collections.USERS)),
          getDocs(query(collection(db, "subscriptions"), where("status", "==", "active"))),
          getDocs(collection(db, Collections.MANGA)),
          getDocs(collection(db, Collections.SEASONS)),
          getDocs(collection(db, Collections.CHAPTERS)),
        ]);

        // Monthly revenue calculation
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const revenueSnap = await getDocs(
          query(collection(db, "subscriptions"), where("createdAt", ">=", Timestamp.fromDate(startOfMonth)))
        );
        let revenue = 0;
        revenueSnap.docs.forEach(d => revenue += (d.data().amount || 0));

        setStats({
          totalReaders: usersSnap.size,
          activeSubscriptions: subsSnap.size,
          monthlyRevenue: revenue,
          totalManga: mangaSnap.size,
          totalSeasons: seasonsSnap.size,
          totalEpisodes: epsSnap.size,
        });

        // Recent Activity
        const latestEps = await getDocs(query(collection(db, Collections.CHAPTERS), orderBy("createdAt", "desc"), limit(5)));
        const latestUsers = await getDocs(query(collection(db, Collections.USERS), orderBy("createdAt", "desc"), limit(5)));

        const combined = [
          ...latestEps.docs.map(d => ({ 
            type: 'episode', 
            title: 'New Episode Added', 
            desc: `${d.data().titleEN || 'Chapter'} uploaded.`, 
            time: d.data().createdAt, 
            color: 'bg-blue-500/20 text-blue-500',
            icon: Plus
          })),
          ...latestUsers.docs.map(d => ({ 
            type: 'user', 
            title: 'New User Registered', 
            desc: `User ${d.data().displayName || d.data().email} joined.`, 
            time: d.data().createdAt, 
            color: 'bg-purple-500/20 text-purple-500',
            icon: UserPlus
          }))
        ].sort((a, b) => b.time?.toMillis() - a.time?.toMillis()).slice(0, 8);

        setActivities(combined);
      } catch (e) {
        console.error("Dashboard error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Readers", value: stats.totalReaders, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Active Subs", value: stats.activeSubscriptions, icon: CreditCard, color: "text-primary", bg: "bg-primary/10" },
    { label: "Monthly Revenue", value: formatCurrency(stats.monthlyRevenue), icon: Layers, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Total Manga", value: stats.totalManga, icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="bg-[#0B0B0E] p-8 rounded-[32px] border border-white/5 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white">Welcome Back, {user?.displayName?.split(' ')[0] || 'Admin'}! 👋</h1>
          <p className="text-dark-subtext mt-2 font-medium">Your platform is performing well today. Here's a quick overview.</p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#0B0B0E] p-6 rounded-[24px] border border-white/5 group hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <ArrowUpRight className="w-5 h-5 text-dark-muted group-hover:text-primary transition-colors" />
            </div>
            <p className="text-[10px] font-black text-dark-subtext uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-white mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Quick Stats Summary */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0B0B0E] p-8 rounded-[32px] border border-white/5 h-full">
            <h3 className="text-xl font-black text-white mb-8 uppercase tracking-widest flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_10px_rgba(1,255,72,0.5)]" />
              Content Overview
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-black/40 rounded-2xl border border-white/5 flex items-center gap-4 group">
                <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 font-black text-xl">
                  {stats.totalSeasons}
                </div>
                <div>
                  <p className="text-xs font-black text-dark-subtext uppercase">Seasons</p>
                  <p className="text-white font-black text-lg">Organized</p>
                </div>
              </div>
              <div className="p-6 bg-black/40 rounded-2xl border border-white/5 flex items-center gap-4 group">
                <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500 font-black text-xl">
                  {stats.totalEpisodes}
                </div>
                <div>
                  <p className="text-xs font-black text-dark-subtext uppercase">Episodes</p>
                  <p className="text-white font-black text-lg">Published</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-primary/5 rounded-[24px] border border-primary/10">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-black text-primary uppercase">Reader Engagement</h4>
                <span className="text-[10px] font-black text-primary bg-primary/20 px-2 py-1 rounded-md">LIVE</span>
              </div>
              <div className="flex items-center gap-1.5 h-12">
                {[40, 70, 45, 90, 65, 80, 55, 100, 75, 85, 60].map((h, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    className="flex-1 bg-primary/30 rounded-full"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-5 bg-[#0B0B0E] p-8 rounded-[32px] border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-white uppercase tracking-widest">Recent Activity</h3>
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
              <Clock className="w-4 h-4 text-dark-subtext" />
            </div>
          </div>
          
          <div className="space-y-6">
            {activities.map((activity, i) => (
              <div key={i} className="flex gap-5 relative group">
                {i !== activities.length - 1 && (
                  <div className="absolute top-8 left-6 w-px h-10 bg-white/5" />
                )}
                <div className={`w-12 h-12 rounded-2xl ${activity.color} flex items-center justify-center shrink-0 shadow-lg`}>
                  <activity.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-white group-hover:text-primary transition-colors">{activity.title}</p>
                  <p className="text-xs text-dark-subtext font-medium mt-1">{activity.desc}</p>
                  <p className="text-[10px] text-dark-muted mt-2 font-black uppercase tracking-wider">
                    {formatTime(activity.time)}
                  </p>
                </div>
              </div>
            ))}
            {activities.length === 0 && <p className="text-center text-dark-subtext py-10">No recent activity.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-black">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Analyzing Data...</p>
    </div>
  );
}

function formatTime(timestamp: any) {
  if (!timestamp) return 'Recently';
  const date = timestamp.toDate?.() || new Date(timestamp);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}
