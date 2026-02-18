import { create } from "zustand";
import { api } from "@/lib/api";
import type { Job } from "@/types/models";

interface QueueState {
  jobs: Job[];
  activeJobId: string | null;
  activeJobProgress: number;

  addJob: (job: Job) => void;
  updateJobStatus: (jobId: string, updates: Partial<Job>) => void;
  updateJobProgress: (jobId: string, progress: number) => void;
  removeJob: (jobId: string) => void;
  cancelJob: (jobId: string) => Promise<void>;
  fetchJobs: () => Promise<void>;
}

export const useQueueStore = create<QueueState>((set, get) => ({
  jobs: [],
  activeJobId: null,
  activeJobProgress: 0,

  addJob: (job) =>
    set((s) => ({
      jobs: [job, ...s.jobs.filter((j) => j.id !== job.id)],
    })),

  updateJobStatus: (jobId, updates) =>
    set((s) => {
      const isProcessing = updates.status === ("processing" as Job["status"]);
      return {
        jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, ...updates } : j)),
        activeJobId: isProcessing ? jobId : s.activeJobId === jobId && !isProcessing ? null : s.activeJobId,
        activeJobProgress: s.activeJobId === jobId && !isProcessing ? 0 : s.activeJobProgress,
      };
    }),

  updateJobProgress: (jobId, progress) =>
    set((s) => ({
      activeJobId: jobId,
      activeJobProgress: progress,
      jobs: s.jobs.map((j) =>
        j.id === jobId ? { ...j, progress } : j
      ),
    })),

  removeJob: (jobId) =>
    set((s) => ({
      jobs: s.jobs.filter((j) => j.id !== jobId),
      activeJobId: s.activeJobId === jobId ? null : s.activeJobId,
    })),

  cancelJob: async (jobId) => {
    await api.cancelJob(jobId);
    get().removeJob(jobId);
  },

  fetchJobs: async () => {
    const res = await api.getJobs({ limit: 50 });
    set({ jobs: res.jobs });
    const processing = res.jobs.find((j) => j.status === "processing");
    if (processing) {
      set({ activeJobId: processing.id, activeJobProgress: processing.progress || 0 });
    }
  },
}));
