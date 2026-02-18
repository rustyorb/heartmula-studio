"use client";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { TrackCard } from "./TrackCard";

export function TrackGrid() {
  const { tracks, isLoading, toggleFavorite, deleteTrack, total, loadMore } = useLibraryStore();
  const play = usePlayerStore((s) => s.play);

  if (isLoading && tracks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading tracks...</p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">No tracks yet</p>
        <p className="text-xs text-muted-foreground mt-1">Generate some music in the Studio!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            onPlay={() => play(track)}
            onToggleFavorite={() => toggleFavorite(track.id)}
            onDelete={() => deleteTrack(track.id)}
          />
        ))}
      </div>
      {tracks.length < total && (
        <div className="flex justify-center mt-4">
          <button
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={loadMore}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}
