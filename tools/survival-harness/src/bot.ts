import { EventEmitter } from "events";
import WebSocket from "ws";
import type { BotProfileType, MatchEvent, PlayerResult } from "./config";
import { resolveBehavior, SeededRandom, type BotBehavior } from "./profiles";

export class SurvivalBot extends EventEmitter {
  readonly id: string;
  readonly profile: BotProfileType;
  private behavior: BotBehavior;
  private rng: SeededRandom;
  private ws: WebSocket | null = null;
  private dupWs: WebSocket | null = null;
  private serverUrl: string;
  private wsUrl: string;
  matchId: string | null = null;
  private match: any = null;
  private events: MatchEvent[] = [];
  private myPlayer: any = null;
  private hasAnsweredThisRound = false;
  private isEliminated = false;
  connected = false;
  private answersSubmitted = 0;
  private correctAnswers = 0;
  private disconnectCount = 0;
  private reconnectCount = 0;
  private pendingTimers: NodeJS.Timeout[] = [];
  private completionPromise: { resolve: (r: PlayerResult) => void; reject: (e: Error) => void } | null = null;

  constructor(id: string, profile: BotProfileType, serverUrl: string, seed: number, overrides?: any) {
    super();
    this.id = id;
    this.profile = profile;
    this.serverUrl = serverUrl;
    // Convert http://host:port to ws://host:port/ws
    this.wsUrl = serverUrl.replace(/^http/, "ws") + "/ws";
    this.behavior = resolveBehavior(profile, overrides);
    this.rng = new SeededRandom(seed);
  }

  // --- Lifecycle ---

  async ensureUser(): Promise<void> {
    await this.httpPost("/api/test/ensure-user");
  }

  async createLobby(): Promise<{ matchId: string; code: string }> {
    const data = await this.httpPost("/api/survival/create", { isPrivate: true });
    this.matchId = data.matchId;
    return data;
  }

  async joinLobby(code: string): Promise<string> {
    const data = await this.httpPost(`/api/survival/join/${code}`);
    this.matchId = data.matchId;
    return data.matchId;
  }

  async joinQueue(): Promise<{ matchId?: string; position: number }> {
    const data = await this.httpPost("/api/survival/queue");
    if (data.matchId) this.matchId = data.matchId;
    return data;
  }

  async connect(matchId: string): Promise<void> {
    this.matchId = matchId;
    return new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl, { headers: { "x-test-user-id": this.id } });
      this.ws = ws;

      const timeout = setTimeout(() => { ws.close(); reject(new Error("WS connect timeout")); }, 10000);

      ws.on("open", () => {
        clearTimeout(timeout);
        this.connected = true;
        const joinMsg = { type: "survival_join", matchId };
        ws.send(JSON.stringify(joinMsg));
        this.recordEvent("sent", "survival_join", joinMsg);
        this.emit("connected");

        // DUP_CONN: open a second socket
        if (this.behavior.duplicateConnection) {
          this.openDuplicateConnection(matchId);
        }
        resolve();
      });

      ws.on("message", (raw: Buffer) => {
        this.onMessage(raw.toString());
      });

      ws.on("close", () => {
        this.connected = false;
        this.recordEvent("received", "ws_close", {});
        this.emit("disconnected");
      });

