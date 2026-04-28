"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export function useLogo() {
  const [logoURL, setLogoURL] = useState<string | null>(null);
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "siteLogo"), (snap) => {
      if (snap.exists()) setLogoURL(snap.data().url ?? null);
      else setLogoURL(null);
    });
    return () => unsub();
  }, []);
  return logoURL;
}
