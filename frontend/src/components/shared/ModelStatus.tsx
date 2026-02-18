"use client";
import { useSystemStore } from "@/stores/useSystemStore";
import { cn } from "@/lib/utils";

const stateConfig: Record<string, { label: string; className: string }> = {
  unloaded: { label: "Model Unloaded", className: "bg-zinc-500/10 text-zinc-400" },
  downloading: { label: "Downloading...", className: "bg-blue-500/10 text-blue-400" },
  loading: { label: "Loading...", className: "bg-yellow-500/10 text-yellow-400" },
  ready: { label: "Ready", className: "bg-green-500/10 text-green-400" },
  generating: { label: "Generating...", className: "bg-purple-500/10 text-purple-400" },
  error: { label: "Error", className: "bg-red-500/10 text-red-400" },
};

export function ModelStatus() {
  const { modelState, modelLoadProgress } = useSystemStore();
  const config = stateConfig[modelState] ?? stateConfig.unloaded;

  return (
    <div className="flex items-center gap-2">
      <div className={cn("w-2 h-2 rounded-full", {
        "bg-zinc-500": modelState === "unloaded",
        "bg-blue-400 animate-pulse": modelState === "downloading",
        "bg-yellow-400 animate-pulse": modelState === "loading",
        "bg-green-400": modelState === "ready",
        "bg-purple-400 animate-pulse": modelState === "generating",
        "bg-red-400": modelState === "error",
      })} />
      <span className="text-xs text-muted-foreground">{config.label}</span>
      {(modelState === "loading" || modelState === "downloading") && (
        <span className="text-xs text-muted-foreground">{Math.round(modelLoadProgress * 100)}%</span>
      )}
    </div>
  );
}
