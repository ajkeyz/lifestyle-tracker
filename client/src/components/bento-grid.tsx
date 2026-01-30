import { cn } from "@/lib/utils";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 auto-rows-[minmax(120px,auto)]",
        "md:grid-cols-4 md:gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4;
  rowSpan?: 1 | 2 | 3;
  variant?: "default" | "gradient" | "glass" | "outlined";
  interactive?: boolean;
  onClick?: () => void;
  "data-testid"?: string;
}

export function BentoCard({
  children,
  className,
  colSpan = 1,
  rowSpan = 1,
  variant = "default",
  interactive = false,
  onClick,
  "data-testid": testId,
}: BentoCardProps) {
  const colSpanClasses = {
    1: "col-span-1",
    2: "col-span-2",
    3: "col-span-2 md:col-span-3",
    4: "col-span-2 md:col-span-4",
  };

  const rowSpanClasses = {
    1: "row-span-1",
    2: "row-span-2",
    3: "row-span-3",
  };

  const variantClasses = {
    default: "bg-card border",
    gradient: "bg-gradient-to-br from-primary/10 via-background to-accent/10 border",
    glass: "bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10",
    outlined: "bg-transparent border-2 border-dashed border-muted-foreground/20",
  };

  return (
    <div
      className={cn(
        "rounded-xl p-4 overflow-visible",
        colSpanClasses[colSpan],
        rowSpanClasses[rowSpan],
        variantClasses[variant],
        interactive && "cursor-pointer hover-elevate active-elevate-2",
        className
      )}
      onClick={onClick}
      data-testid={testId}
    >
      {children}
    </div>
  );
}

interface BentoHeroCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  gradient?: string;
  className?: string;
  "data-testid"?: string;
}

export function BentoHeroCard({
  title,
  subtitle,
  icon,
  action,
  gradient = "from-primary to-accent",
  className,
  "data-testid": testId,
}: BentoHeroCardProps) {
  return (
    <BentoCard
      colSpan={2}
      rowSpan={2}
      className={cn("relative overflow-visible", className)}
      data-testid={testId}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-10",
          gradient
        )}
      />
      <div className="relative z-10 h-full flex flex-col">
        {icon && (
          <div className="mb-4">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
          {subtitle && (
            <p className="text-muted-foreground text-sm md:text-base">{subtitle}</p>
          )}
        </div>
        {action && <div className="mt-auto pt-4">{action}</div>}
      </div>
    </BentoCard>
  );
}

interface BentoStatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  "data-testid"?: string;
}

export function BentoStatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  className,
  "data-testid": testId,
}: BentoStatCardProps) {
  const trendColors = {
    up: "text-emerald-500 dark:text-emerald-400",
    down: "text-red-500 dark:text-red-400",
    neutral: "text-muted-foreground",
  };

  return (
    <BentoCard className={cn("flex flex-col", className)} data-testid={testId}>
      <div className="flex items-start justify-between gap-2 mb-auto">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-2">
        <p className="text-2xl md:text-3xl font-bold">
          {value}
        </p>
        {trend && trendValue && (
          <p className={cn("text-xs mt-1", trendColors[trend])}>
            {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
          </p>
        )}
      </div>
    </BentoCard>
  );
}

interface BentoActionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  onClick?: () => void;
  className?: string;
  "data-testid"?: string;
}

export function BentoActionCard({
  title,
  description,
  icon,
  iconBg = "bg-primary/10",
  onClick,
  className,
  "data-testid": testId,
}: BentoActionCardProps) {
  return (
    <BentoCard
      interactive
      onClick={onClick}
      className={cn("flex flex-col", className)}
      data-testid={testId}
    >
      {icon && (
        <div
          className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
            iconBg
          )}
        >
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-sm md:text-base">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {description}
        </p>
      )}
    </BentoCard>
  );
}

interface BentoFeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  gradient?: string;
  onClick?: () => void;
  className?: string;
  "data-testid"?: string;
}

export function BentoFeatureCard({
  title,
  description,
  icon,
  gradient = "from-primary/20 to-accent/20",
  onClick,
  className,
  "data-testid": testId,
}: BentoFeatureCardProps) {
  return (
    <BentoCard
      colSpan={2}
      interactive={!!onClick}
      onClick={onClick}
      variant="gradient"
      className={className}
      data-testid={testId}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </div>
    </BentoCard>
  );
}
