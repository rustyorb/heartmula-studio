import { StudioPanel } from "@/components/studio/StudioPanel";
import { QueuePanel } from "@/components/queue/QueuePanel";
import { Header } from "@/components/layout/Header";

export default function StudioPage() {
  return (
    <>
      <Header title="Studio" />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 border-r border-border">
          <StudioPanel />
        </div>
        <div className="w-80 shrink-0">
          <QueuePanel />
        </div>
      </div>
    </>
  );
}
