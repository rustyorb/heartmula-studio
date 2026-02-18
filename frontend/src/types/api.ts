import type { Job, Track } from "./models";

export interface GenerationRequest {
  lyrics: string;
  tags: string;
  max_length_ms?: number;
  temperature?: number;
  topk?: number;
  cfg_scale?: number;
}

export interface GenerationResponse {
  job_id: string;
  status: string;
  queue_position: number;
  created_at: string;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
}

export interface TrackListResponse {
  tracks: Track[];
  total: number;
}

export interface TrackUpdateRequest {
  title?: string;
  tags?: string;
  favorite?: boolean;
}

export interface SettingsUpdateRequest {
  default_temperature?: number;
  default_topk?: number;
  default_cfg_scale?: number;
  default_max_length_ms?: number;
  theme?: string;
  auto_save_tracks?: boolean;
}
