import { useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import {
  computeUnlocks,
  computeLevel,
  selectMissions,
  getNextUnlock,
  buildMissionContext,
  MISSION_POOL,
  type UnlockState,
  type MissionDef,
  type MissionContext,
  type GameModeId,
  type LevelInfo,
} from "@shared/lib/progression";

function daysSinceUTC(isoDate: string): number {
  const created = new Date(isoDate);
  const now = new Date();
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

export function useProgression() {
  const queryClient = useQueryClient();
  const { data: user } = useQuery<User>({ queryKey: ["/api/user"] });

  const unlocks: UnlockState = useMemo(() => {
    if (!user) {
      return computeUnlocks({
        createdAt: new Date().toISOString(),
        gamesPlayed: 0,
        membershipTier: "free",
      });
    }
    return computeUnlocks({
      createdAt: user.createdAt,
      gamesPlayed: user.gamesPlayed,
      membershipTier: user.membershipTier,
    });
  }, [user?.createdAt, user?.gamesPlayed, user?.membershipTier]);

  const nextUnlock = useMemo(() => getNextUnlock(unlocks), [unlocks]);

  const levelInfo: LevelInfo = useMemo(
    () => computeLevel(user?.totalScore ?? 0),
    [user?.totalScore]
  );

  const accountAgeDays = useMemo(
    () => (user ? daysSinceUTC(user.createdAt) : 0),
    [user?.createdAt]
  );

  // Build mission context from user data (shared logic with server)
  const missionContext: MissionContext = useMemo(
    () => (user ? buildMissionContext(user) : buildMissionContext({})),
    [user]
  );

  // Use server-authoritative claimed missions
  const completedMissionIds = useMemo(
    () => user?.claimedMissions ?? [],
    [user?.claimedMissions]
  );

  const activeMissions: MissionDef[] = useMemo(
    () => selectMissions(unlocks, completedMissionIds, 3, accountAgeDays, missionContext),
    [unlocks, completedMissionIds, accountAgeDays, missionContext]
  );

  const completeMission = useCallback(
    async (missionId: string) => {
      if (completedMissionIds.includes(missionId)) return;

      // Optimistic update — add to local user cache immediately
      queryClient.setQueryData<User>(["/api/user"], (old) => {
        if (!old) return old;
        return {
          ...old,
          claimedMissions: [...(old.claimedMissions || []), missionId],
        };
      });

      // Call server to credit the actual reward (server re-validates conditions)
      try {
        const res = await fetch("/api/missions/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ missionId }),
        });
        if (res.ok) {
          const data = await res.json();
          // Sync full user state from server (has updated totalScore, freezeTokens, etc.)
          if (data.user) {
            queryClient.setQueryData(["/api/user"], data.user);
          }
        } else {
          // Server rejected (conditions not met) — revert optimistic update
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        }
      } catch {
        // Network error — revert optimistic update
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }
    },
    [completedMissionIds, queryClient]
  );

  const isModeUnlocked = useCallback(
    (mode: GameModeId): boolean => {
      return unlocks[mode]?.unlocked ?? false;
    },
    [unlocks]
  );

  /** Look up reward details for a given mission ID */
  const getMissionReward = useCallback((missionId: string) => {
    const mission = MISSION_POOL.find((m) => m.id === missionId);
    return mission?.reward ?? null;
  }, []);

  return {
    user,
    unlocks,
    nextUnlock,
    levelInfo,
    accountAgeDays,
    missionContext,
    activeMissions,
    completedMissionIds,
    completeMission,
    isModeUnlocked,
    getMissionReward,
  };
}
