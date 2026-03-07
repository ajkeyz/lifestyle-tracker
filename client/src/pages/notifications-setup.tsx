import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AmbientBackground } from "@/components/ambient-background";
import { Mascot, type MascotContext } from "@/components/mascot";
import {
  Bell,
  CalendarClock,
  Flame,
  Users,
  Swords,
  ChevronRight,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { useLocation } from "wouter";
import { registerServiceWorker, subscribeToPushNotifications } from "@/lib/service-worker";
import { useToast } from "@/hooks/use-toast";

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
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { toast } = useToast();

  const handleEnableNotifications = async () => {
    setIsSubscribing(true);
    try {
      // Register service worker first
      const registration = await registerServiceWorker();
      
      if (registration) {
        // Subscribe to push notifications
        const subscription = await subscribeToPushNotifications(registration);
        
        if (subscription) {
          localStorage.setItem("notificationsEnabled", "true");
          toast({
            title: "Notifications enabled",
            description: "You'll receive reminders for daily drops and more!",
          });
        } else {
          // Permission was denied or subscription failed
          toast({
            title: "Notifications not enabled",
            description: "You can enable them later in settings.",
            variant: "destructive",
          });
        }
      } else {
        // Service worker not supported
        localStorage.setItem("notificationsEnabled", "false");
      }
    } catch (error) {
      console.error("Notification permission error:", error);
      toast({
        title: "Something went wrong",
        description: "Could not enable notifications. Try again later.",
        variant: "destructive",
      });
    }
    setIsSubscribing(false);
    navigate("/friends-setup");
  };

  const handleMaybeLater = () => {
    localStorage.setItem("notificationsSkipped", "true");
    navigate("/friends-setup");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50 relative overflow-x-clip">
      <AmbientBackground variant="default" />
      <header className="flex items-center gap-3 px-4 h-14 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <AppLogo size="sm" />
          <span className="font-display font-extrabold text-[15px] leading-none tracking-[-0.04em]" data-testid="text-app-title">Lifestyle Creep</span>
        </div>
      </header>

      <main className="container max-w-md mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center py-6"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Bell className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2" data-testid="text-notifications-title">
            Stay in the Game
          </h1>
          <p className="text-muted-foreground" data-testid="text-notifications-description">
            Quick notifications help you build better money habits
          </p>
        </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
                  className="flex justify-center py-2"
                >
                  <Mascot
                    mood="waving"
                    size="sm"
                    showBubble={true}
                    speechDelay={1400}
                    message="Never miss a daily drop!"
                    context={{ screen: "home", username: "", streak: 0 } satisfies MascotContext}
                  />
                </motion.div>

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
            className="w-full btn-premium border-0"
            onClick={handleEnableNotifications}
            disabled={isSubscribing}
            data-testid="button-enable-notifications"
          >
            {isSubscribing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Bell className="w-5 h-5 mr-2" />
            )}
            {isSubscribing ? "Setting up..." : "Enable Notifications"}
            {!isSubscribing && <ChevronRight className="w-5 h-5 ml-2" />}
          </Button>

          <Button
            variant="ghost"
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
