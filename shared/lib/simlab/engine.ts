/**
 * Sim Lab — Simulation Engine Core
 *
 * Deterministic, extensible simulation engine.
 * All templates implement SimTemplate and produce SimulationResult.
 * Uses seeded RNG (mulberry32) for reproducible runs.
 */

// ─── Seeded RNG ──────────────────────────────────────────────────────────────

/** mulberry32 — fast 32-bit seeded PRNG. Same seed always produces same sequence. */
export function createRNG(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash a string to a numeric seed for the RNG. */
export function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

// ─── Core Types ──────────────────────────────────────────────────────────────

export type TemplateId = "buy_a_house" | "rsu_liquidation" | "startup_equity" | "fire_planner";

export interface TimelinePoint {
  month: number;
  label: string; // e.g. "Month 1", "Year 2"
  /** Key metrics at this point */
  metrics: Record<string, number>;
}

export interface SimEvent {
  month: number;
  type: "info" | "warning" | "positive" | "negative" | "decision";
  title: string;
  description: string;
  impact?: Record<string, number>;
}

export interface DecisionCheckpoint {
  month: number;
  id: string;
  prompt: string;
  options: {
    id: string;
    label: string;
    description: string;
    impact: Record<string, number>;
  }[];
  /** The option chosen during this run. Null if auto-selected. */
  chosenOptionId: string | null;
}

export interface RiskMeter {
  id: string;
  label: string;
  value: number; // 0-100
  level: "low" | "medium" | "high" | "critical";
  description: string;
}

export interface SummaryMetric {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  trend?: "up" | "down" | "neutral";
  description?: string;
}

export interface SimulationResult {
  templateId: TemplateId;
  templateVersion: string;
  seed: number;
  runId: string;
  timeline: TimelinePoint[];
  events: SimEvent[];
  decisions: DecisionCheckpoint[];
  risks: RiskMeter[];
  summary: SummaryMetric[];
  /** Duration of simulation in months */
  durationMonths: number;
  /** Computed at run time */
  computedAt: string;
}

export interface SimTemplateInfo {
  id: TemplateId;
  title: string;
  description: string;
  icon: string; // lucide icon name
  category: string;
  estimatedTime: string;
  version: string;
  inputDefaults: Record<string, unknown>;
}

export interface SimTemplate<TInput = Record<string, unknown>> {
  info: SimTemplateInfo;
  /** Validate inputs, return error messages keyed by field */
  validate(input: TInput): Record<string, string>;
  /** Run the simulation deterministically */
  run(input: TInput, seed: number, decisions?: Record<string, string>): SimulationResult;
}

// ─── Template Registry ───────────────────────────────────────────────────────

const templateRegistry = new Map<TemplateId, SimTemplate>();

export function registerTemplate(template: SimTemplate): void {
  templateRegistry.set(template.info.id, template);
}

export function getTemplate(id: TemplateId): SimTemplate | undefined {
  return templateRegistry.get(id);
}

export function getAllTemplates(): SimTemplateInfo[] {
  return Array.from(templateRegistry.values()).map((t) => t.info);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatCurrency(val: number): string {
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

export function riskLevel(value: number): "low" | "medium" | "high" | "critical" {
  if (value >= 75) return "critical";
  if (value >= 50) return "high";
  if (value >= 25) return "medium";
  return "low";
}

export function generateRunId(): string {
  return `sim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
