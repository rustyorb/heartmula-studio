"use client";
import { useState } from "react";
import { useStudioStore } from "@/stores/useStudioStore";
import { STYLE_TAGS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const categories = Object.keys(STYLE_TAGS) as (keyof typeof STYLE_TAGS)[];

export function TagPicker() {
  const { tags, addTag, removeTag } = useStudioStore();
  const [search, setSearch] = useState("");

  const filteredTags = (category: keyof typeof STYLE_TAGS) => {
    const categoryTags = STYLE_TAGS[category];
    if (!search) return categoryTags;
    return categoryTags.filter((t) => t.toLowerCase().includes(search.toLowerCase()));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Style Tags</label>
        <span className="text-xs text-muted-foreground">{tags.length} selected</span>
      </div>

      {/* Selected tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive/20"
              onClick={() => removeTag(tag)}
            >
              {tag} ×
            </Badge>
          ))}
        </div>
      )}

      <Input
        placeholder="Search tags..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-sm"
      />

      <Tabs defaultValue="genre" className="w-full">
        <TabsList className="w-full h-8">
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="text-xs capitalize flex-1">
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
        {categories.map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-2">
            <ScrollArea className="h-24">
              <div className="flex flex-wrap gap-1">
                {filteredTags(cat).map((tag) => {
                  const isSelected = tags.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={isSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer text-xs",
                        isSelected ? "" : "hover:bg-accent"
                      )}
                      onClick={() => isSelected ? removeTag(tag) : addTag(tag)}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
