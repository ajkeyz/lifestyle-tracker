import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ScenarioCategory } from "@shared/schema";
import { getContextBuffer, classifyDifficulty } from "@/lib/game-insights";
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
  tech: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  travel: "bg-primary/10 text-primary border-primary/20",
  lifestyle: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  scam: "bg-destructive/10 text-destructive border-destructive/20",
  investing: "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
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

// #2: Category ambient glow color mapping (HSL values for CSS custom property)
const categoryGlowColors: Record<ScenarioCategory, string> = {
  tech: "hsl(217 91% 60% / 0.10)",
  travel: "hsl(262 83% 58% / 0.10)",
  lifestyle: "hsl(38 92% 50% / 0.10)",
  scam: "hsl(0 72% 51% / 0.10)",
  investing: "hsl(271 91% 65% / 0.10)",
  debt: "hsl(25 95% 53% / 0.10)",
  career: "hsl(217 91% 60% / 0.10)",
  relationships: "hsl(330 81% 60% / 0.10)",
  housing: "hsl(38 92% 50% / 0.10)",
  insurance: "hsl(215 16% 47% / 0.08)",
  tax: "hsl(152 69% 41% / 0.10)",
  credit: "hsl(263 70% 50% / 0.10)",
  emergency: "hsl(0 72% 51% / 0.10)",
  budgeting: "hsl(187 85% 43% / 0.10)",
  health: "hsl(142 71% 45% / 0.10)",
  giving: "hsl(347 77% 50% / 0.10)",
  saving: "hsl(170 77% 36% / 0.10)",
  family: "hsl(239 84% 67% / 0.10)",
  windfall: "hsl(48 96% 53% / 0.10)",
};

// #13: Difficulty badge colors
const difficultyConfig = {
  easy: { label: "Easy", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  medium: { label: "Medium", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  hard: { label: "Hard", className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
};

interface QuestionHeaderProps {
  category: ScenarioCategory;
  context: string;
  question: string;
  choices?: { points: number; isCorrect: boolean }[];  // #13: for difficulty classification
}

export function QuestionHeader({ category, context, question, choices }: QuestionHeaderProps) {
  const Icon = categoryIcons[category] || ShoppingBag;
  const difficulty = choices ? classifyDifficulty(choices) : null;
  const diffConfig = difficulty ? difficultyConfig[difficulty] : null;

  return (
    // #2: Category ambient glow wrapper
    <div
      className="category-glow grid grid-rows-[auto_auto] gap-3"
      style={{ "--category-glow-color": categoryGlowColors[category] } as React.CSSProperties}
    >
      {/* Zone A: Context — category + scenario setup */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-2.5"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={cn("border", categoryColors[category])}
            data-testid={`category-badge-${category}`}
          >
            <Icon className="w-3 h-3 mr-1.5" />
            <span className="capitalize">{category}</span>
          </Badge>
          {/* #13: Difficulty indicator */}
          {diffConfig && (
            <Badge
              variant="outline"
              className={cn("border text-[10px] px-1.5 py-0", diffConfig.className)}
              data-testid="difficulty-badge"
            >
              {diffConfig.label}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground/60 italic" data-testid="text-context-buffer">
            {getContextBuffer(category)}
          </span>
        </div>

        {context && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="px-3.5 py-2.5 rounded-md bg-muted/40 border border-border/40 text-[13px] text-muted-foreground leading-relaxed tracking-wide"
            data-testid="question-context"
          >
            {context}
          </motion.div>
        )}
      </motion.div>

      {/* Zone B: Question — visually dominant */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Card className="px-5 py-5" data-testid="question-panel">
          <h2
            className="text-[1.2rem] sm:text-[1.4rem] md:text-[1.55rem] font-semibold tracking-[-0.01em] leading-[1.4] text-foreground"
            data-testid="question-text"
          >
            {question}
          </h2>
        </Card>
      </motion.div>
    </div>
  );
}
