import { motion } from "framer-motion";
import { Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LifelineButtonProps {
  used: boolean;
  onUse: () => void;
  disabled?: boolean;
}

export function LifelineButton({ used, onUse, disabled = false }: LifelineButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 20 }}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onUse}
        disabled={used || disabled}
        className={cn(
          "gap-1.5 text-xs font-semibold transition-all",
          used
            ? "opacity-40 cursor-not-allowed line-through"
            : "hover:bg-primary/5 hover:border-primary/30"
        )}
        data-testid="lifeline-button"
      >
        <Scissors className="w-3.5 h-3.5" />
        <span>50/50</span>
        {used && (
          <span className="text-[10px] text-muted-foreground ml-0.5">(Used)</span>
        )}
      </Button>
    </motion.div>
  );
}
