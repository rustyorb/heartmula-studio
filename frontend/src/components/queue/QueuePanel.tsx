"use client";
import { useEffect } from "react";
import { useQueueStore } from "@/stores/useQueueStore";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { JobCard } from "./JobCard";
import { ScrollArea } from "@/components/ui/scroll-area";

export function QueuePanel() {
  const { jobs, fetchJobs, cancelJob } = useQueueStore();
  const play = usePlayerStore((s) => s.play);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const activeJobs = jobs.filter((j) => j.status === "processing");
  const pendingJobs = jobs.filter((j) => j.status === "pending");
  const recentJobs = jobs.filter((j) => j.status === "completed" || j.status === "failed").slice(0, 5);

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-medium">Queue</h3>

        {activeJobs.length === 0 && pendingJobs.length === 0 && recentJobs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No jobs yet</p>
            <p className="text-xs text-muted-foreground mt-1">Submit a generation to get started</p>
          </div>
        )}

        {activeJobs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Active</p>
            {activeJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}

        {pendingJobs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending ({pendingJobs.length})</p>
            {pendingJobs.map((job) => (
              <JobCard key={job.id} job={job} onCancel={() => cancelJob(job.id)} />
            ))}
          </div>
        )}

        {recentJobs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Recent</p>
            {recentJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onPlay={job.output_url ? () => play({
                  id: job.id,
                  job_id: job.id,
                  title: job.tags,
                  tags: job.tags,
                  lyrics: job.lyrics,
                  output_url: job.output_url!,
                  duration_ms: job.duration_ms || 0,
                  file_size_bytes: null,
                  favorite: false,
                  created_at: job.created_at,
                  updated_at: job.created_at,
                }) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
