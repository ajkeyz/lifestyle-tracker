import { cn } from "@/lib/utils";
import { modeGradients } from "@/lib/motion-tokens";

interface GradientStripeProps {
  variant?: keyof typeof modeGradients;
  position?: "top" | "bottom";
  className?: string;
}

/**
 * Thin gradient accent bar for card headers.
 * Place inside a `relative` parent at top or bottom edge.
 *
 * @example
 * <Card className="relative overflow-hidden">
 *   <GradientStripe variant="survival" />
 *   ...
 * </Card>
 */
export function GradientStripe({
  variant = "primary",
  position = "top",
  className,
}: GradientStripeProps) {
  return (
    <div
      className={cn(
        "absolute inset-x-0 h-1 bg-gradient-to-r",
        modeGradients[variant],
        position === "top" ? "top-0 rounded-t-xl" : "bottom-0 rounded-b-xl",
        className
      )}
      aria-hidden="true"
    />
  );
}
