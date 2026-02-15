export type SSEEventType =
  | "system:connected"
  | "model:loading_progress"
  | "model:ready"
  | "job:queued"
  | "job:started"
  | "job:progress"
  | "job:completed"
  | "job:failed"
  | "job:cancelled"
  | "gpu:status"
  | "transcription:completed"
  | "heartbeat";

export interface SSEMessage {
  event: SSEEventType;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface JobProgressData {
  job_id: string;
  step: number;
  total_steps: number;
  progress: number;
}

export interface JobCompletedData {
  job_id: string;
  track_id: string;
  output_url: string;
  duration_ms: number;
}

export interface JobFailedData {
  job_id: string;
  error: string;
}

export interface ModelProgressData {
  progress: number;
  message: string;
}

export interface GpuStatusData {
  vram_used_gb: number;
  vram_free_gb: number;
}
