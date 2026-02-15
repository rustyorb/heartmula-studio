import { create } from "zustand";
import { api } from "@/lib/api";
import { DEFAULT_GENERATION_PARAMS } from "@/lib/constants";

interface StudioState {
  lyrics: string;
  tags: string[];
  maxLengthMs: number;
  temperature: number;
  topk: number;
  cfgScale: number;
  isSubmitting: boolean;

  setLyrics: (lyrics: string) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setTags: (tags: string[]) => void;
  setParam: (key: "maxLengthMs" | "temperature" | "topk" | "cfgScale", value: number) => void;
  reset: () => void;
  submit: () => Promise<string | null>;
}

const initialState = {
  lyrics: "",
  tags: [] as string[],
  maxLengthMs: DEFAULT_GENERATION_PARAMS.max_length_ms,
  temperature: DEFAULT_GENERATION_PARAMS.temperature,
  topk: DEFAULT_GENERATION_PARAMS.topk,
  cfgScale: DEFAULT_GENERATION_PARAMS.cfg_scale,
  isSubmitting: false,
};

export const useStudioStore = create<StudioState>((set, get) => ({
  ...initialState,

  setLyrics: (lyrics) => set({ lyrics }),
  addTag: (tag) => set((s) => ({ tags: s.tags.includes(tag) ? s.tags : [...s.tags, tag] })),
  removeTag: (tag) => set((s) => ({ tags: s.tags.filter((t) => t !== tag) })),
  setTags: (tags) => set({ tags }),
  setParam: (key, value) => set({ [key]: value }),
  reset: () => set(initialState),

  submit: async () => {
    const { lyrics, tags, maxLengthMs, temperature, topk, cfgScale } = get();
    if (!lyrics.trim() || tags.length === 0) return null;

    set({ isSubmitting: true });
    try {
      const res = await api.submitGeneration({
        lyrics,
        tags: tags.join(","),
        max_length_ms: maxLengthMs,
        temperature,
        topk,
        cfg_scale: cfgScale,
      });
      return res.job_id;
    } catch (err) {
      console.error("Generation submit failed:", err);
      return null;
    } finally {
      set({ isSubmitting: false });
    }
  },
}));
