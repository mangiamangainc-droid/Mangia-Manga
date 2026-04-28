"use client";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { useAuthStore } from "@/store/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(true);
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Set cookies for middleware
        document.cookie = `session=true; path=/; max-age=604800; SameSite=Strict`;
        const isAdmin = firebaseUser.email?.toLowerCase() === "mangia.manga.inc@gmail.com";
        if (isAdmin) {
          document.cookie = `isAdmin=true; path=/; max-age=604800; SameSite=Strict`;
        } else {
          document.cookie = `isAdmin=; path=/; max-age=0; SameSite=Strict`;
        }

        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        const userData = snap.data();

        if (userData?.banned) {
          document.cookie = `session=; path=/; max-age=0; SameSite=Strict`;
          document.cookie = `isAdmin=; path=/; max-age=0; SameSite=Strict`;
          document.cookie = `banned=true; path=/; max-age=60; SameSite=Strict`;
          await auth.signOut();
          setUser(null);
          setLoading(false);
          if (window.location.pathname !== "/login") {
            window.location.href = "/login?banned=true";
          }
          return;
        }

        setUser({
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "",
          role: userData?.role || "user",
          ...userData,
        });
      } else {
        document.cookie = `session=; path=/; max-age=0; SameSite=Strict`;
        document.cookie = `isAdmin=; path=/; max-age=0; SameSite=Strict`;
        document.cookie = `banned=; path=/; max-age=0; SameSite=Strict`;
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
