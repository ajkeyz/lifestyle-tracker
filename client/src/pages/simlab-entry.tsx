import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AmbientBackground } from "@/components/ambient-background";
import { AppLogo } from "@/components/app-logo";
import { usePremium } from "@/hooks/use-premium";
import { cn } from "@/lib/utils";
import { trackSimLabViewed, trackSimLabTemplateSelected, trackSimLabPaywallViewed } from "@/lib/analytics";
import {
  FlaskConical,
  Home,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Lock,
  Star,
  Crown,
  Sparkles,
} from "lucide-react";
import type { SimTemplateInfo } from "@shared/lib/simlab/engine";

const TEMPLATE_ICONS: Record<string, typeof Home> = {
  Home: Home,
  TrendingUp: TrendingUp,
};

const TEMPLATE_GRADIENTS: Record<string, string> = {
  buy_a_house: "from-emerald-500 to-teal-600",
  rsu_liquidation: "from-violet-500 to-purple-600",
  startup_equity: "from-orange-500 to-red-500",
  fire_planner: "from-amber-500 to-yellow-600",
};

const TEMPLATE_TEASERS: Record<string, string> = {
  buy_a_house: "See if you can actually afford that dream home.",
  rsu_liquidation: "Find the best strategy for your company stock.",
  startup_equity: "Coming soon",
  fire_planner: "Coming soon",
};

export default function SimLabEntry() {
  const [, navigate] = useLocation();
  const { isPro, canAccess } = usePremium();

  const { data: templates } = useQuery<SimTemplateInfo[]>({
    queryKey: ["/api/simlab/templates"],
  });

  const { data: previewUsage } = useQuery<{ usedTemplates: string[] }>({
    queryKey: ["/api/simlab/preview-usage"],
  });

  const usedPreviews = new Set(previewUsage?.usedTemplates ?? []);

  // Track page view (fire once when templates load)
  const trackedRef = useRef(false);
  useEffect(() => {
    if (templates && !trackedRef.current) {
      trackedRef.current = true;
      trackSimLabViewed(canAccess("pro"), templates.length);
    }
  }, [templates]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 relative overflow-x-hidden">
      <AmbientBackground variant="default" />

      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/play-hub")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <FlaskConical className="w-5 h-5 text-cyan-400" />
          <span className="font-display font-extrabold text-[15px] leading-none tracking-[-0.04em]">
            Sim Lab
          </span>
        </div>
        {isPro && (
          <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 text-[10px]">
            <Crown className="w-3 h-3 mr-1" />
            Pro
          </Badge>
        )}
      </header>

      <main className="container max-w-2xl mx-auto px-4 pt-6 pb-8 space-y-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <FlaskConical className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold mb-1">Financial Simulations</h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Run life-sized financial scenarios and see outcomes before you commit.
          </p>
        </motion.div>

        {/* Template Cards */}
        <div className="space-y-3">
          {templates?.map((template, i) => {
            const Icon = TEMPLATE_ICONS[template.icon] || FlaskConical;
            const gradient = TEMPLATE_GRADIENTS[template.id] || "from-gray-500 to-gray-600";
            const teaser = TEMPLATE_TEASERS[template.id] || template.description;
            const previewUsed = usedPreviews.has(template.id);
            const canPreview = !previewUsed || canAccess("pro");

            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 + 0.15 }}
              >
                <Card
                  className={cn(
                    "relative overflow-hidden rounded-xl cursor-pointer transition-all duration-200",
                    "hover:shadow-lg hover:border-primary/20 hover-elevate"
                  )}
                  onClick={() => {
                    trackSimLabTemplateSelected(template.id, canAccess("pro"), !canAccess("pro") && !previewUsed);
                    navigate(`/simlab/setup/${template.id}`);
                  }}
                  data-testid={`simlab-template-${template.id}`}
                >
                  <div className="p-4 flex items-center gap-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-md",
                        gradient
                      )}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-sm">{template.title}</h3>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] h-4 px-1.5",
                            canAccess("pro")
                              ? "border-cyan-500/30 text-cyan-400"
                              : previewUsed
                                ? "border-muted-foreground/30 text-muted-foreground"
                                : "border-amber-500/30 text-amber-400"
                          )}
                        >
                          {canAccess("pro") ? (
                            <>
                              <Star className="w-2 h-2 mr-0.5" />
                              Full Access
                            </>
                          ) : previewUsed ? (
                            <>
                              <Lock className="w-2 h-2 mr-0.5" />
                              Preview Used
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-2 h-2 mr-0.5" />
                              Preview Available
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{teaser}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                        <span>{template.category}</span>
                        <span>·</span>
                        <span>~{template.estimatedTime}</span>
                        <span>·</span>
                        <span>v{template.version}</span>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Premium Upsell */}
        {!canAccess("pro") && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.4 }}
          >
            <Card className="p-4 rounded-xl border-cyan-500/20 bg-gradient-to-r from-card to-cyan-500/[0.03]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">Unlock Full Sim Lab</h3>
                  <p className="text-xs text-muted-foreground">
                    Unlimited runs, save & compare, and export summaries.
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 flex-shrink-0"
                  onClick={() => {
                    trackSimLabPaywallViewed("template_locked");
                    navigate("/membership");
                  }}
                >
                  Upgrade
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
