import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { PageTransition } from "@/components/page-transition";
import { useAuth } from "@/hooks/use-auth";
import { analytics, trackAppOpened } from "@/lib/analytics";
import { useEffect } from "react";
import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import ProfileSetup from "@/pages/profile-setup";
import NotificationsSetup from "@/pages/notifications-setup";
import FriendsSetup from "@/pages/friends-setup";
import Setup from "@/pages/setup";
import Game from "@/pages/game";
import Results from "@/pages/results";
import Leaderboard from "@/pages/leaderboard";
import Leagues from "@/pages/leagues";
import Challenges from "@/pages/challenges";
import SharePage from "@/pages/share";
import Achievements from "@/pages/achievements";
import DeepDive from "@/pages/deep-dive";
import WeeklyRecap from "@/pages/weekly-recap";
import Settings from "@/pages/settings";
import Stats from "@/pages/stats";
import Insights from "@/pages/insights";
import Help from "@/pages/help";
import NotificationsPrefs from "@/pages/notifications-prefs";
import StreakInsurance from "@/pages/streak-insurance";
import Membership from "@/pages/membership";
import Community from "@/pages/community";
import CommunityDetail from "@/pages/community-detail";
import CommunitySubmit from "@/pages/community-submit";
import TipsLibrary from "@/pages/tips-library";
import Admin from "@/pages/admin";
import AdminScenarioBuilder from "@/pages/admin-scenario-builder";
import Profile from "@/pages/profile";
import Friends from "@/pages/friends";
import CoopLobby from "@/pages/coop-lobby";
import CoopGame from "@/pages/coop-game";
import CoopResults from "@/pages/coop-results";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import NotFound from "@/pages/not-found";
import { Skeleton } from "@/components/ui/skeleton";
import { useAchievementToast } from "@/hooks/use-achievement-toast";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLogo } from "@/components/app-logo";

function AuthenticatedRouter() {
  // Monitor for badge unlocks and show celebratory toasts
  useAchievementToast();
  return (
    <PageTransition>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/profile-setup" component={ProfileSetup} />
        <Route path="/notifications-setup" component={NotificationsSetup} />
        <Route path="/friends-setup" component={FriendsSetup} />
        <Route path="/setup" component={Setup} />
        <Route path="/play" component={Game} />
        <Route path="/results" component={Results} />
        <Route path="/leaderboard" component={Leaderboard} />
        <Route path="/leagues" component={Leagues} />
        <Route path="/challenges" component={Challenges} />
        <Route path="/share" component={SharePage} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/deep-dive" component={DeepDive} />
        <Route path="/weekly-recap" component={WeeklyRecap} />
        <Route path="/settings" component={Settings} />
        <Route path="/stats" component={Stats} />
        <Route path="/insights" component={Insights} />
        <Route path="/help" component={Help} />
        <Route path="/notifications-prefs" component={NotificationsPrefs} />
        <Route path="/streak-insurance" component={StreakInsurance} />
        <Route path="/membership" component={Membership} />
        <Route path="/community" component={Community} />
        <Route path="/community/submit" component={CommunitySubmit} />
        <Route path="/community/:id" component={CommunityDetail} />
        <Route path="/tips" component={TipsLibrary} />
        <Route path="/admin" component={Admin} />
        <Route path="/admin/scenario-builder" component={AdminScenarioBuilder} />
        <Route path="/admin/scenario-builder/:id" component={AdminScenarioBuilder} />
        <Route path="/profile" component={Profile} />
        <Route path="/profile/:userId" component={Profile} />
        <Route path="/friends" component={Friends} />
        <Route path="/coop-lobby" component={CoopLobby} />
        <Route path="/coop-game/:sessionId" component={CoopGame} />
        <Route path="/coop-results/:sessionId" component={CoopResults} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route component={NotFound} />
      </Switch>
    </PageTransition>
  );
}

function UnauthenticatedRouter() {
  return (
    <PageTransition>
      <Switch>
        <Route path="/" component={AuthPage} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route component={AuthPage} />
      </Switch>
    </PageTransition>
  );
}

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      data-testid="splash-screen"
    >
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl"
          animate={{ scale: [1, 1.3, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </div>

      <motion.div
        className="relative flex flex-col items-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
        >
          <AppLogo size="lg" glow />
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-splash-title">
            Lifestyle Creep
          </h1>
          <motion.p
            className="text-sm text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            data-testid="text-splash-subtitle"
          >
            Master your money, one decision at a time
          </motion.p>
        </motion.div>

        <motion.div
          className="flex gap-1.5 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-emerald-500"
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const splashDone = !showSplash;

  if (isLoading || !splashDone) {
    return (
      <AnimatePresence mode="wait" onExitComplete={() => {}}>
        <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
      </AnimatePresence>
    );
  }

  return isAuthenticated ? <AuthenticatedRouter /> : <UnauthenticatedRouter />;
}

function AnalyticsTracker() {
  const { user } = useAuth();

  useEffect(() => {
    trackAppOpened(user);

    if (user) {
      analytics.identify(user);
    }
  }, [user]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AnalyticsTracker />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
