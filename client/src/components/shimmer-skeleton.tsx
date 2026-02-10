import { cn } from "@/lib/utils";

interface ShimmerSkeletonProps {
  className?: string;
  variant?: "default" | "card" | "avatar" | "text" | "button";
  animate?: boolean;
}

export function ShimmerSkeleton({
  className,
  variant = "default",
  animate = true,
}: ShimmerSkeletonProps) {
  const baseClasses = "relative overflow-hidden bg-muted rounded-md";
  
  const variantClasses = {
    default: "",
    card: "rounded-xl",
    avatar: "rounded-full",
    text: "rounded h-4",
    button: "rounded-md h-10",
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {animate && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-foreground/10 dark:via-foreground/20 to-transparent" />
      )}
    </div>
  );
}

interface ShimmerCardProps {
  className?: string;
  lines?: number;
  hasAvatar?: boolean;
  hasImage?: boolean;
}

export function ShimmerCard({
  className,
  lines = 3,
  hasAvatar = false,
  hasImage = false,
}: ShimmerCardProps) {
  return (
    <div className={cn("rounded-xl border bg-card p-4 space-y-4", className)}>
      {hasImage && (
        <ShimmerSkeleton className="w-full h-32 rounded-lg" />
      )}
      
      {hasAvatar && (
        <div className="flex items-center gap-3">
          <ShimmerSkeleton variant="avatar" className="w-10 h-10" />
          <div className="flex-1 space-y-2">
            <ShimmerSkeleton variant="text" className="w-24" />
            <ShimmerSkeleton variant="text" className="w-16 h-3" />
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <ShimmerSkeleton
            key={i}
            variant="text"
            className={cn(
              i === lines - 1 ? "w-2/3" : "w-full"
            )}
          />
        ))}
      </div>
    </div>
  );
}

interface ShimmerListProps {
  count?: number;
  className?: string;
  itemClassName?: string;
}

export function ShimmerList({
  count = 5,
  className,
  itemClassName,
}: ShimmerListProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg bg-muted/30",
            itemClassName
          )}
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <ShimmerSkeleton variant="avatar" className="w-10 h-10" />
          <div className="flex-1 space-y-2">
            <ShimmerSkeleton variant="text" className="w-32" />
            <ShimmerSkeleton variant="text" className="w-20 h-3" />
          </div>
          <ShimmerSkeleton className="w-12 h-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}

interface ShimmerStatsProps {
  count?: number;
  className?: string;
}

export function ShimmerStats({
  count = 4,
  className,
}: ShimmerStatsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border bg-card space-y-2"
        >
          <ShimmerSkeleton className="w-8 h-8 rounded-lg" />
          <ShimmerSkeleton variant="text" className="w-12 h-6" />
          <ShimmerSkeleton variant="text" className="w-16 h-3" />
        </div>
      ))}
    </div>
  );
}

interface ShimmerGameCardProps {
  className?: string;
}

export function ShimmerGameCard({ className }: ShimmerGameCardProps) {
  return (
    <div className={cn("rounded-xl border bg-card overflow-hidden", className)}>
      <div className="h-2 bg-muted" />
      <div className="p-6 space-y-6">
        <div className="space-y-3">
          <ShimmerSkeleton variant="text" className="w-20 h-3" />
          <ShimmerSkeleton variant="text" className="w-full h-5" />
          <ShimmerSkeleton variant="text" className="w-3/4 h-5" />
        </div>
        
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <ShimmerSkeleton
              key={i}
              variant="button"
              className="w-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
