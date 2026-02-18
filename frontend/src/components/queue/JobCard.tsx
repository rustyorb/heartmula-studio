"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { Job } from "@/types/models";

const statusStyles: Record<Job["status"], string> = {
  pending: "bg-zinc-500/10 text-zinc-400",
  processing: "bg-blue-500/10 text-blue-400",
  completed: "bg-green-500/10 text-green-400",
  failed: "bg-red-500/10 text-red-400",
  cancelled: "bg-zinc-500/10 text-zinc-400",
};

interface JobCardProps {
  job: Job;
  onCancel?: () => void;
  onPlay?: () => void;
}

export function JobCard({ job, onCancel, onPlay }: JobCardProps) {
  return (
    <div className="p-3 rounded-lg border border-border bg-card space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm truncate">{job.tags}</p>
          <p className="text-xs text-muted-foreground truncate">
            {job.lyrics.split("\n")[0]?.slice(0, 50)}
          </p>
        </div>
        <Badge variant="outline" className={cn("text-xs shrink-0", statusStyles[job.status])}>
          {job.status}
        </Badge>
      </div>

      {job.status === "processing" && job.progress !== null && (
        <div className="space-y-1">
          <Progress value={(job.progress || 0) * 100} className="h-1.5" />
          <p className="text-xs text-muted-foreground">{Math.round((job.progress || 0) * 100)}%</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{formatRelativeTime(job.created_at)}</span>
        <div className="flex gap-1">
          {job.status === "pending" && onCancel && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {job.status === "completed" && job.output_url && onPlay && (
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={onPlay}>
              Play
            </Button>
          )}
        </div>
      </div>

      {job.status === "failed" && job.error && (
        <p className="text-xs text-red-400">{job.error}</p>
      )}
    </div>
  );
}
