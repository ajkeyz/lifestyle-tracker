/**
 * Bot behavior profiles for Survival Mode testing.
 */

import type { BotProfileType } from "./config";

export interface BotBehavior {
  accuracy: number;
  latencyRange: [number, number];
  disconnectProbability: number;
  reconnectWindow: [number, number];
  doubleSubmit: boolean;
  lateJoin: boolean;
  duplicateConnection: boolean;
  canHost: boolean;
}

const PROFILES: Record<BotProfileType, BotBehavior> = {
  PERFECT: {
    accuracy: 1.0, latencyRange: [50, 200], disconnectProbability: 0,
    reconnectWindow: [0, 0], doubleSubmit: false, lateJoin: false,
    duplicateConnection: false, canHost: true,
  },
  RANDOM: {
    accuracy: 0.5, latencyRange: [100, 2000], disconnectProbability: 0,
    reconnectWindow: [0, 0], doubleSubmit: false, lateJoin: false,
    duplicateConnection: false, canHost: true,
  },
  SLOW: {
    accuracy: 0.7, latencyRange: [0, 0], disconnectProbability: 0,
    reconnectWindow: [0, 0], doubleSubmit: false, lateJoin: false,
    duplicateConnection: false, canHost: true,
  },
  CHAOS: {
    accuracy: 0.5, latencyRange: [200, 1000], disconnectProbability: 0.3,
    reconnectWindow: [5000, 30000], doubleSubmit: false, lateJoin: false,
    duplicateConnection: false, canHost: false,
  },
  DOUBLE_SUBMIT: {
    accuracy: 0.8, latencyRange: [100, 500], disconnectProbability: 0,
    reconnectWindow: [0, 0], doubleSubmit: true, lateJoin: false,
    duplicateConnection: false, canHost: false,
  },
  LATE_JOIN: {
    accuracy: 0.5, latencyRange: [200, 800], disconnectProbability: 0,
    reconnectWindow: [0, 0], doubleSubmit: false, lateJoin: true,
    duplicateConnection: false, canHost: false,
  },
  DUP_CONN: {
    accuracy: 0.6, latencyRange: [100, 500], disconnectProbability: 0,
    reconnectWindow: [0, 0], doubleSubmit: false, lateJoin: false,
    duplicateConnection: true, canHost: false,
  },
};

export function resolveBehavior(
  profile: BotProfileType,
  overrides?: {
    accuracy?: number;
    latencyRange?: [number, number];
    disconnectProbability?: number;
    reconnectWindow?: [number, number];
  },
): BotBehavior {
  const base = { ...PROFILES[profile] };
  if (overrides?.accuracy !== undefined) base.accuracy = overrides.accuracy;
  if (overrides?.latencyRange) base.latencyRange = overrides.latencyRange;
  if (overrides?.disconnectProbability !== undefined) base.disconnectProbability = overrides.disconnectProbability;
  if (overrides?.reconnectWindow) base.reconnectWindow = overrides.reconnectWindow;
  return base;
}

export class SeededRandom {
  private s0: number;
  private s1: number;

  constructor(seed: number) {
    this.s0 = seed | 0 || 1;
    this.s1 = ((seed * 1103515245 + 12345) | 0) || 1;
  }

  next(): number {
    let s1 = this.s0;
    const s0 = this.s1;
    this.s0 = s0;
    s1 ^= s1 << 23;
    s1 ^= s1 >> 17;
    s1 ^= s0;
    s1 ^= s0 >> 26;
    this.s1 = s1;
    return ((this.s0 + this.s1) >>> 0) / 4294967296;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  chance(p: number): boolean { return this.next() < p; }
  pick<T>(arr: T[]): T { return arr[this.int(0, arr.length - 1)]; }
}
