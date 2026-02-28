/**
 * Metrics collector for test run performance tracking.
 */
import type { MetricsSnapshot } from "./config";

export class MetricsCollector {
  private wsMessagesSent = 0;
  private wsMessagesReceived = 0;
  private httpRequestsMade = 0;
  private errorsTotal = 0;
  private errorsByType: Record<string, number> = {};
  private latencies: number[] = [];
  private snapshots: MetricsSnapshot[] = [];
  private activeBots = 0;
  private activeMatches = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private serverUrl: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
  }

  start(intervalMs = 2000): void {
    this.intervalId = setInterval(() => this.takeSnapshot(), intervalMs);
  }

  stop(): void {
    if (this.intervalId) { clearInterval(this.intervalId); this.intervalId = null; }
  }

  recordWsSent(): void { this.wsMessagesSent++; }
  recordWsReceived(): void { this.wsMessagesReceived++; }
  recordHttpRequest(): void { this.httpRequestsMade++; }
  recordLatency(ms: number): void { this.latencies.push(ms); }
  recordError(type: string): void {
    this.errorsTotal++;
    this.errorsByType[type] = (this.errorsByType[type] || 0) + 1;
  }
  setActiveBots(n: number): void { this.activeBots = n; }
  setActiveMatches(n: number): void { this.activeMatches = n; }

  private async takeSnapshot(): Promise<void> {
    let serverMemoryMB: number | undefined;
    let serverUptime: number | undefined;
    try {
      const res = await fetch(`${this.serverUrl}/api/test/health`);
      if (res.ok) {
        const data = await res.json() as any;
        serverMemoryMB = data.memoryMB;
        serverUptime = data.uptime;
      }
    } catch {}

    this.snapshots.push({
      timestamp: Date.now(),
      activeBots: this.activeBots,
      activeMatches: this.activeMatches,
      wsMessagesSent: this.wsMessagesSent,
      wsMessagesReceived: this.wsMessagesReceived,
      httpRequestsMade: this.httpRequestsMade,
      errorsTotal: this.errorsTotal,
      errorsByType: { ...this.errorsByType },
      latencies: [...this.latencies],
      serverMemoryMB,
      serverUptime,
    });
    this.latencies = [];
  }

  getSnapshots(): MetricsSnapshot[] { return this.snapshots; }

  getSummary() {
    const all = this.snapshots.flatMap(s => s.latencies).sort((a, b) => a - b);
    const p = (pct: number) => all[Math.floor(all.length * pct)] || 0;
    return {
      totalWsMessages: this.wsMessagesSent + this.wsMessagesReceived,
      totalHttpRequests: this.httpRequestsMade,
      totalErrors: this.errorsTotal,
      errorBreakdown: { ...this.errorsByType },
      latencyP50: p(0.5),
      latencyP95: p(0.95),
      latencyP99: p(0.99),
      peakMemoryMB: Math.max(0, ...this.snapshots.map(s => s.serverMemoryMB || 0)),
    };
  }

  reset(): void {
    this.wsMessagesSent = 0; this.wsMessagesReceived = 0;
    this.httpRequestsMade = 0; this.errorsTotal = 0;
    this.errorsByType = {}; this.latencies = [];
    this.snapshots = []; this.activeBots = 0; this.activeMatches = 0;
  }
}
