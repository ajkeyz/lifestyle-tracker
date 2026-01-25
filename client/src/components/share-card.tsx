import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check, Brain, Heart, Flame } from "lucide-react";
import { useState } from "react";
import { StatBarGrid } from "./stat-bar";
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
    <Card className="p-6 bg-gradient-to-br from-card to-muted/30 border-2" data-testid="card-share-results">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold" data-testid="text-drop-number">Lifestyle Creep #{dropNumber}</h2>
        <p className="text-muted-foreground text-sm">Daily Drop Complete</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div className="space-y-1">
          <div className="flex justify-center mb-1">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-primary" data-testid="text-iq-score">{result.iq}</div>
          <div className="text-xs text-muted-foreground">IQ Score</div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-center mb-1">
            <Heart className="w-4 h-4 text-accent" />
          </div>
          <div className="text-2xl font-bold text-accent" data-testid="text-money-health">{result.moneyHealth}</div>
          <div className="text-xs text-muted-foreground">Money Health</div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-center mb-1">
            <Flame className="w-4 h-4 text-destructive" />
          </div>
          <div className="text-2xl font-bold text-destructive" data-testid="text-streak">{streak}</div>
          <div className="text-xs text-muted-foreground">Streak</div>
        </div>
      </div>

      <div className="flex justify-center gap-1 mb-6" data-testid="answers-grid">
        {answers.map((correct, i) => (
          <div
            key={i}
            className={`w-10 h-10 rounded-md flex items-center justify-center text-lg font-bold ${
              correct
                ? "bg-primary text-primary-foreground"
                : "bg-destructive text-destructive-foreground"
            }`}
            data-testid={`answer-result-${i}`}
          >
            {correct ? "+" : "-"}
          </div>
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
  );
}
