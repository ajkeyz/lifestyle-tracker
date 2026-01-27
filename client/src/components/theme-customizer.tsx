import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Check, Palette } from "lucide-react";
import { useState, useEffect, createContext, useContext } from "react";
import { useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

type ThemeColor = "emerald" | "blue" | "purple" | "rose" | "orange" | "cyan";

interface ColorContextType {
  color: ThemeColor;
  setColor: (color: ThemeColor) => void;
}

const ColorContext = createContext<ColorContextType | null>(null);

const colorThemes: Record<ThemeColor, { primary: string; label: string }> = {
  emerald: { primary: "142 76% 36%", label: "Emerald" },
  blue: { primary: "217 91% 60%", label: "Blue" },
  purple: { primary: "270 76% 55%", label: "Purple" },
  rose: { primary: "347 77% 50%", label: "Rose" },
  orange: { primary: "24 95% 53%", label: "Orange" },
  cyan: { primary: "186 94% 41%", label: "Cyan" }
};

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [color, setColorState] = useState<ThemeColor>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme-color") as ThemeColor) || "emerald";
    }
    return "emerald";
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", colorThemes[color].primary);
    localStorage.setItem("theme-color", color);
  }, [color]);

  const setColor = (newColor: ThemeColor) => {
    setColorState(newColor);
  };

  return (
    <ColorContext.Provider value={{ color, setColor }}>
      {children}
    </ColorContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorContext);
  if (!context) {
    return {
      color: "emerald" as ThemeColor,
      setColor: () => {}
    };
  }
  return context;
}

interface ThemeCustomizerProps {
  className?: string;
}

export function ThemeCustomizer({ className }: ThemeCustomizerProps) {
  const { color, setColor } = useColorTheme();

  return (
    <Card className={cn("p-4", className)} data-testid="card-theme-customizer">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">Theme</span>
        </div>

        <ThemeToggle />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(colorThemes) as ThemeColor[]).map((themeColor) => (
          <button
            key={themeColor}
            onClick={() => setColor(themeColor)}
            className={cn(
              "relative p-3 rounded-lg border-2 transition-colors hover-elevate",
              color === themeColor ? "border-primary" : "border-transparent"
            )}
            style={{
              backgroundColor: `hsl(${colorThemes[themeColor].primary} / 0.1)`
            }}
            data-testid={`button-theme-color-${themeColor}`}
          >
            <div
              className="w-8 h-8 rounded-full mx-auto"
              style={{
                backgroundColor: `hsl(${colorThemes[themeColor].primary})`
              }}
            />
            <span className="text-xs mt-1 block">{colorThemes[themeColor].label}</span>

            {color === themeColor && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1"
              >
                <Check className="w-4 h-4 text-primary" />
              </motion.div>
            )}
          </button>
        ))}
      </div>
    </Card>
  );
}
