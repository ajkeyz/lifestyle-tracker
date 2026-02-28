import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Gift, Copy, Check, UserPlus, Snowflake } from "lucide-react";
import type { User } from "@shared/schema";

export function ReferralCard() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [referralInput, setReferralInput] = useState("");

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const applyReferralMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/apply-referral", { referralCode: code });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Referral applied!",
        description: "You and your friend both received a free freeze token!",
      });
      setReferralInput("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to apply referral code.",
        variant: "destructive",
      });
    },
  });

  const handleCopyCode = async () => {
    if (!user?.referralCode) return;
    
    try {
      await navigator.clipboard.writeText(user.referralCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Share this code with friends to earn free freeze tokens.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the code manually.",
        variant: "destructive",
      });
    }
  };

  const handleShareReferral = async () => {
    if (!user?.referralCode) return;
    
    const shareText = `Join me on Lifestyle Creep - the daily money game! Use my referral code ${user.referralCode} to get a free streak freeze token. Play now!`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        await navigator.clipboard.writeText(shareText);
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Link copied!",
        description: "Share it with your friends.",
      });
    }
  };

  if (!user) return null;

  return (
    <Card className="p-4" data-testid="referral-card">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="w-5 h-5 text-primary" />
        <h3 className="font-semibold tracking-[-0.02em]">Invite Friends</h3>
        {user.referralCount > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {user.referralCount} invited
          </Badge>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">
        Share your code. Both you and your friend get a free freeze token!
      </p>

      {/* Your referral code */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 p-3 bg-muted/50 rounded-lg font-mono text-lg font-bold text-center tracking-wider">
          {user.referralCode}
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={handleCopyCode}
          data-testid="button-copy-code"
        >
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>

      <Button
        className="w-full gap-2 mb-4"
        onClick={handleShareReferral}
        data-testid="button-share-referral"
      >
        <UserPlus className="w-4 h-4" />
        Share Invite Link
      </Button>

      {/* Apply someone else's code */}
      {!user.referredBy && (
        <div className="border-t pt-4">
          <p className="text-xs text-muted-foreground mb-2">
            Have a friend's code? Enter it below:
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter code"
              value={referralInput}
              onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
              maxLength={6}
              className="font-mono uppercase"
              data-testid="input-referral-code"
            />
            <Button
              onClick={() => applyReferralMutation.mutate(referralInput)}
              disabled={referralInput.length !== 6 || applyReferralMutation.isPending}
              data-testid="button-apply-referral"
            >
              {applyReferralMutation.isPending ? "..." : "Apply"}
            </Button>
          </div>
        </div>
      )}

      {user.referredBy && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 border-t pt-3">
          <Snowflake className="w-4 h-4" />
          <span>You earned a freeze token from a referral!</span>
        </div>
      )}
    </Card>
  );
}
