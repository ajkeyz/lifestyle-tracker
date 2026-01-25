import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Laptop, 
  Globe, 
  ShieldAlert, 
  GraduationCap, 
  Briefcase,
  TrendingUp,
  ChevronRight,
  Check
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, GameMode } from "@shared/schema";
import { cn } from "@/lib/utils";

interface ModeOption {
  id: GameMode;
  title: string;
  description: string;
  bestFor: string;
  icon: typeof Laptop;
  gradient: string;
}

const modes: ModeOption[] = [
  {
    id: "tech",
    title: "Tech Mode",
    description: "High income, high volatility. RSUs, stock options, and startup decisions.",
    bestFor: "Software engineers & tech workers",
    icon: Laptop,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "global",
    title: "Global Citizen Mode",
    description: "Travel deals, FX rates, and experience-based spending decisions.",
    bestFor: "Travelers & remote workers",
    icon: Globe,
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: "scam",
    title: "Fraud Defense Mode",
    description: "Spot scams, phishing attempts, and protect your money from thieves.",
    bestFor: "Everyone (but especially seniors)",
    icon: ShieldAlert,
    gradient: "from-red-500 to-orange-500",
  },
  {
    id: "student",
    title: "Student Mode",
    description: "Low cash, high temptation. Learn to resist FOMO and build habits.",
    bestFor: "Students & early career",
    icon: GraduationCap,
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "boss",
    title: "Boss Mode",
    description: "Family, bills, and pressure. Balance responsibilities with goals.",
    bestFor: "Parents & providers",
    icon: Briefcase,
    gradient: "from-amber-500 to-yellow-500",
  },
];

export default function Setup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedMode, setSelectedMode] = useState<GameMode | null>(null);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const setModeMutation = useMutation({
    mutationFn: async (mode: GameMode) => {
      const res = await apiRequest("POST", "/api/set-mode", { mode });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      navigate("/play");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to set mode. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleContinue = () => {
    if (selectedMode) {
      setModeMutation.mutate(selectedMode);
    }
  };

  useEffect(() => {
    if (user?.mode) {
      navigate("/play");
    }
  }, [user?.mode, navigate]);

  if (user?.mode) {
    return null;
  }

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

      <main className="container max-w-2xl mx-auto p-4 space-y-6">
        <motion.div 
          className="text-center py-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-setup-title">
            Choose Your Mode
          </h1>
          <p className="text-muted-foreground" data-testid="text-setup-description">
            Pick a scenario style that matches your life
          </p>
        </motion.div>

        <motion.div 
          className="space-y-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1, delayChildren: 0.2 }
            }
          }}
        >
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;

            return (
              <motion.div
                key={mode.id}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 }
                }}
                transition={{ duration: 0.3 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={cn(
                    "p-4 cursor-pointer transition-all border-2",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover-elevate"
                  )}
                  onClick={() => setSelectedMode(mode.id)}
                  data-testid={`card-mode-${mode.id}`}
                >
                  <div className="flex items-start gap-4">
                    <motion.div
                      className={cn(
                        "w-12 h-12 rounded-md flex items-center justify-center flex-shrink-0 bg-gradient-to-br",
                        mode.gradient
                      )}
                      animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold" data-testid={`text-mode-title-${mode.id}`}>
                          {mode.title}
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
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`text-mode-description-${mode.id}`}>
                        {mode.description}
                      </p>
                      <p className="text-xs text-accent mt-2" data-testid={`text-mode-bestfor-${mode.id}`}>
                        Best for: {mode.bestFor}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      className="flex-shrink-0 self-center"
                      data-testid={`button-select-${mode.id}`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Selected
                        </>
                      ) : (
                        "Select"
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.8 }}
        >
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold"
            disabled={!selectedMode || setModeMutation.isPending}
            onClick={handleContinue}
            data-testid="button-continue"
          >
            {setModeMutation.isPending ? (
              "Setting up..."
            ) : (
              <>
                Continue
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </motion.div>

        <motion.p 
          className="text-center text-xs text-muted-foreground" 
          data-testid="text-mode-note"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1 }}
        >
          You can change your mode anytime from settings
        </motion.p>
      </main>
    </div>
  );
}
