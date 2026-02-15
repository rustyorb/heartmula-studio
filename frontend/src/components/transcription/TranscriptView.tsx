"use client";
import { Button } from "@/components/ui/button";
import { useStudioStore } from "@/stores/useStudioStore";
import { useRouter } from "next/navigation";

interface TranscriptViewProps {
  lyrics: string;
}

export function TranscriptView({ lyrics }: TranscriptViewProps) {
  const setLyrics = useStudioStore((s) => s.setLyrics);
  const router = useRouter();

  const copyToStudio = () => {
    setLyrics(lyrics);
    router.push("/studio");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Transcribed Lyrics</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(lyrics)}>
            Copy
          </Button>
          <Button size="sm" onClick={copyToStudio}>
            Use in Studio
          </Button>
        </div>
      </div>
      <pre className="p-4 rounded-lg bg-muted text-sm whitespace-pre-wrap font-mono">
        {lyrics}
      </pre>
    </div>
  );
}
