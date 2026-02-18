import type { SSEEventType } from "@/types/events";

type SSEHandler = (data: Record<string, unknown>) => void;

class SSEManager {
  private eventSource: EventSource | null = null;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private handlers = new Map<string, Set<SSEHandler>>();
  private url: string;

  constructor(url: string = "/api/events") {
    this.url = url;
  }

  connect(): void {
    if (this.eventSource?.readyState === EventSource.OPEN) return;

    this.eventSource = new EventSource(this.url);

    this.eventSource.onopen = () => {
      this.reconnectDelay = 1000;
      this.dispatch("system:connected", {});
    };

    this.eventSource.onerror = () => {
      this.eventSource?.close();
      this.dispatch("system:disconnected", {});
      this.scheduleReconnect();
    };

    this.eventSource.onmessage = (e) => {
      try {
        const message = JSON.parse(e.data);
        this.dispatch(message.event, message.data);
      } catch {
        // ignore malformed messages
      }
    };
  }

  on(event: SSEEventType | "system:disconnected", handler: SSEHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  private dispatch(event: string, data: Record<string, unknown>): void {
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (err) {
        console.error(`SSE handler error for ${event}:`, err);
      }
    });
  }

  private scheduleReconnect(): void {
    setTimeout(() => this.connect(), this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }
}

export const sseManager = new SSEManager();
