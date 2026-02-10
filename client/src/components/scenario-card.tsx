import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TiltCard } from "@/components/ui/tilt-card";
import type { Scenario, ScenarioCategory } from "@shared/schema";
import { Check, X, Coins } from "lucide-react";
import { 
  Laptop, Plane, ShoppingBag, ShieldAlert, TrendingUp, CreditCard,
  Briefcase, Heart, Home, Shield, Receipt, Wallet, AlertTriangle,
  PiggyBank, Activity, Gift, Coins as CoinsIcon, Users, Sparkles, HelpCircle
} from "lucide-react";

const categoryIcons: Record<ScenarioCategory, typeof Laptop> = {
  tech: Laptop,
  travel: Plane,
  lifestyle: ShoppingBag,
  scam: ShieldAlert,
  investing: TrendingUp,
  debt: CreditCard,
  career: Briefcase,
  relationships: Heart,
  housing: Home,
  insurance: Shield,
  tax: Receipt,
  credit: Wallet,
  emergency: AlertTriangle,
  budgeting: PiggyBank,
  health: Activity,
  giving: Gift,
  saving: CoinsIcon,
  family: Users,
  windfall: Sparkles,
};

const categoryColors: Record<ScenarioCategory, string> = {
  tech: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  travel: "bg-primary/10 text-primary border-primary/20",
  lifestyle: "bg-accent/10 text-accent-foreground border-accent/20",
  scam: "bg-destructive/10 text-destructive border-destructive/20",
  investing: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  debt: "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  career: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  relationships: "bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-800",
  housing: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  insurance: "bg-slate-100 dark:bg-slate-900/20 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800",
  tax: "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  credit: "bg-violet-100 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800",
  emergency: "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  budgeting: "bg-cyan-100 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
  health: "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  giving: "bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  saving: "bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800",
  family: "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  windfall: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
};

function getPointHint(points: number): { color: string; bgColor: string } {
  if (points >= 100) return { color: "text-primary", bgColor: "bg-primary/10" };
  if (points >= 80) return { color: "text-emerald-500 dark:text-emerald-400", bgColor: "bg-emerald-500/10" };
  if (points >= 50) return { color: "text-amber-500 dark:text-amber-400", bgColor: "bg-amber-500/10" };
  if (points >= 20) return { color: "text-muted-foreground", bgColor: "bg-muted/50" };
  return { color: "text-muted-foreground/60", bgColor: "bg-muted/30" };
}

interface ScenarioCardProps {
  scenario: Scenario;
  selectedChoice: string | null;
  onSelectChoice: (label: string) => void;
  showResult?: boolean;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining?: number;
}

