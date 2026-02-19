import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  Heart,
  EyeOff,
  Users,
  Flame,
  BookOpen,
  HelpCircle,
  ChevronRight,
  Bell,
  Shield,
  Settings2,
  Volume2,
  VolumeX,
  Crown,
  Sparkles,
  Trash2,
  AlertTriangle,
  Download,
  LogOut
} from "lucide-react";
import { useSound } from "@/hooks/use-sound";
import { useAuth } from "@/hooks/use-auth";
import { ReferralCard } from "@/components/referral-card";
import type { User } from "@shared/schema";

export default function Settings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { soundEnabled, toggleSound, isToggling } = useSound();
  const { logout } = useAuth();


  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: adminCheck } = useQuery<{ isAdmin: boolean; isModerator: boolean; hasAccess: boolean }>({
    queryKey: ["/api/admin/check"],
  });

  const toggleLowPressureMode = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiRequest("POST", "/api/low-pressure-mode", { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: user?.lowPressureMode ? "Low Pressure Mode disabled" : "Low Pressure Mode enabled",
        description: user?.lowPressureMode
          ? "Rankings and comparisons are now visible"
          : "Focus on your personal growth",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/account");
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account and all data have been permanently deleted.",
      });
      // Logout after successful deletion
      setTimeout(() => {
        logout();
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete account. Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50 p-4">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
      <header className="flex items-center gap-3 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg" data-testid="text-page-title">Settings</h1>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-4">
        <Card data-testid="card-low-pressure-mode">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Low Pressure Mode</CardTitle>
                  <CardDescription>Play without the stress</CardDescription>
                </div>
              </div>
              <Switch
                checked={user.lowPressureMode}
                onCheckedChange={(checked) => toggleLowPressureMode.mutate(checked)}
                disabled={toggleLowPressureMode.isPending}
                data-testid="switch-low-pressure-mode"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              For users who want self-improvement without anxiety. When enabled:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">No ranks shown</p>
                  <p className="text-xs text-muted-foreground">
                    Your position numbers are hidden across the app
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">No friend comparisons</p>
                  <p className="text-xs text-muted-foreground">
                    Leaderboards and competitive features are hidden
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Just your streak + learning</p>
                  <p className="text-xs text-muted-foreground">
                    Focus on daily practice and personal growth
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">Deep Dive still available</p>
                  <p className="text-xs text-muted-foreground">
                    Learn from every decision with detailed explanations
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-sound-settings">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-white" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">Sound Effects</CardTitle>
                  <CardDescription>Audio feedback during gameplay</CardDescription>
                </div>
              </div>
              <Switch
                checked={soundEnabled}
                onCheckedChange={() => toggleSound()}
                disabled={isToggling}
                data-testid="switch-sound-effects"
              />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Includes correct/incorrect answer sounds, timer warnings, and celebration sounds for achievements.
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover-elevate"
          onClick={() => navigate("/tips")}
          data-testid="card-tips-library"
        >
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Financial Tips Library</CardTitle>
                  <CardDescription>Browse all money wisdom by category</CardDescription>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer"
          onClick={() => navigate("/streak-insurance")}
          data-testid="card-streak-insurance"
        >
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Streak Insurance</CardTitle>
                  <CardDescription>Protect and restore your streaks</CardDescription>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer hover-elevate relative overflow-hidden"
          onClick={() => navigate("/membership")}
          data-testid="card-membership"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 rounded-full blur-3xl" />
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 flex items-center justify-center relative">
                  <Crown className="w-5 h-5 text-white" />
                  <Sparkles className="w-3 h-3 text-white absolute -top-1 -right-1" />
                </div>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Membership
                    {user.membershipTier === "pro" && (
                      <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white">PRO</span>
                    )}
                    {user.membershipTier === "plus" && (
                      <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">PLUS</span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {user.membershipTier === "free" && "Unlock premium features"}
                    {user.membershipTier === "plus" && "Manage your Plus membership"}
                    {user.membershipTier === "pro" && "Manage your Pro membership"}
                  </CardDescription>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer"
          onClick={() => navigate("/notifications-prefs")}
          data-testid="card-notifications"
        >
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Notifications</CardTitle>
                  <CardDescription>Smart reminders, not spam</CardDescription>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
        </Card>

        <ReferralCard />

        <Card 
          className="cursor-pointer"
          onClick={() => navigate("/help")}
          data-testid="card-help"
        >
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Help & FAQ</CardTitle>
                  <CardDescription>Get answers to common questions</CardDescription>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardHeader>
        </Card>

        {adminCheck?.hasAccess && (
          <Card
            className="cursor-pointer"
            onClick={() => navigate("/admin")}
            data-testid="card-admin"
          >
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                    <Settings2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Admin Dashboard</CardTitle>
                    <CardDescription>
                      {adminCheck.isAdmin ? "Super Admin" : "Moderator"} access
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Data Export - GDPR Article 20 */}
        <Card data-testid="card-export-data">
          <CardHeader>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Download Your Data</CardTitle>
                <CardDescription>Export all your data in JSON format</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Download a complete copy of your profile, game history, achievements, and settings.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/api/export-data";
                toast({
                  title: "Downloading data",
                  description: "Your data export will download shortly",
                });
              }}
              data-testid="button-export-data"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Data
            </Button>
          </CardContent>
        </Card>

        <Card data-testid="card-logout">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Log Out</CardTitle>
                  <CardDescription>Sign out of your account</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => logout()}
                data-testid="button-logout"
              >
                Log Out
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Account Deletion - Required by Apple App Store & GDPR */}
        <Card className="border-destructive/20" data-testid="card-delete-account">
          <CardHeader>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-lg text-destructive">Delete Account</CardTitle>
                <CardDescription>Permanently delete your account and all data</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/5">
              <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. All your data including streak, achievements, and game history will be permanently deleted.
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={deleteAccountMutation.isPending}
                  data-testid="button-delete-account"
                >
                  {deleteAccountMutation.isPending ? (
                    "Deleting..."
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete My Account
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      This will permanently delete your account and remove your data from our servers.
                    </p>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium text-foreground">You will lose:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>Your {user?.streak || 0} day streak</li>
                        <li>All {user?.gamesPlayed || 0} games played</li>
                        <li>{user?.badges?.length || 0} achievements earned</li>
                        <li>Friends, leagues, and challenges</li>
                        <li>Purchase history (if applicable)</li>
                      </ul>
                    </div>
                    <p className="text-destructive font-medium">
                      This action cannot be undone.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAccountMutation.mutate()}
                    className="bg-destructive hover:bg-destructive/90"
                    data-testid="button-confirm-delete"
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
