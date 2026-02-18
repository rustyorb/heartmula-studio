import { create } from "zustand";
import { api } from "@/lib/api";
import type { UserSettings } from "@/types/models";

interface SettingsState {
  settings: UserSettings | null;
  isLoading: boolean;

  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await api.getSettings();
      set({ settings });
    } finally {
      set({ isLoading: false });
    }
  },

  updateSettings: async (updates) => {
    const settings = await api.updateSettings(updates);
    set({ settings });
  },
}));
