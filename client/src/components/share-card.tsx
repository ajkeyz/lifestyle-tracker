import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, Brain, Heart, Flame } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { StatBarGrid } from "./stat-bar";
import { RollingNumber } from "./animated-progress";
import { TiltCard } from "@/components/ui/tilt-card";
import type { UserGameResult } from "@shared/schema";

interface ShareCardProps {
  dropNumber: number;
  result: UserGameResult;
  answers: boolean[];
  streak: number;
}

export function ShareCard({ dropNumber, result, answers, streak }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const generateShareText = () => {
    const correctCount = answers.filter(Boolean).length;
    const squares = answers
      .map((correct) => (correct ? "[+]" : "[x]"))
      .join(" ");
    
    return `Lifestyle Creep #${dropNumber}
IQ: ${result.iq}/500
Money Health: ${result.moneyHealth}/100
Streak: ${streak} days
${squares}
Score: ${correctCount}/${answers.length}

Play at: lifestyle-creep.replit.app`;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Lifestyle Creep",
        text: generateShareText(),
      });
    } else {
      handleCopy();
    }
  };

  return (
    <TiltCard tiltAmount={8} glareEnabled={true} scale={1.01}>
      <Card className="p-6 bg-gradient-to-br from-card to-muted/30 border-2 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4)]" data-testid="card-share-results">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold" data-testid="text-drop-number">Lifestyle Creep #{dropNumber}</h2>
        <p className="text-muted-foreground text-sm">Daily Drop Complete</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <motion.div 
          className="space-y-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div 
            className="flex justify-center mb-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <Brain className="w-5 h-5 text-primary" />
          </motion.div>
          <div data-testid="text-iq-score">
            <RollingNumber value={result.iq} size="sm" color="primary" />
          </div>
          <div className="text-xs text-muted-foreground">IQ Score</div>
        </motion.div>
        <motion.div 
          className="space-y-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="flex justify-center mb-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.3 }}
          >
            <Heart className="w-5 h-5 text-accent" />
          </motion.div>
          <div data-testid="text-money-health">
            <RollingNumber value={result.moneyHealth} size="sm" color="accent" />
          </div>
          <div className="text-xs text-muted-foreground">Money Health</div>
        </motion.div>
        <motion.div 
          className="space-y-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div 
            className="flex justify-center mb-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.4 }}
          >
            <Flame className="w-5 h-5 text-destructive" />
          </motion.div>
          <div data-testid="text-streak">
            <RollingNumber value={streak} size="sm" color="destructive" />
          </div>
          <div className="text-xs text-muted-foreground">Streak</div>
        </motion.div>
      </div>

      <div className="flex justify-center gap-1.5 mb-6" data-testid="answers-grid">
        {answers.map((correct, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              delay: 0.4 + i * 0.1 
            }}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shadow-md ${
              correct
                ? "bg-primary text-primary-foreground"
                : "bg-destructive text-destructive-foreground"
            }`}
            data-testid={`answer-result-${i}`}
          >
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              {correct ? "+" : "-"}
            </motion.span>
          </motion.div>
        ))}
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-3">Your Stats</h3>
        <StatBarGrid {...result.stats} />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleCopy}
          variant="outline"
          className="flex-1"
          data-testid="button-copy-results"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </>
          )}
        </Button>
        <Button
          onClick={handleShare}
          className="flex-1"
          data-testid="button-share-results"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>
    </Card>
    </TiltCard>
  );
}