      ws.on("error", (err: Error) => {
        this.recordEvent("received", "ws_error", { message: err.message });
        this.emit("error", err);
      });
    });
  }

  async startGame(): Promise<void> {
    if (!this.ws || !this.matchId) return;
    const msg = { type: "survival_start", matchId: this.matchId };
    this.ws.send(JSON.stringify(msg));
    this.recordEvent("sent", "survival_start", msg);
  }

  waitForCompletion(timeoutMs = 3 * 60 * 1000): Promise<PlayerResult> {
    // If this bot never connected to WS, resolve immediately with current result
    if (!this.connected && !this.ws) {
      return Promise.resolve(this.getResult());
    }

    return new Promise<PlayerResult>((resolve, reject) => {
      this.completionPromise = { resolve, reject };
      // Safety timeout (default 3 minutes)
      const timer = setTimeout(() => {
        // On timeout, resolve with current result instead of rejecting
        // This prevents chaos/late-join bots from blocking the entire run
        this.completionPromise = null;
        resolve(this.getResult());
      }, timeoutMs);
      this.pendingTimers.push(timer);
    });
  }

  disconnect(): void {
    // Resolve any pending completion promise before clearing timers
    if (this.completionPromise) {
      this.completionPromise.resolve(this.getResult());
      this.completionPromise = null;
    }
    for (const t of this.pendingTimers) clearTimeout(t);
    this.pendingTimers = [];
    if (this.ws) { this.ws.close(); this.ws = null; }
    if (this.dupWs) { this.dupWs.close(); this.dupWs = null; }
    this.connected = false;
  }

  // --- Message Handling ---

  private onMessage(raw: string): void {
    let msg: any;
    try { msg = JSON.parse(raw); } catch { return; }
    this.recordEvent("received", msg.type, msg);
    this.emit("message", msg);

    switch (msg.type) {
      case "survival_state_sync": this.handleStateSync(msg.match); break;
      case "survival_player_joined": this.emit("player_joined", msg.player); break;
      case "survival_player_left": this.emit("player_left", msg.playerId); break;
      case "survival_countdown": this.emit("countdown", msg.seconds); break;
      case "survival_round_start": this.handleRoundStart(msg); break;
      case "survival_answer_ack": this.emit("answer_ack", msg.playerId); break;
      case "survival_round_result": this.handleRoundResult(msg); break;
      case "survival_match_end": this.handleMatchEnd(msg); break;
      case "survival_error": this.emit("server_error", msg.message); break;
    }
  }

  private handleStateSync(match: any): void {
    this.match = match;
    this.myPlayer = match?.players?.find((p: any) => p.id === this.id) || null;
    if (this.myPlayer?.eliminated) this.isEliminated = true;
    this.emit("state_sync", match);
  }

  private handleRoundStart(msg: any): void {
    this.hasAnsweredThisRound = false;
    if (this.match) {
      this.match.status = "question";
      this.match.round = msg.round;
      this.match.currentScenario = msg.scenario;
      this.match.timeLimit = msg.timeLimit;
      this.match.difficulty = msg.difficulty;
    }
    this.emit("round_start", msg);

    if (!this.isEliminated) {
      // CHAOS: maybe disconnect
      if (this.behavior.disconnectProbability > 0 && this.rng.chance(this.behavior.disconnectProbability)) {
        this.performChaosDisconnect();
        return;
      }
      // Submit answer after latency delay
      this.scheduleAnswer(msg.scenario, msg.timeLimit, msg.round);
    }
  }

  private handleRoundResult(msg: any): void {
    if (this.match) {
      this.match.status = "reveal";
      this.match.players = msg.players;
    }
    this.myPlayer = msg.players?.find((p: any) => p.id === this.id) || this.myPlayer;
    if (this.myPlayer?.eliminated) this.isEliminated = true;
    this.emit("round_result", msg);
  }

  private handleMatchEnd(msg: any): void {
    if (this.match) {
      this.match.status = "results";
      this.match.players = msg.players;
    }
    this.myPlayer = msg.players?.find((p: any) => p.id === this.id) || this.myPlayer;
    this.emit("match_end", msg);

    if (this.completionPromise) {
      this.completionPromise.resolve(this.getResult());
      this.completionPromise = null;
    }
  }

  // --- Answer Logic ---

  private scheduleAnswer(scenario: any, timeLimit: number, round: number): void {
    const delay = this.computeLatency(timeLimit);
    const timer = setTimeout(() => {
      this.submitAnswer(scenario, round);
    }, delay);
    this.pendingTimers.push(timer);
  }

  private submitAnswer(scenario: any, round: number): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || this.hasAnsweredThisRound) return;

    const shouldBeCorrect = this.rng.chance(this.behavior.accuracy);
    const choiceLabel = shouldBeCorrect
      ? this.findCorrectChoice(scenario)
      : this.findWrongChoice(scenario);

    const msg = { type: "survival_answer", matchId: this.matchId, round, choiceLabel };
    this.ws.send(JSON.stringify(msg));
    this.recordEvent("sent", "survival_answer", msg);
    this.hasAnsweredThisRound = true;
    this.answersSubmitted++;
    if (shouldBeCorrect) this.correctAnswers++;
    this.emit("answer_sent", { round, choiceLabel, correct: shouldBeCorrect });

    // DOUBLE_SUBMIT: send the same answer again after a short delay
    if (this.behavior.doubleSubmit) {
      const dupTimer = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(msg));
          this.recordEvent("sent", "survival_answer_duplicate", msg);
        }
      }, 50);
      this.pendingTimers.push(dupTimer);
    }
  }

  private findCorrectChoice(scenario: any): string {
    const correct = scenario?.choices?.find((c: any) => c.isCorrect);
    return correct?.label || "A";
  }

  private findWrongChoice(scenario: any): string {
    const wrong = scenario?.choices?.filter((c: any) => !c.isCorrect);
    if (!wrong || wrong.length === 0) return "A";
    return (this.rng.pick(wrong) as any).label;
  }

  private computeLatency(timeLimit: number): number {
    if (this.profile === "SLOW") {
      // Answer near the deadline
      return Math.max(100, timeLimit * 1000 - 200);
    }
    const [min, max] = this.behavior.latencyRange;
    return this.rng.int(min, max);
  }

  // --- Chaos ---

  private performChaosDisconnect(): void {
    this.disconnectCount++;
    this.recordEvent("sent", "chaos_disconnect", {});
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.connected = false;

    const [minReconnect, maxReconnect] = this.behavior.reconnectWindow;
    const delay = this.rng.int(minReconnect, maxReconnect);

    const timer = setTimeout(async () => {
      if (this.matchId) {
        try {
          await this.connect(this.matchId);
          this.reconnectCount++;
          this.recordEvent("sent", "chaos_reconnect", {});
        } catch (err: any) {
          this.recordEvent("received", "reconnect_failed", { error: err.message });
        }
      }
    }, delay);
    this.pendingTimers.push(timer);
  }

  private openDuplicateConnection(matchId: string): void {
    try {
      const ws2 = new WebSocket(this.wsUrl, { headers: { "x-test-user-id": this.id } });
      this.dupWs = ws2;
      ws2.on("open", () => {
        ws2.send(JSON.stringify({ type: "survival_join", matchId }));
        this.recordEvent("sent", "dup_conn_join", { matchId });
      });
      ws2.on("message", (raw: Buffer) => {
        this.recordEvent("received", "dup_conn_message", JSON.parse(raw.toString()));
      });
      ws2.on("error", () => {});
      ws2.on("close", () => {
        this.recordEvent("received", "dup_conn_close", {});
      });
    } catch {
      this.recordEvent("received", "dup_conn_failed", {});
    }
  }

  // --- Recording ---

  private recordEvent(direction: "sent" | "received", type: string, payload: any): void {
    this.events.push({
      timestamp: Date.now(),
      matchId: this.matchId || "",
      botId: this.id,
      direction,
      type,
      payload,
    });
  }

  getEvents(): MatchEvent[] { return this.events; }

  getResult(): PlayerResult {
    return {
      botId: this.id,
      profile: this.profile,
      placement: this.myPlayer
        ? (this.match?.players?.findIndex((p: any) => p.id === this.id) ?? -1) + 1
        : null,
      score: this.myPlayer?.score ?? 0,
      eliminated: this.myPlayer?.eliminated ?? false,
      eliminatedRound: this.myPlayer?.eliminatedRound ?? null,
      livesRemaining: this.myPlayer?.lives ?? 0,
      shieldUsed: this.myPlayer ? !this.myPlayer.shieldActive : false,
      answersSubmitted: this.answersSubmitted,
      correctAnswers: this.correctAnswers,
      disconnects: this.disconnectCount,
      reconnects: this.reconnectCount,
    };
  }

  // --- HTTP Helpers ---

  private async httpPost(path: string, body?: any): Promise<any> {
    this.emit("http_request", { method: "POST", path });
    const res = await fetch(`${this.serverUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-user-id": this.id,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status} on POST ${path}: ${text}`);
    }
    return res.json();
  }

  private async httpGet(path: string): Promise<any> {
    this.emit("http_request", { method: "GET", path });
    const res = await fetch(`${this.serverUrl}${path}`, {
      headers: { "x-test-user-id": this.id },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} on GET ${path}`);
    return res.json();
  }
}