export function ScenarioCard({
  scenario,
  selectedChoice,
  onSelectChoice,
  showResult = false,
  questionNumber,
  totalQuestions,
  timeRemaining,
}: ScenarioCardProps) {
  const Icon = categoryIcons[scenario.category] || ShoppingBag;

  const [revealStage, setRevealStage] = useState(0);

  useEffect(() => {
    if (showResult && revealStage === 0) {
      setTimeout(() => setRevealStage(1), 500);
      setTimeout(() => setRevealStage(2), 800);
      setTimeout(() => setRevealStage(3), 1200);
    } else if (!showResult) {
      setRevealStage(0);
    }
  }, [showResult, revealStage]);

  return (
    <TiltCard tiltAmount={5} glareEnabled={true} floatOnHover={false}>
      <Card className="p-6 scenario-reveal" data-testid={`card-scenario-${scenario.id}`}>
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={cn("border", categoryColors[scenario.category])}
            data-testid={`badge-category-${scenario.category}`}
          >
            <Icon className="w-3 h-3 mr-1" />
            {scenario.category.charAt(0).toUpperCase() + scenario.category.slice(1)}
          </Badge>
          <span className="text-sm text-muted-foreground" data-testid="text-question-number">
            Q{questionNumber}/{totalQuestions}
          </span>
        </div>
        {timeRemaining !== undefined && (
          <Badge
            variant={timeRemaining <= 5 ? "destructive" : "secondary"}
            className={timeRemaining <= 5 ? "animate-pulse" : ""}
            data-testid="badge-timer"
          >
            {timeRemaining}s
          </Badge>
        )}
      </div>

      <div className="mb-4 p-3 bg-muted/50 rounded-md">
        <p className="text-sm text-muted-foreground font-mono" data-testid="text-scenario-context">{scenario.context}</p>
      </div>

      <h3 className="text-lg font-semibold mb-4" data-testid="text-scenario-question">{scenario.question}</h3>

      <div className="space-y-2">
        {scenario.choices.map((choice, index) => {
          const isSelected = selectedChoice === choice.label;
          const isCorrect = choice.isCorrect;
          const showCorrectness = showResult && (isSelected || isCorrect);
          const hint = getPointHint(choice.points);
          const earnedPoints = Math.max(0, choice.points);

          return (
            <motion.button
              key={choice.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: showResult && !isSelected && !isCorrect ? 0.3 : 1,
                x: showResult && isSelected && !isCorrect ? [-10, 10, -8, 8, -5, 5, 0] : 0,
                scale: showResult && isSelected ? [1, 1.05, 1] : 1,
                y: showResult && isSelected && !isCorrect ? [0, -5, 0, -3, 0] : 0,
              }}
              transition={{
                opacity: { duration: 0.5, delay: index * 0.05 },
                x: { duration: 0.6, delay: revealStage >= 2 ? 0 : 999 },
                scale: { duration: 0.5, delay: revealStage >= 1 ? 0 : 999 },
                y: { duration: 0.4, delay: revealStage >= 2 ? 0 : 999 },
              }}
              onClick={() => !showResult && onSelectChoice(choice.label)}
              disabled={showResult}
              className={cn(
                "w-full p-4 rounded-lg border-2 text-left transition-all relative overflow-visible group",
                "flex items-start gap-3",
                !showResult && !isSelected && "hover-elevate border-border hover:border-primary/30 hover:bg-primary/5",
                !showResult && isSelected && "border-primary bg-primary/5 shadow-lg",
                showResult && isSelected && isCorrect && "border-primary bg-gradient-to-r from-primary/10 to-primary/20 shadow-lg",
                showResult && isSelected && !isCorrect && "border-destructive bg-gradient-to-r from-destructive/10 to-destructive/20",
                showResult && !isSelected && isCorrect && "border-primary/50 bg-primary/5",
                showResult && !isSelected && !isCorrect && "opacity-50"
              )}
              data-testid={`button-choice-${choice.label}`}
            >
              <motion.span
                animate={showResult && revealStage >= 1 ? {
                  scale: isCorrect || isSelected ? [1, 1.3, 1] : 1,
                  rotate: isCorrect ? [0, -10, 10, 0] : (isSelected && !isCorrect ? [0, 5, -5, 0] : 0)
                } : {}}
                transition={{ duration: 0.5, delay: revealStage >= 1 ? 0 : 999 }}
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm relative",
                  !showResult && !isSelected && "bg-secondary text-secondary-foreground",
                  !showResult && isSelected && "bg-primary text-primary-foreground",
                  showResult && isCorrect && "bg-primary text-primary-foreground",
                  showResult && isSelected && !isCorrect && "bg-destructive text-destructive-foreground"
                )}
                data-testid={`label-choice-${choice.label}`}
              >
                {showResult && revealStage >= 2 && (isCorrect || isSelected) ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {isCorrect ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <X className="w-5 h-5" />
                    )}
                  </motion.div>
                ) : (
                  choice.label
                )}
              </motion.span>
              <div className="flex-1">
                <p className="font-medium" data-testid={`text-choice-${choice.label}`}>{choice.text}</p>
                <AnimatePresence>
                  {showResult && showCorrectness && revealStage >= 3 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: "auto", y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="mt-2 space-y-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <Coins className={cn("w-3.5 h-3.5", isCorrect ? "text-primary" : "text-destructive")} />
                        <span className={cn(
                          "text-sm font-semibold tabular-nums",
                          isCorrect ? "text-primary" : "text-destructive"
                        )}>
                          +{earnedPoints} pts
                        </span>
                        {isCorrect && choice.points >= 100 && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/70 ml-1">Best</span>
                        )}
                        {isCorrect && choice.points < 100 && choice.points >= 50 && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500/70 dark:text-amber-400/70 ml-1">Good</span>
                        )}
                      </div>
                      <p className={cn(
                        "text-sm font-medium",
                        isCorrect ? "text-primary" : "text-destructive"
                      )}
                        data-testid={`text-feedback-${choice.label}`}
                      >
                        {choice.feedback}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {showResult && (isSelected || isCorrect) && revealStage >= 2 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.15 }}
                  className={cn(
                    "flex-shrink-0 self-center",
                    "flex items-center gap-1 px-2 py-0.5 rounded-full",
                    "text-[11px] font-semibold tabular-nums tracking-wide",
                    hint.bgColor,
                    hint.color,
                  )}
                  data-testid={`points-hint-${choice.label}`}
                >
                  <Coins className="w-3 h-3" />
                  <span>{Math.max(0, choice.points)}</span>
                </motion.div>
              )}

              <AnimatePresence>
                {showResult && isCorrect && revealStage >= 3 && (
                  <motion.div
                    initial={{ scale: 0, y: 20, opacity: 0 }}
                    animate={{
                      scale: [0, 1.3, 1],
                      y: [20, -10, 0],
                      opacity: [0, 1, 1]
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 15,
                      delay: 0
                    }}
                  >
                    <Badge
                      variant="default"
                      className="flex-shrink-0 text-sm font-bold shadow-lg"
                      data-testid={`badge-points-${choice.label}`}
                    >
                      +{choice.points}
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </Card>
    </TiltCard>
  );
}
