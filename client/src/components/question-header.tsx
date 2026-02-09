import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ScenarioCategory } from "@shared/schema";
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

interface QuestionHeaderProps {
  category: ScenarioCategory;
  context: string;
  question: string;
}

export function QuestionHeader({ category, context, question }: QuestionHeaderProps) {
  const Icon = categoryIcons[category] || ShoppingBag;

  return (
    <div className="space-y-4">
      {/* Category Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Badge
          variant="outline"
          className={cn("border", categoryColors[category])}
          data-testid={`category-badge-${category}`}
        >
          <Icon className="w-3 h-3 mr-1.5" />
          <span className="capitalize">{category}</span>
        </Badge>
      </motion.div>

      {/* Context Card */}
      {context && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className={cn(
            "p-4 rounded-lg border bg-muted/50 backdrop-blur-sm",
            "text-sm text-muted-foreground leading-relaxed"
          )}
          data-testid="question-context"
        >
          {context}
        </motion.div>
      )}

      {/* Main Question */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className={cn(
          "text-2xl md:text-3xl font-display font-bold tracking-tight",
          "leading-tight text-foreground"
        )}
        data-testid="question-text"
      >
        {question}
      </motion.h2>
    </div>
  );
}
