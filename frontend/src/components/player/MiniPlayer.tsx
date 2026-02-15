"use client";
import { useRef } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatDuration } from "@/lib/utils";

export function MiniPlayer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { currentTrack, isPlaying, currentTime, duration, volume, togglePlay, setVolume } = usePlayerStore();
  useAudioPlayer(containerRef);

  if (!currentTrack) return null;

  return (
    <div className="h-20 border-t border-border bg-card px-4 flex items-center gap-4">
      {/* Track info */}
      <div className="w-48 min-w-0">
        <p className="text-sm font-medium truncate">{currentTrack.title}</p>
        <p className="text-xs text-muted-foreground truncate">{currentTrack.tags}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={togglePlay}>
          {isPlaying ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </Button>
      </div>

      {/* Time */}
      <span className="text-xs text-muted-foreground font-mono w-10 text-right">
        {formatDuration(currentTime)}
      </span>

      {/* Waveform */}
      <div ref={containerRef} className="flex-1 min-w-0" />

      {/* Duration */}
      <span className="text-xs text-muted-foreground font-mono w-10">
        {formatDuration(duration)}
      </span>

      {/* Volume */}
      <div className="flex items-center gap-2 w-24">
        <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
        <Slider
          value={[volume]}
          min={0}
          max={1}
          step={0.05}
          onValueChange={([v]) => setVolume(v)}
          className="w-full"
        />
      </div>
    </div>
  );
}
