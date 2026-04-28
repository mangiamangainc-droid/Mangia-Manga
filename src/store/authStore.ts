import { create } from "zustand";

interface AuthStore {
  user: any | null;
  loading: boolean;
  setUser: (user: any | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));
