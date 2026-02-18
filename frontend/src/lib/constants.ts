export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const DEFAULT_GENERATION_PARAMS = {
  max_length_ms: 240000,
  temperature: 1.0,
  topk: 50,
  cfg_scale: 1.5,
} as const;

export const DURATION_OPTIONS = [
  { label: "30s", value: 30000 },
  { label: "1 min", value: 60000 },
  { label: "2 min", value: 120000 },
  { label: "3 min", value: 180000 },
  { label: "4 min", value: 240000 },
] as const;

export const STYLE_TAGS = {
  genre: ["pop", "rock", "hip-hop", "r&b", "jazz", "classical", "electronic", "country", "folk", "metal", "punk", "blues", "soul", "reggae", "latin", "indie"],
  mood: ["happy", "sad", "energetic", "calm", "romantic", "dark", "uplifting", "melancholic", "aggressive", "dreamy", "nostalgic", "epic"],
  instruments: ["piano", "guitar", "drums", "bass", "synthesizer", "violin", "trumpet", "saxophone", "flute", "organ", "ukulele", "cello"],
  vocals: ["male vocal", "female vocal", "duet", "choir", "rap", "whisper", "falsetto", "opera"],
  tempo: ["slow", "medium tempo", "fast", "uptempo"],
} as const;
