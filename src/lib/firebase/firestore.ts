import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  increment,
  arrayUnion,
  arrayRemove,
  QueryConstraint,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./config";

// ─── Collection Refs ────────────────────────────────────────────────
export const Collections = {
  MANGA: "manga",
  SEASONS: "seasons",
  CHAPTERS: "chapters",
  USERS: "users",
  SUBSCRIPTIONS: "subscriptions",
  PLANS: "plans",
  COMMENTS: "comments",
  RATINGS: "ratings",
  READING_PROGRESS: "readingProgress",
  NOTIFICATIONS: "notifications",
  ADS: "ads",
  SETTINGS: "settings",
  STRIPE_CUSTOMERS: "stripeCustomers",
  LIBRARY: "library",
  LIKES: "likes",
} as const;

// ─── Generic helpers ────────────────────────────────────────────────
export const getDocument = async <T>(
  collectionName: string,
  id: string
): Promise<T | null> => {
  const ref = doc(db, collectionName, id);
  const snap = await getDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null;
};

export const setDocument = async (
  collectionName: string,
  id: string,
  data: DocumentData
) => {
  const ref = doc(db, collectionName, id);
  await setDoc(ref, { ...data, updatedAt: Timestamp.now() }, { merge: true });
};

export const updateDocument = async (
  collectionName: string,
  id: string,
  data: Partial<DocumentData>
) => {
  const ref = doc(db, collectionName, id);
  await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
};

export const deleteDocument = async (collectionName: string, id: string) => {
  const ref = doc(db, collectionName, id);
  await deleteDoc(ref);
};

export const queryCollection = async <T>(
  collectionName: string,
  constraints: QueryConstraint[]
): Promise<T[]> => {
  const ref = collection(db, collectionName);
  const q = query(ref, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
};

export { Timestamp, increment, arrayUnion, arrayRemove, where, orderBy, limit, startAfter };
