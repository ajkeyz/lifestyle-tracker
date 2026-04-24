import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AmbientBackground } from "@/components/ambient-background";
import { Mascot, type MascotContext } from "@/components/mascot";
import {
  TrendingUp,
  Home,
  ShoppingBag,
  CreditCard,
  ShieldAlert,
  Users,
  ChevronRight,
  Check,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import { cn } from "@/lib/utils";
import { THEMES, type ThemeId } from "@shared/lib/themes";
import { useTheme } from "@/hooks/use-theme";

const ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp,
  Home,
  ShoppingBag,
  CreditCard,
  ShieldAlert,
  Users,
};

export default function Setup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedTheme, setSelectedTheme] = useState<ThemeId | null>(null);
  const { setTheme, isPending } = useTheme();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const handleContinue = async () => {
    if (!selectedTheme) return;
    try {
      await setTheme(selectedTheme);
      navigate("/");
    } catch (err) {
      toast({
        title: "Error",
        description: (err as Error)?.message || "Failed to set theme. Please try again.",
        variant: "destructive",
      });
    }
  };

  // If user already has a theme, skip setup
  useEffect(() => {
    if (user?.weeklyTheme) {
      navigate("/");
    }
  }, [user?.weeklyTheme, navigate]);

  if (user?.weeklyTheme) return null;

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

      <main className="container max-w-2xl mx-auto p-4 space-y-6">
        <motion.div
          className="text-center py-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl md:text-3xl font-display font-semibold mb-2 tracking-[-0.02em]" data-testid="text-setup-title">
            Pick this week's theme
          </h1>
          <p className="text-muted-foreground" data-testid="text-setup-description">
            All your daily drops and arcade games will focus on this topic until next Monday
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
            context={{ screen: "setup" } satisfies MascotContext}
          />
        </motion.div>

        <motion.div
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.06, delayChildren: 0.2 },
            },
          }}
        >
          {THEMES.map((theme) => {
            const Icon = ICON_MAP[theme.icon] ?? ShoppingBag;
            const isSelected = selectedTheme === theme.id;

            return (
              <motion.div
                key={theme.id}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 },
                }}
                transition={{ duration: 0.3 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={cn(
                    "p-4 cursor-pointer transition-all border-2",
                    isSelected ? "border-primary bg-primary/5" : "border-transparent hover-elevate",
                  )}
                  onClick={() => setSelectedTheme(theme.id)}
                  data-testid={`card-theme-${theme.id}`}
                >
                  <div className="flex items-start gap-4">
                    <motion.div
                      className={cn("w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0", theme.gradient)}
                      animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold" data-testid={`text-theme-title-${theme.id}`}>
                          {theme.label}
                        </h3>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Check className="w-4 h-4 text-primary" />
                          </motion.div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`text-theme-description-${theme.id}`}>
                        {theme.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold btn-premium border-0"
            disabled={!selectedTheme || isPending}
            onClick={handleContinue}
            data-testid="button-continue"
          >
            {isPending ? "Setting up..." : (
              <>
                Continue
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </motion.div>

        <motion.p
          className="text-center text-xs text-muted-foreground"
          data-testid="text-theme-note"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          You can change your theme each Monday from the home page
        </motion.p>
      </main>
    </div>
  );
}
