import { create } from "zustand";
import type { GpuStatus, ModelState } from "@/types/models";

interface SystemState {
  connected: boolean;
  modelState: ModelState;
  modelLoadProgress: number;
  modelLoadMessage: string;
  gpu: GpuStatus | null;

  setConnected: (connected: boolean) => void;
  setModelState: (state: ModelState) => void;
  setModelLoadProgress: (progress: number, message?: string) => void;
  setGpuStatus: (gpu: GpuStatus) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  connected: false,
  modelState: "unloaded",
  modelLoadProgress: 0,
  modelLoadMessage: "",
  gpu: null,

  setConnected: (connected) => set({ connected }),
  setModelState: (modelState) => set({ modelState }),
  setModelLoadProgress: (modelLoadProgress, modelLoadMessage) =>
    set({ modelLoadProgress, modelLoadMessage: modelLoadMessage || "" }),
  setGpuStatus: (gpu) => set({ gpu }),
}));
