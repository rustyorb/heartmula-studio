import { LyricsEditor } from "./LyricsEditor";
import { TagPicker } from "./TagPicker";
import { GenerationParams } from "./GenerationParams";
import { GenerateButton } from "./GenerateButton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

export function StudioPanel() {
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        <LyricsEditor />
        <Separator />
        <TagPicker />
        <Separator />
        <GenerationParams />
        <GenerateButton />
      </div>
    </ScrollArea>
  );
}
