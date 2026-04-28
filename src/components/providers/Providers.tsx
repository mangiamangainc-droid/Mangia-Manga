"use client";

import { useEffect } from "react";
import { useUIStore } from "@/store/uiStore";
import { AuthProvider } from "./AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const { locale } = useUIStore();

  // Apply dark mode to <html> (light mode removed)
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("dark");
    html.classList.remove("light");
  }, []);

  // Apply RTL/LTR dir to <html>
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("lang", locale);
    html.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
  }, [locale]);

  return <AuthProvider>{children}</AuthProvider>;
}
