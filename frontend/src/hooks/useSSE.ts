"use client";

import { useEffect } from "react";
import { sseManager } from "@/lib/sse";
import { useQueueStore } from "@/stores/useQueueStore";
import { useSystemStore } from "@/stores/useSystemStore";
import type { Job, GpuStatus } from "@/types/models";

export function useSSE() {
  useEffect(() => {
    sseManager.connect();

    const unsubs = [
      sseManager.on("system:connected", () => {
        useSystemStore.getState().setConnected(true);
      }),
      sseManager.on("system:disconnected", () => {
        useSystemStore.getState().setConnected(false);
      }),
      sseManager.on("model:loading_progress", (data) => {
        useSystemStore.getState().setModelState("loading");
        useSystemStore.getState().setModelLoadProgress(
          data.progress as number,
          data.message as string
        );
      }),
      sseManager.on("model:ready", () => {
        useSystemStore.getState().setModelState("ready");
        useSystemStore.getState().setModelLoadProgress(1);
      }),
      sseManager.on("job:queued", (data) => {
        useQueueStore.getState().addJob(data as unknown as Job);
      }),
      sseManager.on("job:started", (data) => {
        useQueueStore.getState().updateJobStatus(data.job_id as string, {
          status: "processing",
        });
      }),
      sseManager.on("job:progress", (data) => {
        useQueueStore.getState().updateJobProgress(
          data.job_id as string,
          data.progress as number
        );
      }),
      sseManager.on("job:completed", (data) => {
        useQueueStore.getState().updateJobStatus(data.job_id as string, {
          status: "completed",
          output_url: data.output_url as string,
          duration_ms: data.duration_ms as number,
        });
      }),
      sseManager.on("job:failed", (data) => {
        useQueueStore.getState().updateJobStatus(data.job_id as string, {
          status: "failed",
          error: data.error as string,
        });
      }),
      sseManager.on("job:cancelled", (data) => {
        useQueueStore.getState().removeJob(data.job_id as string);
      }),
      sseManager.on("gpu:status", (data) => {
        useSystemStore.getState().setGpuStatus(data as unknown as GpuStatus);
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
      sseManager.disconnect();
    };
  }, []);
}
