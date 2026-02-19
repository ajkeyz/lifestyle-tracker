import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Shield, 
  Snowflake,
  RotateCcw,
  Clock,
  Sparkles,
  Crown,
  Lock,
  Check,
  Flame
} from "lucide-react";
import type { User } from "@shared/schema";

export default function StreakInsurance() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const togglePlus = useMutation({
    mutationFn: async (isPlus: boolean) => {
      return apiRequest("POST", "/api/toggle-plus", { isPlus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Status updated",
        description: "Your membership status has been updated",
      });
    },
  });

  const useFreeze = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/use-freeze");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Streak Freeze applied",
        description: "Your streak is protected for today!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cannot use freeze",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const useBuyback = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/streak-buyback");
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Streak restored!",
        description: `Your ${data.restoredStreak}-day streak is back!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cannot use buyback",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const useLatePass = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/late-pass");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Late Pass activated",
        description: "Play yesterday's drop now!",
      });
      navigate("/play");
    },
    onError: (error: Error) => {
      toast({
        title: "Cannot use Late Pass",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-purple-950/20 p-4">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const isPlus = user.streakInsurance.isPlus;
  const hasBuybackThisMonth = user.streakInsurance.lastBuybackDate && 
    user.streakInsurance.lastBuybackDate.slice(0, 7) === new Date().toISOString().slice(0, 7);
  const hasLostStreak = user.streakInsurance.lostStreak && user.streakInsurance.lostStreak > 0;
  const latePassAvailable = user.streakInsurance.latePassAvailable;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-purple-950/20">
      <header className="flex items-center gap-3 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/settings")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg" data-testid="text-page-title">Streak Insurance</h1>
        {isPlus && (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 ml-auto">
            <Crown className="w-3 h-3 mr-1" />
            Plus
          </Badge>
        )}
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-6">
        {!isPlus && (
          <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent" data-testid="card-upgrade-cta">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Upgrade to Plus</CardTitle>
                  <CardDescription>Protect your streaks like a pro</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center p-3 rounded-lg bg-background/50">
                  <Snowflake className="w-5 h-5 text-cyan-400 mb-1" />
                  <span className="text-xs text-center">3 Freeze Tokens</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-background/50">
                  <RotateCcw className="w-5 h-5 text-purple-400 mb-1" />
                  <span className="text-xs text-center">Monthly Buyback</span>
                </div>
                <div className="flex flex-col items-center p-3 rounded-lg bg-background/50">
                  <Clock className="w-5 h-5 text-blue-400 mb-1" />
                  <span className="text-xs text-center">Late Pass</span>
                </div>
              </div>
              <Button 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
                onClick={() => togglePlus.mutate(true)}
                disabled={togglePlus.isPending}
                data-testid="button-upgrade-plus"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Activate Plus (Demo)
              </Button>
            </CardContent>
          </Card>
        )}

        {isPlus && (
          <Card className="border-0 bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent" data-testid="card-plus-status">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Plus Member</p>
                  <p className="text-xs text-muted-foreground">All streak protection features unlocked</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => togglePlus.mutate(false)}
                  disabled={togglePlus.isPending}
                  data-testid="button-downgrade"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center gap-2 px-1">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">Protection Features</h2>
        </div>

        <Card data-testid="card-streak-freeze">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Snowflake className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg">Streak Freeze</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {user.freezeTokens} available
                  </Badge>
                </div>
                <CardDescription>Skip a day without losing your streak</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Current streak: {user.streak} days</span>
            </div>
            <Button 
              className="w-full"
              variant={user.freezeTokens > 0 ? "default" : "secondary"}
              disabled={user.freezeTokens === 0 || useFreeze.isPending || !!user.todayResult}
              onClick={() => useFreeze.mutate()}
              data-testid="button-use-freeze"
            >
              {user.todayResult ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Already played today
                </>
              ) : user.freezeTokens > 0 ? (
                <>
                  <Snowflake className="w-4 h-4 mr-2" />
                  Use Freeze Token
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  No tokens available
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className={!isPlus ? "opacity-60" : ""} data-testid="card-streak-buyback">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg">Streak Buyback</CardTitle>
                  {!isPlus && (
                    <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500">
                      <Crown className="w-3 h-3 mr-1" />
                      Plus
                    </Badge>
                  )}
                </div>
                <CardDescription>Restore your lost streak once per month</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasLostStreak && (
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-sm font-medium">Lost streak available to restore:</p>
                <p className="text-2xl font-bold text-purple-400">{user.streakInsurance.lostStreak} days</p>
              </div>
            )}
            {hasBuybackThisMonth && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-500" />
                <span>Used this month. Resets next month.</span>
              </div>
            )}
            <Button 
              className="w-full"
              variant={isPlus && hasLostStreak && !hasBuybackThisMonth ? "default" : "secondary"}
              disabled={!isPlus || !hasLostStreak || !!hasBuybackThisMonth || useBuyback.isPending}
              onClick={() => useBuyback.mutate()}
              data-testid="button-use-buyback"
            >
              {!isPlus ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Plus feature
                </>
              ) : hasBuybackThisMonth ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Used this month
                </>
              ) : hasLostStreak ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore {user.streakInsurance.lostStreak}-day streak
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  No lost streak to restore
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className={!isPlus ? "opacity-60" : ""} data-testid="card-late-pass">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-lg">Late Pass</CardTitle>
                  {!isPlus && (
                    <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500">
                      <Crown className="w-3 h-3 mr-1" />
                      Plus
                    </Badge>
                  )}
                </div>
                <CardDescription>Play yesterday's drop if you missed it</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {latePassAvailable && isPlus && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm font-medium text-blue-400">Late Pass available!</p>
                <p className="text-xs text-muted-foreground">You missed yesterday. Use your Late Pass to catch up.</p>
              </div>
            )}
            <Button 
              className="w-full"
              variant={isPlus && latePassAvailable ? "default" : "secondary"}
              disabled={!isPlus || !latePassAvailable || useLatePass.isPending}
              onClick={() => useLatePass.mutate()}
              data-testid="button-use-late-pass"
            >
              {!isPlus ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Plus feature
                </>
              ) : latePassAvailable ? (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  Play Yesterday's Drop
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 mr-2" />
                  No Late Pass available
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground p-4">
          <p>Plus members get 3 Streak Freeze tokens monthly</p>
          <p>and exclusive access to Buyback and Late Pass features</p>
        </div>
      </main>
    </div>
  );
}
