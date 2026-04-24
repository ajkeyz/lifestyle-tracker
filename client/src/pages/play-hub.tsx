import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { AppLogo } from "@/components/app-logo";
import { AmbientBackground } from "@/components/ambient-background";
import { ModeCard } from "@/components/mode-card";
import { useProgression } from "@/hooks/use-progression";
import { useTheme } from "@/hooks/use-theme";
import { toast } from "@/hooks/use-toast";
import {
  Play,
  Gamepad2,
  Users,
  Settings,
  Flame,
  Zap,
  Target,
  Star,
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
  const { currentDef: themeDef } = useTheme();

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
    : user?.weeklyTheme
      ? "/play"
      : "/setup";

  const themeLabel = themeDef?.label ?? "this week's theme";
  const gridModes = [
    {
      id: "arcade" as GameModeId,
      title: "Arcade",
      description: `Speed rounds · ${themeLabel}`,
      icon: <Gamepad2 className="w-5 h-5 text-white" />,
      gradient: "bg-gradient-to-br from-purple-500 to-pink-500",
      path: "/arcade",
    },
    {
      id: "coop" as GameModeId,
      title: "Co-op",
      description: "Play with a friend",
      icon: <Users className="w-5 h-5 text-white" />,
      gradient: "bg-gradient-to-br from-indigo-500 to-purple-500",
      path: "/coop-lobby",
    },
    // Survival and Sim Lab modes disabled — code preserved in repo
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
        {/* ── Quick Stats ── */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-3 gap-2"
          >
            {[
              { icon: Zap, label: "XP", value: user.totalScore, color: "text-yellow-400" },
              { icon: Flame, label: "Streak", value: `${user.streak}d`, color: user.streak >= 3 ? "text-orange-400" : "text-muted-foreground" },
              { icon: Target, label: "Games", value: Math.max(user.gamesPlayed, user.todayResult ? 1 : 0), color: "text-blue-400" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 p-2.5 rounded-xl bg-card/50 border border-border/50">
                <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                <span className="text-sm font-bold tabular-nums">{stat.value}</span>
                <span className="text-[10px] text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Game Modes ── */}
        <div className="space-y-2">
          {/* Daily Drop as first mode */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ModeCard
              title="Daily Drop"
              description={hasPlayedToday ? "View your results" : `5 decisions · ${themeLabel}`}
              icon={<Play className="w-5 h-5 text-white ml-0.5" />}
              gradient="bg-gradient-to-br from-primary to-emerald-600"
              unlock={{ unlocked: true, progress: 1 }}
              onClick={() => navigate(dailyDropPath)}
              badge={hasPlayedToday ? "Done" : undefined}
            />
          </motion.div>

          {gridModes.map((mode, i) => (
            <motion.div
              key={mode.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.05, duration: 0.3 }}
            >
              <ModeCard
                title={mode.title}
                description={mode.description}
                icon={mode.icon}
                gradient={mode.gradient}
                unlock={unlocks[mode.id]}
                onClick={() => handleModeClick(mode.id, mode.path)}
              />
            </motion.div>
          ))}
        </div>

        {/* ── Recent Scores ── */}
        {user?.gameHistory && user.gameHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em]">Recent Scores</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {user.gameHistory.slice(-3).reverse().map((game, i) => (
                  <Card key={i} className="p-2.5 text-center">
                    <p className="text-lg font-bold tabular-nums">{game.score}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(game.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
