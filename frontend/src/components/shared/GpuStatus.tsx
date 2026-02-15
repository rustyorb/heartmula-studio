"use client";
import { useSystemStore } from "@/stores/useSystemStore";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function GpuStatus() {
  const gpu = useSystemStore((s) => s.gpu);
  if (!gpu) return <Badge variant="outline">No GPU</Badge>;

  const usedPercent = (gpu.vram_used_gb / gpu.vram_total_gb) * 100;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">{gpu.name}</span>
      <div className="flex items-center gap-1.5">
        <Progress value={usedPercent} className="w-16 h-1.5" />
        <span className="text-muted-foreground whitespace-nowrap">
          {gpu.vram_used_gb}/{gpu.vram_total_gb}GB
        </span>
      </div>
    </div>
  );
}
