"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import type { Track } from "@/types/models";

interface TrackCardProps {
  track: Track;
  onPlay: () => void;
  onToggleFavorite: () => void;
  onDelete: () => void;
}

export function TrackCard({ track, onPlay, onToggleFavorite, onDelete }: TrackCardProps) {
  return (
    <Card className="group hover:border-accent transition-colors">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-sm truncate">{track.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatDuration(track.duration_ms)} · {formatRelativeTime(track.created_at)}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={onPlay}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </Button>
        </div>

        <div className="flex flex-wrap gap-1">
          {track.tags.split(",").slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag.trim()}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={onToggleFavorite}
          >
            {track.favorite ? "\u2605" : "\u2606"} {track.favorite ? "Liked" : "Like"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
