"use client";
import { Sidebar } from "./Sidebar";
import { MiniPlayer } from "@/components/player/MiniPlayer";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {children}
        </div>
        <MiniPlayer />
      </div>
    </div>
  );
}
