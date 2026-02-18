"use client";
import { useStudioStore } from "@/stores/useStudioStore";
import { Slider } from "@/components/ui/slider";
import { formatDuration } from "@/lib/utils";

export function GenerationParams() {
  const { maxLengthMs, temperature, topk, cfgScale, setParam } = useStudioStore();

  const params = [
    {
      label: "Duration",
      value: maxLengthMs,
      key: "maxLengthMs" as const,
      min: 30000,
      max: 360000,
      step: 10000,
      format: (v: number) => formatDuration(v),
    },
    {
      label: "Temperature",
      value: temperature,
      key: "temperature" as const,
      min: 0.1,
      max: 2.0,
      step: 0.1,
      format: (v: number) => v.toFixed(1),
    },
    {
      label: "Top-K",
      value: topk,
      key: "topk" as const,
      min: 1,
      max: 500,
      step: 1,
      format: (v: number) => String(v),
    },
    {
      label: "CFG Scale",
      value: cfgScale,
      key: "cfgScale" as const,
      min: 1.0,
      max: 10.0,
      step: 0.5,
      format: (v: number) => v.toFixed(1),
    },
  ];

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Generation Parameters</label>
      {params.map((p) => (
        <div key={p.key} className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{p.label}</span>
            <span className="font-mono">{p.format(p.value)}</span>
          </div>
          <Slider
            value={[p.value]}
            min={p.min}
            max={p.max}
            step={p.step}
            onValueChange={([v]) => setParam(p.key, v)}
            className="w-full"
          />
        </div>
      ))}
    </div>
  );
}
