import { create } from "zustand";
import { api } from "@/lib/api";
import type { Track } from "@/types/models";

interface LibraryState {
  tracks: Track[];
  total: number;
  search: string;
  sortBy: string;
  showFavoritesOnly: boolean;
  isLoading: boolean;
  offset: number;
  limit: number;

  setSearch: (search: string) => void;
  setSortBy: (sort: string) => void;
  setShowFavoritesOnly: (show: boolean) => void;
  fetchTracks: () => Promise<void>;
  loadMore: () => Promise<void>;
  toggleFavorite: (trackId: string) => Promise<void>;
  deleteTrack: (trackId: string) => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  tracks: [],
  total: 0,
  search: "",
  sortBy: "created_at",
  showFavoritesOnly: false,
  isLoading: false,
  offset: 0,
  limit: 20,

  setSearch: (search) => {
    set({ search, offset: 0, tracks: [] });
    get().fetchTracks();
  },
  setSortBy: (sortBy) => {
    set({ sortBy, offset: 0, tracks: [] });
    get().fetchTracks();
  },
  setShowFavoritesOnly: (showFavoritesOnly) => {
    set({ showFavoritesOnly, offset: 0, tracks: [] });
    get().fetchTracks();
  },

  fetchTracks: async () => {
    const { search, sortBy, showFavoritesOnly, limit } = get();
    set({ isLoading: true });
    try {
      const res = await api.getTracks({
        search: search || undefined,
        sort: sortBy,
        favorite: showFavoritesOnly || undefined,
        limit,
        offset: 0,
      });
      set({ tracks: res.tracks, total: res.total, offset: limit });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMore: async () => {
    const { search, sortBy, showFavoritesOnly, limit, offset, tracks } = get();
    set({ isLoading: true });
    try {
      const res = await api.getTracks({
        search: search || undefined,
        sort: sortBy,
        favorite: showFavoritesOnly || undefined,
        limit,
        offset,
      });
      set({ tracks: [...tracks, ...res.tracks], total: res.total, offset: offset + limit });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (trackId) => {
    const track = get().tracks.find((t) => t.id === trackId);
    if (!track) return;
    const updated = await api.updateTrack(trackId, { favorite: !track.favorite });
    set((s) => ({
      tracks: s.tracks.map((t) => (t.id === trackId ? updated : t)),
    }));
  },

  deleteTrack: async (trackId) => {
    await api.deleteTrack(trackId);
    set((s) => ({
      tracks: s.tracks.filter((t) => t.id !== trackId),
      total: s.total - 1,
    }));
  },
}));
