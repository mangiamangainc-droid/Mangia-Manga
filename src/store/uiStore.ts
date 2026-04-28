"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type Locale = "en" | "ar";

interface UIState {
  locale: Locale;
  sidebarOpen: boolean;
  setLocale: (locale: Locale) => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      locale: "en",
      sidebarOpen: true,
      setLocale: (locale) => set({ locale }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: "mangia-ui",
    }
  )
);
