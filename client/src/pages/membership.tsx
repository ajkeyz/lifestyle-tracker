import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { MembershipUpgradeModal } from "@/components/membership-upgrade-modal";
import {
  ArrowLeft,
  Crown,
  Shield,
  Sparkles,
  Check,
  Flame,
  Heart,
  Zap,
  Award,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import type { User } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

type MembershipTier = "free" | "plus" | "pro";

const TIER_BENEFITS = {
  free: {
    name: "Free",
    icon: Shield,
    color: "text-gray-500",
    benefits: [
      { icon: Calendar, text: "5 scenarios daily", unlocked: true },
      { icon: Flame, text: "1 freeze token/month", unlocked: true },
      { icon: Award, text: "Basic badges", unlocked: true },
      { icon: TrendingUp, text: "Leaderboard access", unlocked: true },
    ],
  },
  plus: {
    name: "Plus",
    icon: Sparkles,
    color: "text-blue-500",
    benefits: [
      { icon: Flame, text: "Unlimited freeze tokens", unlocked: true },
      { icon: Heart, text: "Streak buyback (1x/month)", unlocked: true },
      { icon: Calendar, text: "Late pass - play yesterday", unlocked: true },
      { icon: Sparkles, text: "Gold badge frames", unlocked: true },
      { icon: Zap, text: "Early Friday access", unlocked: true },
      { icon: Shield, text: "Ad-free experience", unlocked: true },
    ],
  },
  pro: {
    name: "Pro",
    icon: Crown,
    color: "text-yellow-500",
    benefits: [
      { icon: Calendar, text: "10 scenarios daily (2x)", unlocked: true },
      { icon: Sparkles, text: "AI Money Coach", unlocked: true },
      { icon: TrendingUp, text: "Advanced statistics", unlocked: true },
      { icon: Award, text: "Custom avatars", unlocked: true },
      { icon: Zap, text: "2x challenge points", unlocked: true },
      { icon: Crown, text: "Priority listing", unlocked: true },
      { icon: Trophy, text: "Exclusive Pro badges", unlocked: true },
    ],
  },
};

function Trophy({ className }: { className?: string }) {
  return <Award className={className} />;
}

export default function Membership() {
  const [, navigate] = useLocation();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  // Get current tier from user's membershipTier field
  const currentTier: MembershipTier = user?.membershipTier || "free";
  const currentConfig = TIER_BENEFITS[currentTier];
  const Icon = currentConfig.icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center justify-between gap-2 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/settings")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <AppLogo size="sm" />
          <h1 className="font-bold">Membership</h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-6">
        {isLoading ? (
          <>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </>
        ) : (
          <>
            {/* Current Plan */}
            <Card className="bg-gradient-to-br from-primary/10 to-accent/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-6 h-6 ${currentConfig.color}`} />
                    <span>Current Plan: {currentConfig.name}</span>
                  </div>
                  <Badge variant="secondary">
                    {currentTier === "free" ? "Free Forever" : "$4.99/month"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {currentConfig.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <benefit.icon className="w-4 h-4 text-green-500" />
                      <span>{benefit.text}</span>
                    </div>
                  ))}
                </div>

                {currentTier === "free" && (
                  <Button
                    size="lg"
                    className="w-full gap-2"
                    onClick={() => setShowUpgrade(true)}
                  >
                    <Crown className="w-5 h-5" />
                    Upgrade to Plus
                  </Button>
                )}

                {currentTier === "plus" && (
                  <div className="flex gap-2">
                    <Button
                      size="lg"
                      className="flex-1 gap-2"
                      onClick={() => setShowUpgrade(true)}
                    >
                      <Crown className="w-5 h-5" />
                      Upgrade to Pro
                    </Button>
                    <Button variant="outline" size="lg">
                      Manage
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Why Upgrade */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Why Upgrade?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Flame className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">Never Lose Your Streak</p>
                    <p className="text-sm text-muted-foreground">
                      Unlimited freeze tokens and streak buyback keep your progress safe
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-yellow-500" />
                  </div>
                  <div>
                    <p className="font-medium">2x the Practice</p>
                    <p className="text-sm text-muted-foreground">
                      Pro members get 10 scenarios daily - double the learning
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium">Advanced Insights</p>
                    <p className="text-sm text-muted-foreground">
                      AI Money Coach and detailed stats track your improvement
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compare Plans */}
            <Card>
              <CardHeader>
                <CardTitle>Compare All Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowUpgrade(true)}
                >
                  View Full Comparison
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <MembershipUpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        currentTier={currentTier}
        highlightTier={currentTier === "free" ? "plus" : "pro"}
      />
    </div>
  );
}
