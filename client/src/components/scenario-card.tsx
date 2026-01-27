import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Scenario, ScenarioCategory } from "@shared/schema";
import { 
  Laptop, Plane, ShoppingBag, ShieldAlert, TrendingUp, CreditCard,
  Briefcase, Heart, Home, Shield, Receipt, Wallet, AlertTriangle,
  PiggyBank, Activity, Gift, Coins, Users, Sparkles, HelpCircle
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
  saving: Coins,
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

  return (
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

          return (
            <motion.button
              key={choice.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                scale: showResult && isSelected && !isCorrect ? [1, 1.02, 0.98, 1.01, 0.99, 1] : 1,
              }}
              transition={{ 
                delay: index * 0.05,
                scale: { duration: 0.4, ease: "easeInOut" }
              }}
              onClick={() => !showResult && onSelectChoice(choice.label)}
              disabled={showResult}
              className={cn(
                "w-full p-4 rounded-lg border-2 text-left transition-colors",
                "flex items-start gap-3",
                !showResult && !isSelected && "hover-elevate border-border",
                !showResult && isSelected && "border-primary bg-primary/5",
                showResult && isSelected && isCorrect && "border-primary bg-primary/10",
                showResult && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                showResult && !isSelected && isCorrect && "border-primary/50 bg-primary/5"
              )}
              data-testid={`button-choice-${choice.label}`}
            >
              <motion.span
                animate={showResult && isCorrect ? {
                  scale: [1, 1.2, 1],
                  rotate: [0, -10, 10, 0]
                } : {}}
                transition={{ duration: 0.4, delay: 0.2 }}
                className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                  !showResult && !isSelected && "bg-secondary text-secondary-foreground",
                  !showResult && isSelected && "bg-primary text-primary-foreground",
                  showResult && isCorrect && "bg-primary text-primary-foreground",
                  showResult && isSelected && !isCorrect && "bg-destructive text-destructive-foreground"
                )}
                data-testid={`label-choice-${choice.label}`}
              >
                {choice.label}
              </motion.span>
              <div className="flex-1">
                <p className="font-medium" data-testid={`text-choice-${choice.label}`}>{choice.text}</p>
                <AnimatePresence>
                  {showResult && showCorrectness && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className={cn(
                        "text-sm mt-1",
                        isCorrect ? "text-primary" : "text-destructive"
                      )}
                      data-testid={`text-feedback-${choice.label}`}
                    >
                      {choice.feedback}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence>
                {showResult && isCorrect && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                  >
                    <Badge variant="default" className="flex-shrink-0" data-testid={`badge-points-${choice.label}`}>
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
  );
}
