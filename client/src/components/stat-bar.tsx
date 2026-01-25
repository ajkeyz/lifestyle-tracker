import { cn } from "@/lib/utils";

interface StatBarProps {
  value: number;
  max: number;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
  showLabel?: boolean;
  label?: string;
  size?: "sm" | "md";
}

const variantColors = {
  success: "bg-primary",
  warning: "bg-accent",
  danger: "bg-destructive",
  info: "bg-chart-4",
  neutral: "bg-muted-foreground/50",
};

export function StatBar({
  value,
  max,
  variant = "neutral",
  showLabel = false,
  label,
  size = "md",
}: StatBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="w-full">
      {showLabel && label && (
        <div className="flex justify-between items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-xs font-medium">{value}</span>
        </div>
      )}
      <div
        className={cn(
          "w-full bg-muted rounded-full overflow-hidden",
          size === "sm" ? "h-1.5" : "h-2"
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variantColors[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function StatBarGrid({
  cash,
  debt,
  credit,
  stress,
  investment,
}: {
  cash: number;
  debt: number;
  credit: number;
  stress: number;
  investment: number;
}) {
  return (
    <div className="space-y-2" data-testid="stat-bar-grid">
      <div className="flex items-center gap-2">
        <span className="w-16 text-xs" data-testid="label-stat-cash">Cash</span>
        <StatBar value={cash} max={10000} variant="success" size="sm" />
        <span className="w-12 text-xs text-right" data-testid="value-stat-cash">${Math.round(cash)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-16 text-xs" data-testid="label-stat-debt">Debt</span>
        <StatBar value={debt} max={5000} variant="danger" size="sm" />
        <span className="w-12 text-xs text-right" data-testid="value-stat-debt">${Math.round(debt)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-16 text-xs" data-testid="label-stat-credit">Credit</span>
        <StatBar value={credit} max={850} variant="info" size="sm" />
        <span className="w-12 text-xs text-right" data-testid="value-stat-credit">{Math.round(credit)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-16 text-xs" data-testid="label-stat-stress">Stress</span>
        <StatBar value={stress} max={100} variant="warning" size="sm" />
        <span className="w-12 text-xs text-right" data-testid="value-stat-stress">{Math.round(stress)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-16 text-xs" data-testid="label-stat-invest">Invest</span>
        <StatBar value={investment} max={50000} variant="success" size="sm" />
        <span className="w-12 text-xs text-right" data-testid="value-stat-invest">${Math.round(investment)}</span>
      </div>
    </div>
  );
}
