/**
 * Event Recorder — captures match events to JSON files for replay and debugging.
 */
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { MatchEvent, MatchRecording, MatchResult } from "./config";

export class EventRecorder {
  private events = new Map<string, MatchEvent[]>();
  private startTimes = new Map<string, number>();
  private seeds = new Map<string, number>();
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
    mkdirSync(outputDir, { recursive: true });
  }

  startMatch(matchId: string, seed: number): void {
    this.events.set(matchId, []);
    this.startTimes.set(matchId, Date.now());
    this.seeds.set(matchId, seed);
  }

  addEvent(event: MatchEvent): void {
    this.events.get(event.matchId)?.push(event);
  }

  addBotEvents(matchId: string, botEvents: MatchEvent[]): void {
    const arr = this.events.get(matchId);
    if (arr) arr.push(...botEvents);
  }

  finalize(matchId: string, result: MatchResult): MatchRecording {
    const events = (this.events.get(matchId) || []).sort((a, b) => a.timestamp - b.timestamp);
    const recording: MatchRecording = {
      matchId,
      seed: this.seeds.get(matchId) || 0,
      startTime: this.startTimes.get(matchId) || 0,
      endTime: Date.now(),
      events,
      result,
    };
    const filename = `match-${matchId.slice(0, 8)}-${Date.now()}.json`;
    writeFileSync(join(this.outputDir, filename), JSON.stringify(recording, null, 2));
    this.events.delete(matchId);
    this.startTimes.delete(matchId);
    this.seeds.delete(matchId);
    return recording;
  }

  getEvents(matchId: string): MatchEvent[] {
    return this.events.get(matchId) || [];
  }
}
