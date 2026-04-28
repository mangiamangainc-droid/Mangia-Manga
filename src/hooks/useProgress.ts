"use client";

import { useState, useEffect } from "react";
import {
  doc, setDoc, deleteDoc, getDoc,
  collection, query, where, onSnapshot, Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuthStore } from "@/store/authStore";
import { Collections } from "@/lib/firebase/firestore";
import { ReadingProgress } from "@/types";

// ─── Reading progress ─────────────────────────────────────────────────
export function useReadingProgress(mangaId: string, chapterId: string) {
  const { user } = useAuthStore();
  const [progress, setProgress] = useState<ReadingProgress | null>(null);

  useEffect(() => {
    if (!user || !chapterId) return;
    const id = `${user.id}_${chapterId}`;
    const ref = doc(db, Collections.READING_PROGRESS, id);
    const unsubscribe = onSnapshot(ref, (snap) => {
      setProgress(snap.exists() ? ({ id: snap.id, ...snap.data() } as ReadingProgress) : null);
    });
    return () => unsubscribe();
  }, [user, mangaId, chapterId]);

  const saveProgress = async (lastPageIndex: number, totalPages: number) => {
    if (!user) return;
    const id = `${user.id}_${chapterId}`;
    await setDoc(doc(db, Collections.READING_PROGRESS, id), {
      userId: user.id,
      mangaId,
      chapterId,
      lastPageIndex,
      totalPages,
      completed: lastPageIndex >= totalPages - 1,
      lastReadAt: Timestamp.now(),
    }, { merge: true });
  };

  return { progress, saveProgress };
}

// ─── Library (saved manga) ────────────────────────────────────────────
export function useLibrary() {
  const { user } = useAuthStore();
  const [library, setLibrary] = useState<string[]>([]); // mangaIds
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const q = query(
      collection(db, "library"),
      where("userId", "==", user.id)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setLibrary(snap.docs.map((d) => d.data().mangaId as string));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const addToLibrary = async (mangaId: string) => {
    if (!user) return;
    const id = `${user.id}_${mangaId}`;
    await setDoc(doc(db, "library", id), {
      userId: user.id,
      mangaId,
      addedAt: Timestamp.now(),
    });
  };

  const removeFromLibrary = async (mangaId: string) => {
    if (!user) return;
    const id = `${user.id}_${mangaId}`;
    await deleteDoc(doc(db, "library", id));
  };

  const isInLibrary = (mangaId: string) => library.includes(mangaId);

  return { library, loading, addToLibrary, removeFromLibrary, isInLibrary };
}
