import type {
  GenerationRequest,
  GenerationResponse,
  JobListResponse,
  TrackListResponse,
  TrackUpdateRequest,
  SettingsUpdateRequest,
} from "@/types/api";
import type { Job, Track, UserSettings, HealthStatus, GpuStatus } from "@/types/models";
import { API_BASE_URL } from "./constants";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

class ApiClient {
  private base: string;

  constructor(base: string = API_BASE_URL) {
    this.base = base;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${this.base}${path}`, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(res.status, error.detail || "Request failed");
    }
    return res.json();
  }

  // Generation
  async submitGeneration(params: GenerationRequest): Promise<GenerationResponse> {
    return this.request("/api/generate", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async getJobs(params?: { status?: string; limit?: number; offset?: number }): Promise<JobListResponse> {
    const query = new URLSearchParams();
    if (params?.status) query.set("status", params.status);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    const qs = query.toString();
    return this.request(`/api/jobs${qs ? `?${qs}` : ""}`);
  }

  async getJob(jobId: string): Promise<Job> {
    return this.request(`/api/jobs/${jobId}`);
  }

  async cancelJob(jobId: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/jobs/${jobId}`, { method: "DELETE" });
  }

  // Tracks
  async getTracks(params?: {
    search?: string;
    tags?: string;
    favorite?: boolean;
    sort?: string;
    limit?: number;
    offset?: number;
  }): Promise<TrackListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.tags) query.set("tags", params.tags);
    if (params?.favorite !== undefined) query.set("favorite", String(params.favorite));
    if (params?.sort) query.set("sort", params.sort);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.offset) query.set("offset", String(params.offset));
    const qs = query.toString();
    return this.request(`/api/tracks${qs ? `?${qs}` : ""}`);
  }

  async updateTrack(trackId: string, data: TrackUpdateRequest): Promise<Track> {
    return this.request(`/api/tracks/${trackId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteTrack(trackId: string): Promise<void> {
    await this.request(`/api/tracks/${trackId}`, { method: "DELETE" });
  }

  getTrackAudioUrl(outputUrl: string): string {
    return `${this.base}${outputUrl}`;
  }

  // Transcription
  async transcribe(file: File): Promise<{ job_id: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${this.base}/api/transcribe`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(res.status, error.detail || "Transcription failed");
    }
    return res.json();
  }

  // System
  async getHealth(): Promise<HealthStatus> {
    return this.request("/api/health");
  }

  async getGpuStatus(): Promise<GpuStatus> {
    return this.request("/api/gpu");
  }

  // Settings
  async getSettings(): Promise<UserSettings> {
    return this.request("/api/settings");
  }

  async updateSettings(settings: SettingsUpdateRequest): Promise<UserSettings> {
    return this.request("/api/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }
}

export const api = new ApiClient();
export { ApiError };
