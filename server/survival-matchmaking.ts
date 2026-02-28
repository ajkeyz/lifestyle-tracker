import { SurvivalRoom, OnMatchEnd } from "./survival-room";
import type { SurvivalMessage } from "@shared/schema";

const QUEUE_THRESHOLD = 8;        // Create match when 8 players in queue
const QUEUE_MIN_START = 4;        // Auto-start with 4+ after timeout
const QUEUE_AUTO_START_MS = 30000; // 30s after 4th player joins → auto-match
const QUEUE_MAX_WAIT_MS = 60000;  // 60s max wait in queue alone
const ROOM_CLEANUP_DELAY = 5 * 60 * 1000; // 5min after match ends

interface QueueEntry {
  userId: string;
  username: string;
  avatar: string;
  joinedAt: number;
}

export class SurvivalMatchmaking {
  private queue: Map<string, QueueEntry> = new Map();
  private rooms: Map<string, SurvivalRoom> = new Map();
  private codeToRoom: Map<string, string> = new Map(); // code -> matchId
  private queueTimer: NodeJS.Timeout | null = null;
  private createBroadcast: (matchId: string) => (msg: SurvivalMessage) => void;
  private onMatchEnd: OnMatchEnd;

  constructor(
    createBroadcast: (matchId: string) => (msg: SurvivalMessage) => void,
    onMatchEnd: OnMatchEnd,
  ) {
    this.createBroadcast = createBroadcast;
    this.onMatchEnd = onMatchEnd;
  }

  // ---- Public Queue ----

  joinQueue(user: { id: string; username: string; avatar: string }): { matchId?: string; position: number } {
    // Already in queue?
    if (this.queue.has(user.id)) {
      const pos = Array.from(this.queue.keys()).indexOf(user.id) + 1;
      return { position: pos };
    }

    // Already in an active room?
    for (const [matchId, room] of this.rooms) {
      if (room.match.players.some(p => p.id === user.id) && room.match.status === "lobby") {
        return { matchId, position: 0 };
      }
    }

    this.queue.set(user.id, {
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      joinedAt: Date.now(),
    });

    // Check if we hit the threshold
    if (this.queue.size >= QUEUE_THRESHOLD) {
      const matchId = this.createMatchFromQueue(QUEUE_THRESHOLD);
      return { matchId, position: 0 };
    }

    // Start auto-match timer when we hit minimum
    if (this.queue.size >= QUEUE_MIN_START && !this.queueTimer) {
      this.queueTimer = setTimeout(() => {
        this.queueTimer = null;
        if (this.queue.size >= QUEUE_MIN_START) {
          this.createMatchFromQueue(this.queue.size);
        }
      }, QUEUE_AUTO_START_MS);
    }

    // Start solo timeout
    if (this.queue.size === 1) {
      setTimeout(() => {
        if (this.queue.has(user.id) && this.queue.size < QUEUE_MIN_START) {
          this.queue.delete(user.id);
          // Could notify via WS, but user will see "removed from queue" on next poll
        }
      }, QUEUE_MAX_WAIT_MS);
    }

    return { position: this.queue.size };
  }

  leaveQueue(userId: string): void {
    this.queue.delete(userId);
    if (this.queue.size < QUEUE_MIN_START && this.queueTimer) {
      clearTimeout(this.queueTimer);
      this.queueTimer = null;
    }
  }

  getQueueSize(): number {
    return this.queue.size;
  }

  private createMatchFromQueue(count: number): string {
    // Take the first `count` players from the queue
    const entries = Array.from(this.queue.entries()).slice(0, count);
    const hostEntry = entries[0][1];

    const room = this.createRoom(hostEntry.userId, false);
    const matchId = room.match.id;

    // Add host
    room.addPlayer({ id: hostEntry.userId, username: hostEntry.username, avatar: hostEntry.avatar });
    this.queue.delete(hostEntry.userId);

    // Add remaining players
    for (let i = 1; i < entries.length; i++) {
      const entry = entries[i][1];
      room.addPlayer({ id: entry.userId, username: entry.username, avatar: entry.avatar });
      this.queue.delete(entry.userId);
    }

    if (this.queueTimer) {
      clearTimeout(this.queueTimer);
      this.queueTimer = null;
    }

    return matchId;
  }

  // ---- Private Lobbies ----

  createPrivateLobby(user: { id: string; username: string; avatar: string }): { matchId: string; code: string } {
    const room = this.createRoom(user.id, true);
    room.addPlayer({ id: user.id, username: user.username, avatar: user.avatar });

    return { matchId: room.match.id, code: room.match.code };
  }

  joinByCode(code: string, user: { id: string; username: string; avatar: string }): { success: boolean; matchId?: string; error?: string } {
    const matchId = this.codeToRoom.get(code.toUpperCase());
    if (!matchId) {
      return { success: false, error: "Invalid code" };
    }

    const room = this.rooms.get(matchId);
    if (!room) {
      return { success: false, error: "Room not found" };
    }

    const result = room.addPlayer(user);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, matchId };
  }

  // ---- Room Management ----

  private createRoom(hostId: string, isPrivate: boolean): SurvivalRoom {
    const broadcast = this.createBroadcast("__placeholder__");
    const room = new SurvivalRoom(hostId, isPrivate, broadcast, this.onMatchEnd);
    const matchId = room.match.id;

    // Rewire broadcast with actual matchId
    const actualBroadcast = this.createBroadcast(matchId);
    // We need to set the broadcast function on the room
    (room as any).broadcast = actualBroadcast;

    this.rooms.set(matchId, room);
    this.codeToRoom.set(room.match.code, matchId);

    return room;
  }

  getRoom(matchId: string): SurvivalRoom | undefined {
    return this.rooms.get(matchId);
  }

  getRoomByCode(code: string): SurvivalRoom | undefined {
    const matchId = this.codeToRoom.get(code.toUpperCase());
    return matchId ? this.rooms.get(matchId) : undefined;
  }

  scheduleCleanup(matchId: string): void {
    setTimeout(() => {
      const room = this.rooms.get(matchId);
      if (room) {
        room.destroy();
        this.codeToRoom.delete(room.match.code);
        this.rooms.delete(matchId);
      }
    }, ROOM_CLEANUP_DELAY);
  }

  /** Get active room count (for monitoring) */
  getActiveRoomCount(): number {
    return this.rooms.size;
  }

  /** Clean up on shutdown */
  destroy(): void {
    if (this.queueTimer) {
      clearTimeout(this.queueTimer);
    }
    for (const room of this.rooms.values()) {
      room.destroy();
    }
    this.rooms.clear();
    this.codeToRoom.clear();
    this.queue.clear();
  }
}
