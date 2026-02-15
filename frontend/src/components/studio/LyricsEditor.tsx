"use client";
import { useStudioStore } from "@/stores/useStudioStore";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const sectionTags = ["[Intro]", "[Verse]", "[Pre-Chorus]", "[Chorus]", "[Bridge]", "[Outro]"];

export function LyricsEditor() {
  const { lyrics, setLyrics } = useStudioStore();

  const insertTag = (tag: string) => {
    const newLyrics = lyrics ? `${lyrics}\n\n${tag}\n` : `${tag}\n`;
    setLyrics(newLyrics);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Lyrics</label>
        <span className="text-xs text-muted-foreground">{lyrics.length} chars</span>
      </div>
      <Textarea
        placeholder={"Write your lyrics here...\n\nUse [Verse], [Chorus], etc. for structure"}
        value={lyrics}
        onChange={(e) => setLyrics(e.target.value)}
        className="min-h-[300px] font-mono text-sm resize-none"
      />
      <div className="flex flex-wrap gap-1">
        {sectionTags.map((tag) => (
          <Button
            key={tag}
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => insertTag(tag)}
          >
            {tag}
          </Button>
        ))}
      </div>
    </div>
  );
}
