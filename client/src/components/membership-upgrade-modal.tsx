import { useState } from "react";
import { motion } from "framer-motion";
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
  Crown,
  Check,
  Sparkles,
  Zap,
  Shield,
  Star,
  TrendingUp,
  Award,
  Flame,
  Calendar,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type MembershipTier = "free" | "plus" | "pro";

interface MembershipUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: MembershipTier;
  highlightTier?: MembershipTier;
}

const TIER_FEATURES = {
  free: {
    name: "Free",
    price: "$0",
    period: "forever",
    color: "text-gray-500",
    gradient: "from-gray-500 to-gray-600",
    icon: Shield,
    features: [
      "5 scenarios per day",
      "1 freeze token per month",
      "Basic badges",
      "Leaderboard access",
      "Community scenarios",
    ],
  },
  plus: {
    name: "Plus",
    price: "$4.99",
    period: "per month",
    color: "text-blue-500",
    gradient: "from-blue-500 to-indigo-600",
    icon: Sparkles,
    popular: true,
    features: [
      "✨ All Free features",
      "🔥 Unlimited freeze tokens",
      "💎 Streak buyback (1x/month)",
      "⏰ Late pass (play yesterday)",
      "🎨 Gold badge frames",
      "⚡ Early Friday mystery access",
      "🚫 Ad-free experience",
    ],
  },
  pro: {
    name: "Pro",
    price: "$9.99",
    period: "per month",
    color: "text-yellow-500",
    gradient: "from-yellow-500 to-orange-600",
    icon: Crown,
    features: [
      "✨ All Plus features",
      "🎯 10 scenarios per day (2x)",
      "🤖 AI Money Coach feedback",
      "📊 Advanced statistics",
      "🎨 Custom avatar backgrounds",
      "⚡ 2x challenge points",
      "👑 Priority leaderboard listing",
      "🏆 Exclusive Pro badges",
    ],
  },
};

export function MembershipUpgradeModal({
  open,
  onOpenChange,
  currentTier,
  highlightTier,
}: MembershipUpgradeModalProps) {
  const [selectedTier, setSelectedTier] = useState<MembershipTier>(highlightTier || "plus");
  const { toast } = useToast();

  const upgradeMutation = useMutation({
    mutationFn: async (tier: MembershipTier) => {
      const res = await apiRequest("POST", "/api/membership/upgrade", { tier });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      onOpenChange(false);
      toast({
        title: "Upgrade successful!",
        description: "Your new features are now active",
      });
    },
    onError: () => {
      toast({
        title: "Upgrade failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = () => {
    if (selectedTier === currentTier) {
      toast({
        title: "Already subscribed",
        description: `You're currently on the ${TIER_FEATURES[currentTier].name} plan`,
      });
      return;
    }
    upgradeMutation.mutate(selectedTier);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="w-6 h-6 text-yellow-500" />
            Upgrade Your Experience
          </DialogTitle>
          <DialogDescription>
            Unlock premium features to supercharge your financial literacy journey
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 mt-4">
          {(Object.keys(TIER_FEATURES) as MembershipTier[]).map((tier) => {
            const config = TIER_FEATURES[tier];
            const Icon = config.icon;
            const isSelected = selectedTier === tier;
            const isCurrent = currentTier === tier;
            const isUpgrade = tier !== "free" && (currentTier === "free" || (currentTier === "plus" && tier === "pro"));

            return (
              <motion.div
                key={tier}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: tier === "free" ? 0 : tier === "plus" ? 0.1 : 0.2 }}
              >
                <Card
                  className={`relative p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "ring-2 ring-primary shadow-lg scale-105"
                      : "hover:shadow-md hover:scale-102"
                  } ${
                    isCurrent
                      ? "bg-primary/5 border-primary/30"
                      : ""
                  }`}
                  onClick={() => tier !== "free" && setSelectedTier(tier)}
                >
                  {config.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute -top-3 right-4">
                      <Badge variant="secondary">
                        <Check className="w-3 h-3 mr-1" />
                        Current
                      </Badge>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-1">{config.name}</h3>
                    <div>
                      <span className="text-2xl font-bold">{config.price}</span>
                      <span className="text-xs text-muted-foreground">/{config.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-4">
                    {config.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {!isCurrent && tier !== "free" && (
                    <Button
                      className="w-full"
                      variant={isSelected ? "default" : "outline"}
                      disabled={upgradeMutation.isPending}
                    >
                      {isUpgrade ? "Upgrade" : "Downgrade"}
                    </Button>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          {selectedTier !== currentTier && selectedTier !== "free" && (
            <Button
              size="lg"
              onClick={handleUpgrade}
              disabled={upgradeMutation.isPending}
              className="gap-2"
            >
              {upgradeMutation.isPending ? (
                "Processing..."
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  Upgrade to {TIER_FEATURES[selectedTier].name}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
