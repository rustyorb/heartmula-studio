"use client";
import { useEffect, useRef, useCallback } from "react";
import { usePlayerStore } from "@/stores/usePlayerStore";
import type WaveSurfer from "wavesurfer.js";

export function useAudioPlayer(containerRef: React.RefObject<HTMLDivElement | null>) {
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const { currentTrack, isPlaying, volume, setCurrentTime, setDuration } = usePlayerStore();

  useEffect(() => {
    if (!containerRef.current) return;

    let ws: WaveSurfer;

    const initWaveSurfer = async () => {
      const WaveSurfer = (await import("wavesurfer.js")).default;
      ws = WaveSurfer.create({
        container: containerRef.current!,
        waveColor: "#3f3f46",
        progressColor: "#6366f1",
        cursorColor: "#a5b4fc",
        barWidth: 2,
        barGap: 1,
        barRadius: 1,
        height: 40,
        normalize: true,
      });

      ws.on("timeupdate", (time) => setCurrentTime(time * 1000));
      ws.on("ready", () => setDuration(ws.getDuration() * 1000));
      ws.on("finish", () => usePlayerStore.getState().pause());

      wavesurfer.current = ws;
    };

    initWaveSurfer();

    return () => {
      ws?.destroy();
      wavesurfer.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef]);

  // Load track
  useEffect(() => {
    if (currentTrack && wavesurfer.current) {
      wavesurfer.current.load(currentTrack.output_url);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // Play/pause sync
  useEffect(() => {
    if (!wavesurfer.current) return;
    if (isPlaying) {
      wavesurfer.current.play().catch(() => {});
    } else {
      wavesurfer.current.pause();
    }
  }, [isPlaying]);

  // Volume sync
  useEffect(() => {
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(volume);
    }
  }, [volume]);

  const seek = useCallback((time: number) => {
    if (wavesurfer.current) {
      const duration = wavesurfer.current.getDuration();
      if (duration > 0) {
        wavesurfer.current.seekTo(time / 1000 / duration);
      }
    }
  }, []);

  return { seek };
}
