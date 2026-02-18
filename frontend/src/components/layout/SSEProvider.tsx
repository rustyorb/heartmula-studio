"use client";
import { useSSE } from "@/hooks/useSSE";

export function SSEProvider({ children }: { children: React.ReactNode }) {
  useSSE();
  return <>{children}</>;
}
