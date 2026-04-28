"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { Collections } from "@/lib/firebase/firestore";
import { UserProfile } from "@/types";

const googleProvider = new GoogleAuthProvider();

// ─── Create session cookie ────────────────────────────────────────────
const createSession = async (user: User) => {
  const isAdmin = user.email?.toLowerCase() === "mangia.manga.inc@gmail.com";
  // Set simple client cookies so we completely skip the server firebase-admin stuff
  document.cookie = `session=true; path=/; max-age=604800; SameSite=Strict`;
  if (isAdmin) {
    document.cookie = `isAdmin=true; path=/; max-age=604800; SameSite=Strict`;
  }
};

// ─── Create user profile in Firestore ────────────────────────────────
const createUserProfile = async (user: User, displayName?: string): Promise<void> => {
  const isAdmin = user.email?.toLowerCase() === "mangia.manga.inc@gmail.com";
  
  const profile: Omit<UserProfile, "id"> = {
    email: user.email!,
    displayName: displayName || user.displayName || "Reader",
    photoURL: user.photoURL ?? null,
    role: isAdmin ? "admin" : "user",
    preferredLanguage: "en",
    subscriptionStatus: "inactive",
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await setDoc(doc(db, Collections.USERS, user.uid), profile, { merge: true });
};

// ─── Register ─────────────────────────────────────────────────────────
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string,
  username: string
) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  
  const isAdmin = user.email?.toLowerCase() === "mangia.manga.inc@gmail.com";
  
  await setDoc(doc(db, Collections.USERS, user.uid), {
    uid: user.uid,
    username: username.toLowerCase(),
    email: user.email!,
    displayName: displayName || user.displayName || "Reader",
    photoURL: user.photoURL ?? null,
    role: isAdmin ? "admin" : "user",
    preferredLanguage: "en",
    subscriptionStatus: "inactive",
    banned: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }, { merge: true });

  await setDoc(doc(db, "usernames", username.toLowerCase()), {
    uid: user.uid
  });

  await createSession(user);
  return user;
};

// ─── Login ────────────────────────────────────────────────────────────
export const loginWithEmail = async (identifier: string, password: string) => {
  let email = identifier;

  // If identifier is not an email, try to find it as a username
  if (!identifier.includes("@")) {
    const usernameSnap = await getDoc(doc(db, "usernames", identifier.toLowerCase()));
    if (!usernameSnap.exists()) {
      throw new Error("Username not found.");
    }
    const uid = usernameSnap.data().uid;
    const userSnap = await getDoc(doc(db, Collections.USERS, uid));
    if (!userSnap.exists()) {
      throw new Error("User data not found.");
    }
    email = userSnap.data().email;
  }

  const { user } = await signInWithEmailAndPassword(auth, email, password);
  // We don't need to call createUserProfile here because it's already created on register
  await createSession(user);
  return user;
};

// ─── Google Sign-In ───────────────────────────────────────────────────
export const loginWithGoogle = async () => {
  const { user } = await signInWithPopup(auth, googleProvider);
  
  const userSnap = await getDoc(doc(db, Collections.USERS, user.uid));
  
  if (!userSnap.exists()) {
    const isAdmin = user.email?.toLowerCase() === "mangia.manga.inc@gmail.com";
    await setDoc(doc(db, Collections.USERS, user.uid), {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || "Reader",
      photoURL: user.photoURL ?? null,
      role: isAdmin ? "admin" : "user",
      preferredLanguage: "en",
      subscriptionStatus: "inactive",
      banned: false,
      needsUsername: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await createSession(user);
    return { needsUsername: true, uid: user.uid };
  }

  await createSession(user);
  return { needsUsername: userSnap.data().needsUsername || false, uid: user.uid };
};

// ─── Reset Password ───────────────────────────────────────────────────
export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};
