"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Collections } from "@/lib/firebase/firestore";

interface AdminStats {
  totalReaders: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  totalChapters: number;
  revenueChange: number;
  readersChange: number;
  subsChange: number;
  chaptersChange: number;
}

const DEMO_STATS: AdminStats = {
  totalReaders: 45231,
  activeSubscriptions: 8340,
  monthlyRevenue: 124500,
  totalChapters: 1204,
  revenueChange: -2.4,
  readersChange: 12.5,
  subsChange: 5.2,
  chaptersChange: 18.1
};

export function useAdminStats() {
  const [stats, setStats] = useState<AdminStats>(DEMO_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, Collections.SETTINGS, "stats");
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setStats(snap.data() as AdminStats);
      } else {
        setStats(DEMO_STATS);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { stats, loading };
}
