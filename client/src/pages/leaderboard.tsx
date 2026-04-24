import { useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LeaderboardTabs } from "@/components/leaderboard-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppLogo } from "@/components/app-logo";
import { RankBadge, TierProgressBar } from "@/components/rank-badge";
import { ArrowLeft, Crown, Medal, Award, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { User, LeaderboardEntry } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return { name: "Spring", icon: "🌱" };
  if (month >= 5 && month <= 7) return { name: "Summer", icon: "☀️" };
  if (month >= 8 && month <= 10) return { name: "Autumn", icon: "🍂" };
  return { name: "Winter", icon: "❄️" };
}

export default function Leaderboard() {
  const [, navigate] = useLocation();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
  });

  const userRank = useMemo(() => {
    if (!leaderboard || !user) return -1;
    return leaderboard.findIndex((e) => e.id === user.id);
  }, [leaderboard, user]);

  const season = useMemo(() => getCurrentSeason(), []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
      <header className="flex items-center justify-between gap-2 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/social")}
            data-testid="button-back-social"
            aria-label="Back to Social"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <AppLogo size="sm" />
          <span className="font-bold" data-testid="text-leaderboards-header">Leaderboards</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="container max-w-4xl mx-auto p-4 space-y-6">
        {/* === YOUR RANK BANNER === */}
        {user && !isLoading && leaderboard && leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-4 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20" data-testid="card-your-rank">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center font-bold text-primary text-lg shrink-0">
                  {userRank >= 0 ? `#${userRank + 1}` : "—"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{user.username}</span>
                    <RankBadge moneyHealth={user.moneyHealth} size="md" />
                  </div>
                  <TierProgressBar moneyHealth={user.moneyHealth} className="mt-1.5" />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* === PODIUM HERO (Top 3) === */}
        {!isLoading && leaderboard && leaderboard.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-end justify-center gap-4 py-2"
            data-testid="podium-hero"
          >
            {/* 2nd Place */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col items-center gap-1.5"
            >
              <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[80px] text-center">
                {leaderboard[1].username}
              </span>
              <div className="w-11 h-11 rounded-full bg-slate-200/80 dark:bg-slate-700/50 border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center">
                <Medal className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="w-16 h-16 rounded-t-xl bg-slate-100/80 dark:bg-slate-800/40 border border-b-0 border-slate-200 dark:border-slate-700 flex items-end justify-center pb-1.5">
                <span className="text-2xl font-bold text-slate-500 dark:text-slate-400">2</span>
              </div>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col items-center gap-1.5"
            >
              <span className="text-[11px] font-semibold text-accent truncate max-w-[80px] text-center">
                {leaderboard[0].username}
              </span>
              <motion.div
                className="w-14 h-14 rounded-full bg-accent/20 border-2 border-accent flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Crown className="w-6 h-6 text-accent" />
              </motion.div>
              <div className="w-16 h-24 rounded-t-xl bg-accent/10 border border-b-0 border-accent/30 flex items-end justify-center pb-1.5">
                <span className="text-3xl font-bold text-accent">1</span>
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-1.5"
            >
              <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[80px] text-center">
                {leaderboard[2].username}
              </span>
              <div className="w-11 h-11 rounded-full bg-orange-100/80 dark:bg-orange-900/30 border-2 border-orange-300 dark:border-orange-700 flex items-center justify-center">
                <Award className="w-5 h-5 text-orange-500" />
              </div>
              <div className="w-16 h-12 rounded-t-xl bg-orange-50/80 dark:bg-orange-900/15 border border-b-0 border-orange-200 dark:border-orange-800 flex items-end justify-center pb-1.5">
                <span className="text-2xl font-bold text-orange-500">3</span>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* === TITLE + SUBTITLE === */}
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text" data-testid="text-leaderboards-title">
            Leaderboards
          </h1>
          <p className="text-muted-foreground" data-testid="text-leaderboards-subtitle">
            Compete with friends and climb the ranks
          </p>
        </div>

        {/* === CATEGORY GRID === */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : leaderboard && leaderboard.length > 0 ? (
          <LeaderboardTabs entries={leaderboard} currentUserId={user?.id} />
        ) : (
          <div className="text-center py-12" data-testid="empty-leaderboard">
            <p className="text-muted-foreground">No leaderboard data yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Play more games to see rankings!
            </p>
          </div>
        )}

        {/* === SEASON FOOTER === */}
        {!isLoading && leaderboard && leaderboard.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center py-6 border-t border-border/50"
          >
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {season.icon} {season.name} Season {new Date().getFullYear()}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/50 mt-1">
              Rankings reset each season
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
