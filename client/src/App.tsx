import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { PageTransition } from "@/components/page-transition";
import { useAuth } from "@/hooks/use-auth";
import { analytics, trackAppOpened } from "@/lib/analytics";
import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { AppLogo } from "@/components/app-logo";
import { ErrorBoundary } from "@/components/error-boundary";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { useAchievementToast } from "@/hooks/use-achievement-toast";
import { BottomNav, SafeAreaSpacer } from "@/components/bottom-nav";
import { StreakRitualOverlay } from "@/components/streak-ritual-overlay";
import { AchievementOverlayProvider } from "@/components/achievement-overlay-provider";

import { useProgression } from "@/hooks/use-progression";
import { toast } from "@/hooks/use-toast";
import { computeUnlocks } from "@shared/lib/progression";
import type { User as UserType } from "@shared/schema";

// Eager load critical pages (auth flow + core game)
import Home from "@/pages/home";
import AuthPage from "@/pages/auth";
import Game from "@/pages/game";
import Results from "@/pages/results";

// Lazy load all other pages for better initial bundle size
const PlayHub = lazy(() => import("@/pages/play-hub"));
const ProfileSetup = lazy(() => import("@/pages/profile-setup"));
const NotificationsSetup = lazy(() => import("@/pages/notifications-setup"));
const FriendsSetup = lazy(() => import("@/pages/friends-setup"));
const Setup = lazy(() => import("@/pages/setup"));
const Leaderboard = lazy(() => import("@/pages/leaderboard"));
const Leagues = lazy(() => import("@/pages/leagues"));
const Challenges = lazy(() => import("@/pages/challenges"));
const SharePage = lazy(() => import("@/pages/share"));
const Achievements = lazy(() => import("@/pages/achievements"));
const DeepDive = lazy(() => import("@/pages/deep-dive"));
const WeeklyRecap = lazy(() => import("@/pages/weekly-recap"));
const Settings = lazy(() => import("@/pages/settings"));
const Stats = lazy(() => import("@/pages/stats"));
const Insights = lazy(() => import("@/pages/insights"));
const Help = lazy(() => import("@/pages/help"));
const NotificationsPrefs = lazy(() => import("@/pages/notifications-prefs"));
const StreakInsurance = lazy(() => import("@/pages/streak-insurance"));
const Membership = lazy(() => import("@/pages/membership"));
const Community = lazy(() => import("@/pages/community"));
const CommunityDetail = lazy(() => import("@/pages/community-detail"));
const CommunitySubmit = lazy(() => import("@/pages/community-submit"));
const TipsLibrary = lazy(() => import("@/pages/tips-library"));
const Admin = lazy(() => import("@/pages/admin"));
const AdminScenarioBuilder = lazy(() => import("@/pages/admin-scenario-builder"));
const Profile = lazy(() => import("@/pages/profile"));
const Friends = lazy(() => import("@/pages/friends"));
const CoopLobby = lazy(() => import("@/pages/coop-lobby"));
const CoopGame = lazy(() => import("@/pages/coop-game"));
const CoopResults = lazy(() => import("@/pages/coop-results"));
const ArcadePage = lazy(() => import("@/pages/arcade"));
const ArcadeResults = lazy(() => import("@/pages/arcade-results"));
const SurvivalEntry = lazy(() => import("@/pages/survival-entry"));
const SurvivalLobby = lazy(() => import("@/pages/survival-lobby"));
const SurvivalMatch = lazy(() => import("@/pages/survival-match"));
const SurvivalResults = lazy(() => import("@/pages/survival-results"));
const SimLabEntry = lazy(() => import("@/pages/simlab-entry"));
const SimLabSetup = lazy(() => import("@/pages/simlab-setup"));
const SimLabResults = lazy(() => import("@/pages/simlab-results"));
const Social = lazy(() => import("@/pages/social"));
const Terms = lazy(() => import("@/pages/terms"));
const Privacy = lazy(() => import("@/pages/privacy"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Loading fallback component
function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <AppLogo size="md" glow />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Route guard: redirects to Play Hub (or Home) with a toast
 * when user accesses a locked game mode directly.
 */
function GuardedRoute({
  mode,
  component: Component,
}: {
  mode: "arcade" | "coop" | "survival" | "simLab";
  component: React.ComponentType<any>;
}) {
  const [, navigate] = useLocation();
  const { data: user } = useQuery<UserType>({ queryKey: ["/api/user"] });

  if (!user) return <RouteLoadingFallback />;

  const unlocks = computeUnlocks({
    createdAt: user.createdAt,
    gamesPlayed: user.gamesPlayed,
    membershipTier: user.membershipTier,
  });

  if (!unlocks[mode].unlocked) {
    // If play hub itself is locked (pre-first-drop), send to Home
    const target = unlocks.playHub.unlocked ? "/play-hub" : "/";
    // Use setTimeout to toast after navigation
    setTimeout(() => {
      toast({
        title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} is locked`,
        description: unlocks[mode].condition || "Keep playing to unlock this mode!",
      });
    }, 100);
    navigate(target, { replace: true });
    return null;
  }

  return <Component />;
}

/** Guard for Play Hub — redirect to Home if first drop not completed */
function PlayHubGuard() {
  const [, navigate] = useLocation();
  const { data: user } = useQuery<UserType>({ queryKey: ["/api/user"] });

  if (!user) return <RouteLoadingFallback />;

  const unlocks = computeUnlocks({
    createdAt: user.createdAt,
    gamesPlayed: user.gamesPlayed,
    membershipTier: user.membershipTier,
  });

  if (!unlocks.playHub.unlocked) {
    setTimeout(() => {
      toast({
        title: "Complete your first Drop",
        description: "Play your first Daily Drop to unlock the Play hub!",
      });
    }, 100);
    navigate("/", { replace: true });
    return null;
  }

  return <PlayHub />;
}

function AuthenticatedRouter() {
  // Monitor for badge unlocks and show celebratory toasts
  useAchievementToast();
  const [location] = useLocation();

  // Hide bottom nav on immersive pages and setup flows
  const hideBottomNav =
    location === "/play" ||
    ["/results", "/coop-game", "/arcade", "/survival", "/simlab", "/setup", "/profile-setup", "/notifications-setup", "/friends-setup"].some((path) =>
      location.startsWith(path)
    );

  return (
    <>
      <PageTransition>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/play-hub" component={PlayHubGuard} />
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
            <Route path="/social" component={Social} />
            <Route path="/profile" component={Profile} />
            <Route path="/profile/:userId" component={Profile} />
            <Route path="/friends" component={Friends} />
            <Route path="/coop-lobby">
              {() => <GuardedRoute mode="coop" component={CoopLobby} />}
            </Route>
            <Route path="/coop-game/:sessionId" component={CoopGame} />
            <Route path="/coop-results/:sessionId" component={CoopResults} />
            <Route path="/arcade">
              {() => <GuardedRoute mode="arcade" component={ArcadePage} />}
            </Route>
            <Route path="/arcade-results" component={ArcadeResults} />
            <Route path="/survival">
              {() => <GuardedRoute mode="survival" component={SurvivalEntry} />}
            </Route>
            <Route path="/survival/lobby/:matchId" component={SurvivalLobby} />
            <Route path="/survival/match/:matchId" component={SurvivalMatch} />
            <Route path="/survival/results/:matchId" component={SurvivalResults} />
            <Route path="/simlab">
              {() => <GuardedRoute mode="simLab" component={SimLabEntry} />}
            </Route>
            <Route path="/simlab/setup/:templateId" component={SimLabSetup} />
            <Route path="/simlab/results/:runId" component={SimLabResults} />
            <Route path="/terms" component={Terms} />
            <Route path="/privacy" component={Privacy} />
            <Route component={NotFound} />
          </Switch>
          {!hideBottomNav && <SafeAreaSpacer />}
        </Suspense>
      </PageTransition>
      {!hideBottomNav && <BottomNav />}
    </>
  );
}

function UnauthenticatedRouter() {
  return (
    <PageTransition>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Switch>
          <Route path="/" component={AuthPage} />
          <Route path="/terms" component={Terms} />
          <Route path="/privacy" component={Privacy} />
          <Route component={AuthPage} />
        </Switch>
      </Suspense>
    </PageTransition>
  );
}

function SplashScreen({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    // Fallback in case AnimatePresence doesn't complete
    const fallbackTimer = setTimeout(onComplete, 2500);
    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
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
          <h1 className="text-2xl font-semibold tracking-[-0.02em]" data-testid="text-splash-title">
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
  const [showStreakRitual, setShowStreakRitual] = useState(false);
  const streakRitualShown = useRef(false);
  const splashDone = !showSplash;

  // Fetch game user data for streak info (only when authenticated)
  const { data: gameUser } = useQuery<{ streak?: number }>({
    queryKey: ["/api/user"],
    enabled: isAuthenticated,
  });

  // Force complete splash after max time to prevent stuck screens
  useEffect(() => {
    const maxWaitTimer = setTimeout(() => {
      if (showSplash) {
        setShowSplash(false);
      }
    }, 3000);
    return () => clearTimeout(maxWaitTimer);
  }, [showSplash]);

  // Trigger streak ritual ONCE after splash completes if user has an active streak
  useEffect(() => {
    if (
      !streakRitualShown.current &&
      splashDone &&
      !isLoading &&
      isAuthenticated &&
      gameUser &&
      (gameUser.streak ?? 0) > 0
    ) {
      streakRitualShown.current = true;
      setShowStreakRitual(true);
    }
  }, [splashDone, isLoading, isAuthenticated, gameUser]);

  if (isLoading && !splashDone) {
    return (
      <AnimatePresence mode="wait">
        <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
      </AnimatePresence>
    );
  }

  if (isLoading && splashDone) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AppLogo size="md" glow />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showStreakRitual && (
          <StreakRitualOverlay
            key="streak-ritual"
            streak={gameUser?.streak ?? 0}
            onComplete={() => setShowStreakRitual(false)}
          />
        )}
      </AnimatePresence>
      {isAuthenticated ? <AuthenticatedRouter /> : <UnauthenticatedRouter />}
    </>
  );
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <AchievementOverlayProvider>
              <Toaster />
              <OfflineIndicator />
              <AnalyticsTracker />
              <AppContent />
            </AchievementOverlayProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
