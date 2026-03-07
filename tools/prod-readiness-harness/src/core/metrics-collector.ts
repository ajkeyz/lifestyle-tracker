/**
 * Generalized metrics collector for the production-readiness harness.
 *
 * Tracks latency samples (with percentile computation), error counts,
 * HTTP status-code distributions, per-endpoint timing breakdowns, and
 * server memory snapshots over time.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EndpointLatency {
  count: number;
  p50: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  avg: number;
}

export interface MetricsSummary {
  /** Global p50 latency across all endpoints (ms). */
  latencyP50: number;
  /** Global p95 latency across all endpoints (ms). */
  latencyP95: number;
  /** Global p99 latency across all endpoints (ms). */
  latencyP99: number;
  /** Total number of requests recorded. */
  totalRequests: number;
  /** Total number of errors recorded (any category). */
  totalErrors: number;
  /** Error rate as a fraction (0-1). */
  errorRate: number;
  /** Distribution of HTTP status codes. */
  statusCodes: Record<number, number>;
  /** Per-endpoint latency breakdowns. */
  endpointLatencies: Record<string, EndpointLatency>;
  /** Peak observed server heap (MB). */
  peakMemoryMB: number;
  /** All memory snapshots in order of collection. */
  memorySnapshots: number[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return the value at a given percentile from a *sorted* array. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

// ---------------------------------------------------------------------------
// MetricsCollector
// ---------------------------------------------------------------------------

export class MetricsCollector {
  /** All latency samples regardless of endpoint (ms). */
  private allLatencies: number[] = [];

  /** Latency samples bucketed by endpoint key. */
  private endpointSamples: Map<string, number[]> = new Map();

  /** Error counts keyed by arbitrary type string. */
  private errorCounts: Map<string, number> = new Map();

  /** HTTP status code distribution. */
  private statusCodeCounts: Map<number, number> = new Map();

  /** Ordered list of server memory heap snapshots (MB). */
  private _memorySnapshots: number[] = [];

  // -----------------------------------------------------------------------
  // Recording methods
  // -----------------------------------------------------------------------

  /**
   * Record a request latency for a given endpoint.
   * @param endpoint  Logical name, e.g. "GET /api/game/scenarios"
   * @param duration  Wall-clock time in milliseconds
   */
  recordLatency(endpoint: string, duration: number): void {
    this.allLatencies.push(duration);

    let bucket = this.endpointSamples.get(endpoint);
    if (!bucket) {
      bucket = [];
      this.endpointSamples.set(endpoint, bucket);
    }
    bucket.push(duration);
  }

  /**
   * Increment the error counter for a given error type.
   * @param type  Free-form label, e.g. "timeout", "500", "connection-refused"
   */
  recordError(type: string): void {
    this.errorCounts.set(type, (this.errorCounts.get(type) ?? 0) + 1);
  }

  /** Record an HTTP status code occurrence. */
  recordStatusCode(code: number): void {
    this.statusCodeCounts.set(code, (this.statusCodeCounts.get(code) ?? 0) + 1);
  }

  /** Append a server memory snapshot (heap size in MB). */
  addMemorySnapshot(mb: number): void {
    this._memorySnapshots.push(mb);
  }

  // -----------------------------------------------------------------------
  // Summaries
  // -----------------------------------------------------------------------

  /** Build a complete summary of all collected metrics. */
  getSummary(): MetricsSummary {
    const sorted = [...this.allLatencies].sort((a, b) => a - b);

    const totalRequests = this.allLatencies.length;
    const totalErrors = Array.from(this.errorCounts.values()).reduce(
      (sum, n) => sum + n,
      0,
    );

    // Status code map
    const statusCodes: Record<number, number> = {};
    for (const [code, count] of this.statusCodeCounts) {
      statusCodes[code] = count;
    }

    // Per-endpoint latencies
    const endpointLatencies: Record<string, EndpointLatency> = {};
    for (const [ep, samples] of this.endpointSamples) {
      const s = [...samples].sort((a, b) => a - b);
      const sum = s.reduce((acc, v) => acc + v, 0);
      endpointLatencies[ep] = {
        count: s.length,
        p50: percentile(s, 50),
        p95: percentile(s, 95),
        p99: percentile(s, 99),
        min: s[0] ?? 0,
        max: s[s.length - 1] ?? 0,
        avg: s.length > 0 ? Math.round(sum / s.length) : 0,
      };
    }

    const peakMemoryMB =
      this._memorySnapshots.length > 0
        ? Math.max(...this._memorySnapshots)
        : 0;

    return {
      latencyP50: percentile(sorted, 50),
      latencyP95: percentile(sorted, 95),
      latencyP99: percentile(sorted, 99),
      totalRequests,
      totalErrors,
      errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
      statusCodes,
      endpointLatencies,
      peakMemoryMB,
      memorySnapshots: [...this._memorySnapshots],
    };
  }

  /** Reset all accumulated data. */
  reset(): void {
    this.allLatencies = [];
    this.endpointSamples.clear();
    this.errorCounts.clear();
    this.statusCodeCounts.clear();
    this._memorySnapshots = [];
  }
}
