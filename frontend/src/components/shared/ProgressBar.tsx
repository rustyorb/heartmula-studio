import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0-1
  label?: string;
  className?: string;
  showPercent?: boolean;
}

export function ProgressBar({ value, label, className, showPercent = true }: ProgressBarProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {(label || showPercent) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          {label && <span>{label}</span>}
          {showPercent && <span>{Math.round(value * 100)}%</span>}
        </div>
      )}
      <Progress value={value * 100} className="h-2" />
    </div>
  );
}
