import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface DidYouKnowCardProps {
  fact: string;
}

export function DidYouKnowCard({ fact }: DidYouKnowCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20, delay: 2.0 }}
      className="px-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10"
      data-testid="did-you-know-card"
    >
      <div className="flex items-start gap-2.5">
        <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Did you know?</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{fact}</p>
        </div>
      </div>
    </motion.div>
  );
}
