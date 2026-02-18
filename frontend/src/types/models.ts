export interface Job {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  lyrics: string;
  tags: string;
  max_length_ms: number;
  temperature: number;
  topk: number;
  cfg_scale: number;
  output_path: string | null;
  output_url: string | null;
  duration_ms: number | null;
  error: string | null;
  progress: number | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface Track {
  id: string;
  job_id: string;
  title: string;
  tags: string;
  lyrics: string;
  output_url: string;
  duration_ms: number;
  file_size_bytes: number | null;
  favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  default_temperature: number;
  default_topk: number;
  default_cfg_scale: number;
  default_max_length_ms: number;
  theme: "dark" | "light";
  auto_save_tracks: boolean;
}

export interface GpuStatus {
  name: string;
  vram_total_gb: number;
  vram_used_gb: number;
  vram_free_gb: number;
  use_mmgp: boolean;
}

export type ModelState = "unloaded" | "downloading" | "loading" | "ready" | "generating" | "error";

export interface HealthStatus {
  status: string;
  model_state: ModelState;
  gpu_available: boolean;
}
