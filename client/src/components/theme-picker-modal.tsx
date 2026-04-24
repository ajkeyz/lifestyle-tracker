import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { THEMES, type ThemeId } from "@shared/lib/themes";
import { useTheme } from "@/hooks/use-theme";
import {
  TrendingUp,
  Home,
  ShoppingBag,
  CreditCard,
  ShieldAlert,
  Users,
  Check,
  Loader2,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp,
  Home,
  ShoppingBag,
  CreditCard,
  ShieldAlert,
  Users,
};

interface ThemePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When true, the modal can't be dismissed without picking */
  required?: boolean;
  onPicked?: (theme: ThemeId) => void;
}

export function ThemePickerModal({ open, onOpenChange, required, onPicked }: ThemePickerModalProps) {
  const { current, setTheme, isPending } = useTheme();
  const [selecting, setSelecting] = useState<ThemeId | null>(null);

  const handlePick = async (theme: ThemeId) => {
    setSelecting(theme);
    try {
      await setTheme(theme);
      onPicked?.(theme);
      onOpenChange(false);
    } finally {
      setSelecting(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (required && !o) return; // can't close in required mode
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" data-testid="theme-picker-modal">
        <DialogHeader>
          <DialogTitle>{current ? "Change this week's theme" : "Pick this week's theme"}</DialogTitle>
          <DialogDescription>
            Your daily drops and arcade games will all focus on this topic until next Monday.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 mt-2">
          {THEMES.map((theme, i) => {
            const Icon = ICON_MAP[theme.icon] ?? ShoppingBag;
            const isCurrent = current === theme.id;
            const isLoading = isPending && selecting === theme.id;

            return (
              <motion.button
                key={theme.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePick(theme.id)}
                disabled={isPending}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                  "hover:border-primary/40 hover:bg-primary/5",
                  isCurrent ? "border-primary bg-primary/10" : "border-border/40 bg-card/50",
                  isPending && !isLoading && "opacity-50",
                )}
                data-testid={`theme-option-${theme.id}`}
              >
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", theme.gradient)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{theme.label}</span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{theme.description}</p>
                </div>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                ) : isCurrent ? (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                ) : null}
              </motion.button>
            );
          })}
        </div>

        {!required && (
          <div className="flex justify-end pt-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
