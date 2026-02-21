import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Bot } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface CleoAnalysisProps {
  score: number;
  totalQuestions: number;
  moneyHealth: number;
}

export function CleoAnalysis({ score, totalQuestions, moneyHealth }: CleoAnalysisProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const typewriterRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Typewriter effect
  useEffect(() => {
    if (!analysis) return;

    let idx = 0;
    setDisplayedText("");

    typewriterRef.current = setInterval(() => {
      idx++;
      setDisplayedText(analysis.slice(0, idx));
      if (idx >= analysis.length) {
        if (typewriterRef.current) clearInterval(typewriterRef.current);
      }
    }, 20);

    return () => {
      if (typewriterRef.current) clearInterval(typewriterRef.current);
    };
  }, [analysis]);

  const handleGetAnalysis = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await apiRequest("POST", "/api/cleo-analysis", {
        score,
        totalQuestions,
        moneyHealth,
      });
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3" data-testid="cleo-analysis">
      <AnimatePresence mode="wait">
        {!analysis && !loading && (
          <motion.div
            key="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Button
              onClick={handleGetAnalysis}
              variant="outline"
              className="w-full gap-2 border-primary/30 hover:bg-primary/5"
              data-testid="btn-cleo-analysis"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              Get Cleo's Analysis
            </Button>
            {error && (
              <p className="text-xs text-destructive text-center mt-2">
                Cleo is unavailable right now. Try again later.
              </p>
            )}
          </motion.div>
        )}

        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-4"
          >
            <Bot className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Cleo is thinking...</span>
          </motion.div>
        )}

        {analysis && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-primary/20 bg-primary/5 p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-primary mb-1">Cleo's Take</p>
                <p className="text-sm text-foreground leading-relaxed">{displayedText}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
