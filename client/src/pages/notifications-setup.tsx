import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  TrendingUp,
  Bell,
  CalendarClock,
  Flame,
  Users,
  Swords,
  ChevronRight
} from "lucide-react";
import { useLocation } from "wouter";

const benefits = [
  {
    icon: CalendarClock,
    title: "Daily Drop reminder",
    description: "Never miss your daily challenge",
  },
  {
    icon: Flame,
    title: "Streak protection",
    description: "Get a nudge before your streak expires",
  },
  {
    icon: Users,
    title: "Friend league updates",
    description: "Know when someone beats your score",
  },
  {
    icon: Swords,
    title: "You got challenged",
    description: "Friends can send you head-to-head challenges",
  },
];

export default function NotificationsSetup() {
  const [, navigate] = useLocation();

  const handleEnableNotifications = async () => {
    try {
      if ("Notification" in window) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          localStorage.setItem("notificationsEnabled", "true");
        }
      }
    } catch (error) {
      console.error("Notification permission error:", error);
    }
    navigate("/friends-setup");
  };

  const handleMaybeLater = () => {
    localStorage.setItem("notificationsSkipped", "true");
    navigate("/friends-setup");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center justify-between gap-2 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg" data-testid="text-app-title">Lifestyle Creep</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="container max-w-md mx-auto p-4 space-y-6">
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Bell className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-notifications-title">
            Stay in the Game
          </h1>
          <p className="text-muted-foreground" data-testid="text-notifications-description">
            Quick notifications help you build better money habits
          </p>
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div 
                  key={index} 
                  className="flex items-start gap-4"
                  data-testid={`benefit-item-${index}`}
                >
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium" data-testid={`text-benefit-title-${index}`}>
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid={`text-benefit-description-${index}`}>
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full"
            onClick={handleEnableNotifications}
            data-testid="button-enable-notifications"
          >
            <Bell className="w-5 h-5 mr-2" />
            Enable Notifications
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>

          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={handleMaybeLater}
            data-testid="button-maybe-later"
          >
            Maybe Later
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground" data-testid="text-notifications-note">
          You can change this anytime in settings
        </p>
      </main>
    </div>
  );
}
