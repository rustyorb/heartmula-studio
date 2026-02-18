"use client";
import { useSystemStore } from "@/stores/useSystemStore";
import { cn } from "@/lib/utils";

export function ConnectionStatus() {
  const connected = useSystemStore((s) => s.connected);
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title={connected ? "Connected" : "Disconnected"}>
      <div className={cn("w-1.5 h-1.5 rounded-full", connected ? "bg-green-400" : "bg-red-400 animate-pulse")} />
    </div>
  );
}
