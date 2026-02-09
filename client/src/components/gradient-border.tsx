import { cn } from "@/lib/utils";
import { ReactNode } from "react";

/**
 * GradientBorder Component
 *
 * Wraps content with an animated gradient border
 * Perfect for premium features and CTAs
 */

interface GradientBorderProps {
  children: ReactNode;
  className?: string;
  animated?: boolean;
  colors?: "primary" | "premium" | "accent";
  borderWidth?: "thin" | "normal" | "thick";
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
}

export function GradientBorder({
  children,
  className,
  animated = false,
  colors = "primary",
  borderWidth = "normal",
  rounded = "xl",
}: GradientBorderProps) {
  const colorClasses = {
    primary: "from-primary via-primary/50 to-primary",
    premium: "from-purple-500 via-pink-500 to-orange-500",
    accent: "from-accent via-accent/50 to-accent",
  };

  const borderWidthClasses = {
    thin: "p-[1px]",
    normal: "p-[2px]",
    thick: "p-[3px]",
  };

  const roundedClasses = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    full: "rounded-full",
  };

  if (animated) {
    return (
      <div className={cn("relative", roundedClasses[rounded], className)}>
        {/* Animated rotating gradient */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-r animate-spin",
            colorClasses[colors],
            roundedClasses[rounded]
          )}
          style={{
            animationDuration: "3s",
            background: `conic-gradient(
              from 0deg,
              hsl(var(--primary)),
              hsl(var(--accent)),
              hsl(var(--primary))
            )`,
          }}
        />
        {/* Inner content */}
        <div
          className={cn(
            "relative bg-card",
            roundedClasses[rounded],
            "m-[2px]" // Creates border effect
          )}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative bg-gradient-to-br",
        colorClasses[colors],
        borderWidthClasses[borderWidth],
        roundedClasses[rounded],
        className
      )}
    >
      <div className={cn("bg-card", roundedClasses[rounded], "h-full w-full")}>
        {children}
      </div>
    </div>
  );
}
