"use client";

import { useEffect, useState } from "react";
import {
  doc, collection, onSnapshot,
  query, orderBy, getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Chapter, Season } from "@/types";
import { Collections } from "@/lib/firebase/firestore";

export function useChapters(mangaId: string, seasonId?: string) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mangaId) return;
    const q = query(
      collection(db, Collections.CHAPTERS),
      orderBy("chapterNumber", "asc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      let data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chapter))
        .filter((c) => c.mangaId === mangaId);
      if (seasonId) data = data.filter((c) => c.seasonId === seasonId);
      setChapters(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [mangaId, seasonId]);

  return { chapters, loading };
}

export function useChapter(chapterId: string) {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chapterId) return;
    const ref = doc(db, Collections.CHAPTERS, chapterId);
    const unsubscribe = onSnapshot(ref, (snap) => {
      setChapter(snap.exists() ? ({ id: snap.id, ...snap.data() } as Chapter) : null);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [chapterId]);

  return { chapter, loading };
}

export function useSeasons(mangaId: string) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mangaId) return;
    const q = query(
      collection(db, Collections.SEASONS),
      orderBy("seasonNumber", "asc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Season))
        .filter((s) => s.mangaId === mangaId);
      setSeasons(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [mangaId]);

  return { seasons, loading };
}
