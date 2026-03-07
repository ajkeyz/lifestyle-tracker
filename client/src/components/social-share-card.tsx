import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Share2,
  Instagram,
  Twitter,
  Copy,
  Check,
  Download,
  Flame,
  Heart,
  Trophy,
  Sparkles,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import { trackShareClicked } from "@/lib/analytics";
import { toPng } from "html-to-image";

interface SocialShareCardProps {
  user: User;
  score?: number;
  dropNumber?: number;
  trigger?: React.ReactNode;
}

export function SocialShareCard({ user, score, dropNumber, trigger }: SocialShareCardProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const shareUrl = `https://lifestyle-tracker.app?ref=${user.username}`;

  const twitterText = score
    ? `Just scored ${score}/500 on @LifestyleCreep! 🎯\n\n💰 Money Health: ${user.moneyHealth}/100\n🔥 Streak: ${user.streak} days\n\nCan you beat my score? ${shareUrl}`
    : `I'm on a ${user.streak} day streak in @LifestyleCreep! 🔥\n\n💰 Money Health: ${user.moneyHealth}/100\n🏆 ${user.gamesPlayed} games played\n\nJoin me: ${shareUrl}`;

  const instagramText = score
    ? `I scored ${score}/500 on Lifestyle Creep! 🎯\n\nMoney Health: ${user.moneyHealth}/100\nStreak: ${user.streak} days 🔥\n\nBeat my score!\n\n#LifestyleCreep #MoneySmarts #FinancialLiteracy`
    : `${user.streak} day streak on Lifestyle Creep! 🔥\n\nMoney Health: ${user.moneyHealth}/100\n\nJoin the challenge!\n\n#LifestyleCreep #MoneyGoals #FinancialFreedom`;

  const copyToClipboard = (text: string, platform: "instagram" | "generic") => {
    trackShareClicked(
      score ? "results" : "streak",
      "copy_link",
      "text",
      {
        score_value: score,
        streak_value: user.streak,
        platform,
      }
    );
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copied to clipboard!", description: "Ready to paste." });
  };

  const shareToTwitter = () => {
    trackShareClicked(
      score ? "results" : "streak",
      "twitter",
      "text",
      {
        score_value: score,
        streak_value: user.streak,
      }
    );
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const downloadCard = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--background')?.trim()
          ? undefined
          : '#0a0a0a',
      });
      const link = document.createElement("a");
      link.download = `lifestyle-creep-${score ? `score-${score}` : `streak-${user.streak}`}.png`;
      link.href = dataUrl;
      link.click();
      trackShareClicked(
        score ? "results" : "streak",
        "download",
        "image",
        { score_value: score, streak_value: user.streak }
      );
      toast({ title: "Card downloaded!", description: "Ready to share anywhere." });
    } catch (err) {
      console.error("Download card failed:", err);
      toast({ title: "Download failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  }, [score, user.streak, toast]);

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Share2 className="w-4 h-4" />
            Share
          </Button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Your Progress
            </DialogTitle>
            <DialogDescription>
              Show off your money smarts on social media
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preview Card */}
            <Card ref={cardRef} className="p-4 bg-gradient-to-br from-primary/10 via-accent/5 to-background border-primary/20 overflow-hidden relative">
              {/* Decorative sparkles */}
              <div className="absolute top-2 right-2">
                <Sparkles className="w-4 h-4 text-yellow-500 opacity-50" />
              </div>
              <div className="absolute bottom-2 left-2">
                <Sparkles className="w-3 h-3 text-primary opacity-30" />
              </div>

              <div className="text-center space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Lifestyle Creep
                  </div>
                  {score ? (
                    <>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", delay: 0.1 }}
                        className="text-3xl font-bold text-primary mb-1"
                      >
                        {score}/500
                      </motion.div>
                      <div className="text-sm text-muted-foreground">
                        Daily Drop #{dropNumber}
                      </div>
                    </>
                  ) : (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", delay: 0.1 }}
                      className="text-3xl font-bold text-primary"
                    >
                      {user.streak} Day Streak 🔥
                    </motion.div>
                  )}
                </div>

                <div className="flex justify-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4 text-green-500" />
                    <span className="font-semibold">{user.moneyHealth}</span>
                    <span className="text-xs text-muted-foreground">Health</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="font-semibold">{user.streak}</span>
                    <span className="text-xs text-muted-foreground">Streak</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold">{user.gamesPlayed}</span>
                    <span className="text-xs text-muted-foreground">Games</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Can you beat my score?
                  </p>
                </div>
              </div>
            </Card>

            {/* Share Buttons */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={shareToTwitter}
              >
                <Twitter className="w-4 h-4" />
                Share on Twitter
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => copyToClipboard(instagramText, "instagram")}
              >
                <Instagram className="w-4 h-4" />
                Copy for Instagram
                {copied && <Check className="w-4 h-4 ml-auto text-green-500" />}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => copyToClipboard(twitterText, "generic")}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Text
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={downloadCard}
                disabled={downloading}
                data-testid="button-download-card"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {downloading ? "Generating..." : "Download Card"}
              </Button>
            </div>

            {/* Preview Text */}
            <Card className="p-3 bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">
                Preview:
              </div>
              <div className="text-sm whitespace-pre-line font-mono">
                {twitterText}
              </div>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
