import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  increment,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Collections } from "@/lib/firebase/firestore";
import { Manga, Season, Chapter } from "@/types";

// ─── Manga CRUD ───────────────────────────────────────────────────────
export const createManga = async (data: Omit<Manga, "id" | "createdAt" | "updatedAt" | "totalViews" | "totalChapters" | "totalSeasons" | "averageRating" | "totalRatings">) => {
  const ref = await addDoc(collection(db, Collections.MANGA), {
    ...data,
    totalViews: 0,
    totalChapters: 0,
    totalSeasons: 0,
    averageRating: 0,
    totalRatings: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
};

export const updateManga = async (mangaId: string, data: Partial<Manga>) => {
  await updateDoc(doc(db, Collections.MANGA, mangaId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const deleteManga = async (mangaId: string) => {
  await deleteDoc(doc(db, Collections.MANGA, mangaId));
};

// ─── Season CRUD ──────────────────────────────────────────────────────
export const createSeason = async (data: Omit<Season, "id" | "createdAt" | "updatedAt" | "totalChapters">) => {
  const ref = await addDoc(collection(db, Collections.SEASONS), {
    ...data,
    totalChapters: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  // Increment manga season count
  await updateDoc(doc(db, Collections.MANGA, data.mangaId), {
    totalSeasons: increment(1),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
};

export const updateSeason = async (seasonId: string, data: Partial<Season>) => {
  await updateDoc(doc(db, Collections.SEASONS, seasonId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

// ─── Chapter CRUD ─────────────────────────────────────────────────────
export const createChapter = async (data: Omit<Chapter, "id" | "createdAt" | "updatedAt" | "totalViews" | "totalLikes" | "notificationSent">) => {
  const ref = await addDoc(collection(db, Collections.CHAPTERS), {
    ...data,
    totalViews: 0,
    totalLikes: 0,
    notificationSent: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  // Increment counts
  await updateDoc(doc(db, Collections.MANGA, data.mangaId), {
    totalChapters: increment(1),
    updatedAt: Timestamp.now(),
  });
  await updateDoc(doc(db, Collections.SEASONS, data.seasonId), {
    totalChapters: increment(1),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
};

export const updateChapter = async (chapterId: string, data: Partial<Chapter>) => {
  await updateDoc(doc(db, Collections.CHAPTERS, chapterId), {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const deleteChapter = async (chapterId: string, mangaId: string, seasonId: string) => {
  await deleteDoc(doc(db, Collections.CHAPTERS, chapterId));
  await updateDoc(doc(db, Collections.MANGA, mangaId), {
    totalChapters: increment(-1),
  });
  await updateDoc(doc(db, Collections.SEASONS, seasonId), {
    totalChapters: increment(-1),
  });
};

// ─── Increment chapter view ───────────────────────────────────────────
export const incrementChapterView = async (chapterId: string, mangaId: string) => {
  await updateDoc(doc(db, Collections.CHAPTERS, chapterId), {
    totalViews: increment(1),
  });
  await updateDoc(doc(db, Collections.MANGA, mangaId), {
    totalViews: increment(1),
  });
};

// ─── Toggle chapter like ──────────────────────────────────────────────
export const toggleChapterLike = async (
  chapterId: string,
  userId: string,
  currentlyLiked: boolean
) => {
  const likeId = `${userId}_${chapterId}`;
  const likeRef = doc(db, "likes", likeId);
  if (currentlyLiked) {
    await deleteDoc(likeRef);
    await updateDoc(doc(db, Collections.CHAPTERS, chapterId), {
      totalLikes: increment(-1),
    });
  } else {
    await setDoc(likeRef, { userId, chapterId, likedAt: Timestamp.now() });
    await updateDoc(doc(db, Collections.CHAPTERS, chapterId), {
      totalLikes: increment(1),
    });
  }
};

// ─── Submit / update rating ───────────────────────────────────────────
export const submitRating = async (
  mangaId: string,
  chapterId: string,
  userId: string,
  stars: number
) => {
  const ratingId = `${userId}_${chapterId}`;
  await setDoc(doc(db, Collections.RATINGS, ratingId), {
    mangaId,
    chapterId,
    userId,
    stars,
    createdAt: Timestamp.now(),
  });
};
