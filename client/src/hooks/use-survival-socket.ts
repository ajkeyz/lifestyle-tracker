import { useState, useEffect, useRef, useCallback } from "react";
import type { SurvivalMatch, SurvivalMessage, SurvivalPlayer } from "@shared/schema";

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 2000;

export function useSurvivalSocket(matchId: string | null) {
  const [match, setMatch] = useState<SurvivalMatch | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<SurvivalMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const matchIdRef = useRef(matchId);
  matchIdRef.current = matchId;

  const connect = useCallback(() => {
    if (!matchIdRef.current) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      reconnectAttempts.current = 0;

      // Send join message
      ws.send(JSON.stringify({
        type: "survival_join",
        matchId: matchIdRef.current,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg: SurvivalMessage = JSON.parse(event.data);
        setLastMessage(msg);

        switch (msg.type) {
          case "survival_state_sync":
            setMatch(msg.match);
            break;

          case "survival_player_joined":
            setMatch(prev => {
              if (!prev) return prev;
              if (prev.players.some(p => p.id === msg.player.id)) return prev;
              return { ...prev, players: [...prev.players, msg.player] };
            });
            break;

          case "survival_player_left":
            setMatch(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                players: prev.players.map(p =>
                  p.id === msg.playerId ? { ...p, connected: false } : p
                ),
              };
            });
            break;

          case "survival_countdown":
            setMatch(prev => prev ? { ...prev, status: "countdown" } : prev);
            break;

          case "survival_round_start":
            setMatch(prev => prev ? {
              ...prev,
              status: "question",
              round: msg.round,
              currentScenario: msg.scenario,
              timeLimit: msg.timeLimit,
              difficulty: msg.difficulty,
              questionStartTime: Date.now(),
              roundAnswers: {},
              eliminatedThisRound: [],
            } : prev);
            break;

          case "survival_answer_ack":
            setMatch(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                roundAnswers: { ...prev.roundAnswers, [msg.playerId]: "answered" },
              };
            });
            break;

          case "survival_round_result":
            setMatch(prev => prev ? {
              ...prev,
              status: "reveal",
              players: msg.players,
              eliminatedThisRound: msg.eliminatedThisRound,
            } : prev);
            break;

          case "survival_match_end":
            setMatch(prev => prev ? {
              ...prev,
              status: "results",
              players: msg.players,
              completedAt: new Date().toISOString(),
            } : prev);
            break;

          case "survival_error":
            console.error("Survival error:", msg.message);
            break;
        }
      } catch (err) {
        console.error("Failed to parse survival message:", err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
      wsRef.current = null;

      // Reconnect if match is still active
      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS && matchIdRef.current) {
        reconnectAttempts.current++;
        setTimeout(connect, RECONNECT_DELAY * reconnectAttempts.current);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    if (matchId) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [matchId, connect]);

  const sendAnswer = useCallback((choiceLabel: string, round: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && matchId) {
      wsRef.current.send(JSON.stringify({
        type: "survival_answer",
        matchId,
        round,
        choiceLabel,
      }));
    }
  }, [matchId]);

  const startGame = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && matchId) {
      wsRef.current.send(JSON.stringify({
        type: "survival_start",
        matchId,
      }));
    }
  }, [matchId]);

  // Derived state
  const myPlayer: SurvivalPlayer | null = match?.players.find(p => {
    // We don't know our userId on the client directly, but the first state sync
    // will contain all players. We'll identify ourselves when the component provides userId.
    return false; // This is handled by the component
  }) ?? null;

  return {
    match,
    connected,
    lastMessage,
    sendAnswer,
    startGame,
  };
}
