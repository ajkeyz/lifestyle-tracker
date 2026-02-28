import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { AppLogo } from "@/components/app-logo";
import { AmbientBackground } from "@/components/ambient-background";
import { ModeCard } from "@/components/mode-card";
import { Mascot, getMascotContextDialogue, type MascotContext } from "@/components/mascot";
import { useProgression } from "@/hooks/use-progression";
import { toast } from "@/hooks/use-toast";
import {
  Play,
  Gamepad2,
  Swords,
  Shield,
  FlaskConical,
  Settings,
  ChevronRight,
  CheckCircle2,
  Flame,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { GameModeId } from "@shared/lib/progression";

export default function PlayHub() {
  const [, navigate] = useLocation();
  const { user: authUser } = useAuth();
  const { unlocks, user } = useProgression();

  const handleModeClick = (mode: GameModeId, path: string) => {
    if (!unlocks[mode].unlocked) {
      toast({
        title: "Mode locked",
        description: unlocks[mode].condition || "Keep playing to unlock!",
      });
      return;
    }
    navigate(path);
  };

  const hasPlayedToday = user?.todayResult != null;
  const dailyDropPath = hasPlayedToday
    ? "/results"
    : user?.mode
      ? "/play"
      : "/setup";

  const gridModes = [
    {
      id: "arcade" as GameModeId,
      title: "Arcade",
      description: "Speed rounds & bonuses",
      icon: <Gamepad2 className="w-5 h-5 text-white" />,
      gradient: "bg-gradient-to-br from-purple-500 to-pink-500",
      path: "/arcade",
    },
    {
      id: "coop" as GameModeId,
      title: "Co-op",
      description: "Play with a friend",
      icon: <Swords className="w-5 h-5 text-white" />,
      gradient: "bg-gradient-to-br from-indigo-500 to-purple-500",
      path: "/coop-lobby",
    },
    {
      id: "survival" as GameModeId,
      title: "Survival",
      description: "Last one standing",
      icon: <Shield className="w-5 h-5 text-white" />,
      gradient: "bg-gradient-to-br from-red-500 to-orange-500",
      path: "/survival",
    },
    {
      id: "simLab" as GameModeId,
      title: "Sim Lab",
      description: "Deep simulations",
      icon: <FlaskConical className="w-5 h-5 text-white" />,
      gradient: "bg-gradient-to-br from-cyan-500 to-blue-600",
      path: "/simlab",
      badge: "PRO",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 relative overflow-x-clip">
      <AmbientBackground variant="default" />

      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
        <div className="flex items-center gap-2.5 min-h-[40px]">
          <AppLogo size="sm" />
          <span
            className="font-display font-extrabold text-[15px] leading-none tracking-[-0.04em] text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.15)]"
            style={{ fontFeatureSettings: '"ss01", "ss02"' }}
          >
            Play
          </span>
        </div>
        {authUser && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => navigate("/settings")}
            aria-label="Open settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        )}
      </header>

      <main className="container max-w-2xl mx-auto px-4 pt-4 pb-6 space-y-4">
        {/* ── Featured: Daily Drop ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card
            className={cn(
              "relative overflow-hidden rounded-2xl cursor-pointer hover-elevate border border-transparent hover:border-primary/20 transition-all duration-200",
              hasPlayedToday && "border-emerald-500/20"
            )}
            onClick={() => navigate(dailyDropPath)}
            data-testid="mode-card-daily-drop"
          >
            {/* Gradient accent bar */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-primary to-emerald-600 rounded-t-2xl" />

            <div className="p-4 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
                {hasPlayedToday ? (
                  <CheckCircle2 className="w-5.5 h-5.5 text-white" />
                ) : (
                  <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[15px]">Daily Drop</h3>
                  {hasPlayedToday && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400">
                      Done
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {hasPlayedToday
                    ? "View your results & insights"
                    : "5 real-life money decisions · 2-4 min"}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>

            {/* Streak indicator when active */}
            {(user?.streak ?? 0) > 0 && (
              <div className="px-4 pb-3 pt-0">
                <div className="flex items-center gap-1.5 text-[11px] text-amber-400/80">
                  <Flame className="w-3 h-3" />
                  <span>{user?.streak} day streak</span>
                </div>
              </div>
            )}

            {/* Replay option */}
            {hasPlayedToday && (
              <div className="px-4 pb-3 pt-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-2 text-xs h-8 text-muted-foreground hover:text-foreground"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      const res = await fetch("/api/daily-drop/replay", { method: "POST" });
                      if (res.ok) {
                        const { queryClient } = await import("@/lib/queryClient");
                        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
                        navigate("/play");
                      }
                    } catch {}
                  }}
                  data-testid="button-replay-hub"
                >
                  <RefreshCw className="w-3 h-3" />
                  Replay Today's Drop
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* ── Section label ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="flex items-center gap-2 pt-1"
        >
          <p className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] px-0.5">
            Game Modes
          </p>
          <div className="flex-1 h-px bg-border/40" />
        </motion.div>

        {/* ── Cleo ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="flex justify-center"
        >
          <Mascot
            mood="hyped"
            size="sm"
            showBubble={true}
            context={{ screen: "play-hub", username: user?.username, streak: user?.streak ?? 0 } as MascotContext}
          />
        </motion.div>

        {/* ── Mode List ── */}
        <div className="space-y-2">
          {gridModes.map((mode, i) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.05, duration: 0.3 }}
            >
              <ModeCard
                title={mode.title}
                description={mode.description}
                icon={mode.icon}
                gradient={mode.gradient}
                unlock={unlocks[mode.id]}
                onClick={() => handleModeClick(mode.id, mode.path)}
                badge={mode.badge}
              />
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
