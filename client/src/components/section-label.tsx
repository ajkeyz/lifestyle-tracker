import { cn } from "@/lib/utils";

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
  /** Show a horizontal divider line extending from the label */
  withDivider?: boolean;
}

/**
 * Small uppercase tracking label for separating page sections.
 * Consistent typography across all pages.
 *
 * @example
 * <SectionLabel>Your Stats</SectionLabel>
 * <SectionLabel withDivider>Choose Your Battle</SectionLabel>
 */
export function SectionLabel({ children, className, withDivider = false }: SectionLabelProps) {
  if (withDivider) {
    return (
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] shrink-0",
            className
          )}
        >
          {children}
        </span>
        <div className="h-px flex-1 bg-border/50" />
      </div>
    );
  }

  return (
    <p
      className={cn(
        "text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] px-0.5",
        className
      )}
    >
      {children}
    </p>
  );
}
