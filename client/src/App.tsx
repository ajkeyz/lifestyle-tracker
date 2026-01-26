import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { PageTransition } from "@/components/page-transition";
import { useAuth } from "@/hooks/use-auth";
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
import Help from "@/pages/help";
import NotificationsPrefs from "@/pages/notifications-prefs";
import StreakInsurance from "@/pages/streak-insurance";
import Community from "@/pages/community";
import CommunityDetail from "@/pages/community-detail";
import CommunitySubmit from "@/pages/community-submit";
import TipsLibrary from "@/pages/tips-library";
import Admin from "@/pages/admin";
import AdminScenarioBuilder from "@/pages/admin-scenario-builder";
import Profile from "@/pages/profile";
import Friends from "@/pages/friends";
import NotFound from "@/pages/not-found";
import { Skeleton } from "@/components/ui/skeleton";
import { useAchievementToast } from "@/hooks/use-achievement-toast";

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
        <Route path="/help" component={Help} />
        <Route path="/notifications-prefs" component={NotificationsPrefs} />
        <Route path="/streak-insurance" component={StreakInsurance} />
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
        <Route component={AuthPage} />
      </Switch>
    </PageTransition>
  );
}

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="space-y-4 text-center">
          <Skeleton className="h-16 w-16 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return isAuthenticated ? <AuthenticatedRouter /> : <UnauthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
