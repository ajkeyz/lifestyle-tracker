import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";
import { useHaptic } from "@/hooks/use-haptic";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { vibrateLight } = useHaptic();

  const handleToggle = () => {
    vibrateLight();
    toggleTheme();
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      data-testid="button-theme-toggle"
      className="relative overflow-visible"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === "light" ? (
          <motion.div
            key="moon"
            initial={{ scale: 0, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <Moon className="h-5 w-5" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ scale: 0, rotate: 90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <Sun className="h-5 w-5 text-yellow-500" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
