"use client";
import { useStudioStore } from "@/stores/useStudioStore";
import { Button } from "@/components/ui/button";

export function GenerateButton() {
  const { lyrics, tags, isSubmitting, submit } = useStudioStore();

  const isDisabled = isSubmitting || !lyrics.trim() || tags.length === 0;
  // Allow generation even if model isn't ready (mock mode works)

  const handleGenerate = async () => {
    const jobId = await submit();
    if (jobId) {
      // Could show a toast here
    }
  };

  return (
    <Button
      onClick={handleGenerate}
      disabled={isDisabled}
      className="w-full h-11 text-base font-medium"
      size="lg"
    >
      {isSubmitting ? "Submitting..." : "Generate"}
    </Button>
  );
}
