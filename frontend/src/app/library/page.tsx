"use client";
import { useEffect } from "react";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { Header } from "@/components/layout/Header";
import { TrackFilters } from "@/components/library/TrackFilters";
import { TrackGrid } from "@/components/library/TrackGrid";

export default function LibraryPage() {
  const fetchTracks = useLibraryStore((s) => s.fetchTracks);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  return (
    <>
      <Header title="Library" />
      <div className="p-4 space-y-4 flex-1 overflow-auto">
        <TrackFilters />
        <TrackGrid />
      </div>
    </>
  );
}
