import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Bell, 
  Clock,
  Swords,
  Trophy,
  BellOff
} from "lucide-react";
import type { User, NotificationPrefs } from "@shared/schema";

const TIME_OPTIONS = [
  { value: "06:00", label: "6:00 AM" },
  { value: "07:00", label: "7:00 AM" },
  { value: "08:00", label: "8:00 AM" },
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "17:00", label: "5:00 PM" },
  { value: "18:00", label: "6:00 PM" },
  { value: "19:00", label: "7:00 PM" },
  { value: "20:00", label: "8:00 PM" },
  { value: "21:00", label: "9:00 PM" },
  { value: "22:00", label: "10:00 PM" },
];

export default function NotificationsPrefs() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const updatePrefs = useMutation({
    mutationFn: async (prefs: NotificationPrefs) => {
      return apiRequest("POST", "/api/notification-prefs", prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Preferences saved",
        description: "Your notification settings have been updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save preferences",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const prefs = user.notificationPrefs;

  const handleToggle = (key: keyof NotificationPrefs, value: boolean) => {
    updatePrefs.mutate({ ...prefs, [key]: value });
  };

  const handleTimeChange = (key: keyof NotificationPrefs, value: string) => {
    updatePrefs.mutate({ ...prefs, [key]: value });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center gap-3 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/settings")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg" data-testid="text-page-title">Notifications</h1>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-4">
        <Card className="border-0 bg-muted/30" data-testid="card-smart-defaults">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <BellOff className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Smart defaults for less noise</p>
                <p className="text-xs text-muted-foreground">
                  We only notify when it matters. No spam, no guilt trips.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-daily-reminder">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Daily Reminder</CardTitle>
                <CardDescription>Get a nudge to play each day</CardDescription>
              </div>
              <Switch
                checked={prefs.dailyReminderEnabled}
                onCheckedChange={(checked) => handleToggle("dailyReminderEnabled", checked)}
                disabled={updatePrefs.isPending}
                data-testid="switch-daily-reminder"
              />
            </div>
          </CardHeader>
          {prefs.dailyReminderEnabled && (
            <CardContent className="pt-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm text-muted-foreground">Reminder time</span>
                <Select 
                  value={prefs.dailyReminderTime} 
                  onValueChange={(v) => handleTimeChange("dailyReminderTime", v)}
                  disabled={updatePrefs.isPending}
                >
                  <SelectTrigger className="w-32" data-testid="select-daily-reminder-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          )}
        </Card>

        <Card data-testid="card-only-if-not-played">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Only If I Haven't Played</CardTitle>
                <CardDescription>Skip reminder if you've already played</CardDescription>
              </div>
              <Switch
                checked={prefs.onlyIfNotPlayed}
                onCheckedChange={(checked) => handleToggle("onlyIfNotPlayed", checked)}
                disabled={updatePrefs.isPending}
                data-testid="switch-only-if-not-played"
              />
            </div>
          </CardHeader>
          {prefs.onlyIfNotPlayed && (
            <CardContent className="pt-2">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <span className="text-sm text-muted-foreground">Notify me by</span>
                <Select 
                  value={prefs.onlyIfNotPlayedTime} 
                  onValueChange={(v) => handleTimeChange("onlyIfNotPlayedTime", v)}
                  disabled={updatePrefs.isPending}
                >
                  <SelectTrigger className="w-32" data-testid="select-only-if-not-played-time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                You'll only get this reminder if you haven't played by this time
              </p>
            </CardContent>
          )}
        </Card>

        <Card data-testid="card-challenge-alerts">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Swords className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">Friend Challenge Alerts</CardTitle>
                <CardDescription>When someone challenges you</CardDescription>
              </div>
              <Switch
                checked={prefs.challengeAlerts}
                onCheckedChange={(checked) => handleToggle("challengeAlerts", checked)}
                disabled={updatePrefs.isPending}
                data-testid="switch-challenge-alerts"
              />
            </div>
          </CardHeader>
        </Card>

        <Card data-testid="card-league-alerts">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-base">League Rank Alerts</CardTitle>
                <CardDescription>Weekly summary only, not every change</CardDescription>
              </div>
              <Switch
                checked={prefs.leagueRankAlerts}
                onCheckedChange={(checked) => handleToggle("leagueRankAlerts", checked)}
                disabled={updatePrefs.isPending}
                data-testid="switch-league-alerts"
              />
            </div>
          </CardHeader>
        </Card>
      </main>
    </div>
  );
}
