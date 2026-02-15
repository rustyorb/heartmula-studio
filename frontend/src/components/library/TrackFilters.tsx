"use client";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function TrackFilters() {
  const { search, setSearch, sortBy, setSortBy, showFavoritesOnly, setShowFavoritesOnly, total } = useLibraryStore();

  return (
    <div className="flex items-center gap-3">
      <Input
        placeholder="Search tracks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 w-64 text-sm"
      />
      <Button
        variant={showFavoritesOnly ? "secondary" : "outline"}
        size="sm"
        className="h-8 text-xs"
        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
      >
        {showFavoritesOnly ? "\u2605 Favorites" : "\u2606 Favorites"}
      </Button>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        Sort:
        {(["created_at", "title", "duration_ms"] as const).map((s) => (
          <Button
            key={s}
            variant="ghost"
            size="sm"
            className={cn("h-6 text-xs px-2", sortBy === s && "text-foreground bg-accent")}
            onClick={() => setSortBy(s)}
          >
            {s === "created_at" ? "Date" : s === "title" ? "Title" : "Duration"}
          </Button>
        ))}
      </div>
      <span className="text-xs text-muted-foreground ml-auto">{total} tracks</span>
    </div>
  );
}
