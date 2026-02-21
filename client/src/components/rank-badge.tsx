import { cn } from "@/lib/utils";
import { Shield, Crown, Gem, Star, Zap } from "lucide-react";

type Tier = "bronze" | "silver" | "gold" | "diamond" | "obsidian";

interface TierConfig {
  name: string;
  icon: typeof Shield;
  minHealth: number;
  color: string;
  bg: string;
  border: string;
  glow?: string;
}

const tiers: Record<Tier, TierConfig> = {
  bronze: {
    name: "Bronze",
    icon: Shield,
    minHealth: 0,
    color: "text-amber-700 dark:text-amber-600",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-300 dark:border-amber-700",
  },
  silver: {
    name: "Silver",
    icon: Star,
    minHealth: 30,
    color: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800/40",
    border: "border-slate-300 dark:border-slate-600",
  },
  gold: {
    name: "Gold",
    icon: Crown,
    minHealth: 55,
    color: "text-yellow-600 dark:text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/25",
    border: "border-yellow-400 dark:border-yellow-600",
    glow: "shadow-yellow-400/20",
  },
  diamond: {
    name: "Diamond",
    icon: Gem,
    minHealth: 75,
    color: "text-cyan-500 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-900/25",
    border: "border-cyan-400 dark:border-cyan-500",
    glow: "shadow-cyan-400/20",
  },
  obsidian: {
    name: "Obsidian",
    icon: Zap,
    minHealth: 90,
    color: "text-purple-500 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/25",
    border: "border-purple-400 dark:border-purple-500",
    glow: "shadow-purple-400/30",
  },
};

const tierOrder: Tier[] = ["bronze", "silver", "gold", "diamond", "obsidian"];

export function getRankTier(moneyHealth: number): Tier {
  if (moneyHealth >= 90) return "obsidian";
  if (moneyHealth >= 75) return "diamond";
  if (moneyHealth >= 55) return "gold";
  if (moneyHealth >= 30) return "silver";
  return "bronze";
}

function getNextTier(current: Tier): Tier | null {
  const idx = tierOrder.indexOf(current);
  return idx < tierOrder.length - 1 ? tierOrder[idx + 1] : null;
}

interface RankBadgeProps {
  moneyHealth: number;
  size?: "sm" | "md";
  className?: string;
}

export function RankBadge({ moneyHealth, size = "sm", className }: RankBadgeProps) {
  const tier = getRankTier(moneyHealth);
  const config = tiers[tier];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        config.bg,
        config.border,
        config.color,
        config.glow && `shadow-sm ${config.glow}`,
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
        className
      )}
      title={`${config.name} Tier`}
      data-testid="rank-badge"
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {size === "md" && config.name}
    </span>
  );
}

interface TierProgressBarProps {
  moneyHealth: number;
  className?: string;
}

export function TierProgressBar({ moneyHealth, className }: TierProgressBarProps) {
  const currentTier = getRankTier(moneyHealth);
  const currentConfig = tiers[currentTier];
  const nextTier = getNextTier(currentTier);

  if (!nextTier) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400"
            style={{ width: "100%" }}
          />
        </div>
        <span className="text-[10px] text-purple-400 font-medium">Max Tier</span>
      </div>
    );
  }

  const nextConfig = tiers[nextTier];
  const progress = ((moneyHealth - currentConfig.minHealth) / (nextConfig.minHealth - currentConfig.minHealth)) * 100;

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", {
            "bg-amber-500": currentTier === "bronze",
            "bg-slate-400": currentTier === "silver",
            "bg-yellow-500": currentTier === "gold",
            "bg-cyan-400": currentTier === "diamond",
          })}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <span className="text-[10px] whitespace-nowrap">
        {Math.round(nextConfig.minHealth - moneyHealth)} to {nextConfig.name}
      </span>
    </div>
  );
}
