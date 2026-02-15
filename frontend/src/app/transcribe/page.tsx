"use client";
import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { UploadZone } from "@/components/transcription/UploadZone";
import { TranscriptView } from "@/components/transcription/TranscriptView";
import { sseManager } from "@/lib/sse";

export default function TranscribePage() {
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsub = sseManager.on("transcription:completed", (data) => {
      if (data.job_id === jobId) {
        setLyrics(data.lyrics as string);
        setIsProcessing(false);
      }
    });
    return unsub;
  }, [jobId]);

  const handleJobCreated = (id: string) => {
    setJobId(id);
    setLyrics(null);
    setIsProcessing(true);
  };

  return (
    <>
      <Header title="Transcribe" />
      <div className="p-4 space-y-6 flex-1 overflow-auto max-w-2xl">
        <UploadZone onJobCreated={handleJobCreated} />
        {isProcessing && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Transcribing audio...</p>
          </div>
        )}
        {lyrics && <TranscriptView lyrics={lyrics} />}
      </div>
    </>
  );
}
