"use client";
import { GpuStatus } from "@/components/shared/GpuStatus";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="h-12 border-b border-border flex items-center justify-between px-4 bg-card/50">
      <h2 className="text-sm font-medium">{title}</h2>
      <GpuStatus />
    </header>
  );
}
