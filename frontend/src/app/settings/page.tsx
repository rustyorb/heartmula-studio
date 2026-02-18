"use client";
import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { useSystemStore } from "@/stores/useSystemStore";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDuration } from "@/lib/utils";

export default function SettingsPage() {
  const { settings, isLoading, fetchSettings, updateSettings } = useSettingsStore();
  const gpu = useSystemStore((s) => s.gpu);
  const modelState = useSystemStore((s) => s.modelState);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (isLoading || !settings) {
    return (
      <>
        <Header title="Settings" />
        <div className="p-4">
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Settings" />
      <div className="p-4 space-y-6 max-w-xl overflow-auto flex-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Default Generation Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span>Duration</span>
                <span className="font-mono text-muted-foreground">{formatDuration(settings.default_max_length_ms)}</span>
              </div>
              <Slider
                value={[settings.default_max_length_ms]}
                min={30000} max={360000} step={10000}
                onValueChange={([v]) => updateSettings({ default_max_length_ms: v })}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span>Temperature</span>
                <span className="font-mono text-muted-foreground">{settings.default_temperature.toFixed(1)}</span>
              </div>
              <Slider
                value={[settings.default_temperature]}
                min={0.1} max={2.0} step={0.1}
                onValueChange={([v]) => updateSettings({ default_temperature: v })}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span>Top-K</span>
                <span className="font-mono text-muted-foreground">{settings.default_topk}</span>
              </div>
              <Slider
                value={[settings.default_topk]}
                min={1} max={500} step={1}
                onValueChange={([v]) => updateSettings({ default_topk: v })}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span>CFG Scale</span>
                <span className="font-mono text-muted-foreground">{settings.default_cfg_scale.toFixed(1)}</span>
              </div>
              <Slider
                value={[settings.default_cfg_scale]}
                min={1.0} max={10.0} step={0.5}
                onValueChange={([v]) => updateSettings({ default_cfg_scale: v })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">GPU</span>
              <span>{gpu?.name || "Not detected"}</span>
            </div>
            {gpu && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VRAM</span>
                <span>{gpu.vram_used_gb}/{gpu.vram_total_gb} GB used</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Model Status</span>
              <span className="capitalize">{modelState}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Auto-save tracks</span>
              <Button
                variant={settings.auto_save_tracks ? "secondary" : "outline"}
                size="sm"
                onClick={() => updateSettings({ auto_save_tracks: !settings.auto_save_tracks })}
              >
                {settings.auto_save_tracks ? "On" : "Off"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
