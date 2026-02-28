import { useState, useEffect, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { usePremium } from "@/hooks/use-premium";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  trackSimLabResultsViewed,
  trackSimLabRunCompleted,
  trackSimLabSaveClicked,
  trackSimLabCompareClicked,
  trackSimLabPaywallViewed,
} from "@/lib/analytics";
import {
  ChevronLeft,
  FlaskConical,
  Save,
  GitCompare,
  Share2,
  Lock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  Crown,
  Calendar,
  Zap,
} from "lucide-react";
import type { SimulationRun } from "@shared/schema";
import type { SimulationResult, RiskMeter, SummaryMetric, SimEvent, DecisionCheckpoint } from "@shared/lib/simlab/engine";

// ─── Risk Meter Component ────────────────────────────────────────────────────

function RiskMeterCard({ risk }: { risk: RiskMeter }) {
  const colorMap = {
    low: { bg: "bg-emerald-500", text: "text-emerald-500", border: "border-emerald-500/20" },
    medium: { bg: "bg-yellow-500", text: "text-yellow-500", border: "border-yellow-500/20" },
    high: { bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-500/20" },
    critical: { bg: "bg-red-500", text: "text-red-500", border: "border-red-500/20" },
  };
  const colors = colorMap[risk.level];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("p-3 rounded-xl", colors.border)}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold">{risk.label}</span>
          <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5 uppercase", colors.text, colors.border)}>
            {risk.level}
          </Badge>
        </div>
        <div className="h-2 rounded-full bg-muted/50 overflow-hidden mb-1.5">
          <motion.div
            className={cn("h-full rounded-full", colors.bg)}
            initial={{ width: 0 }}
            animate={{ width: `${risk.value}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground">{risk.description}</p>
      </Card>
    </motion.div>
  );
}

// ─── Summary Metric Card ─────────────────────────────────────────────────────

function MetricCard({ metric, index }: { metric: SummaryMetric; index: number }) {
  const TrendIcon = metric.trend === "up" ? TrendingUp : metric.trend === "down" ? TrendingDown : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="p-3 rounded-xl">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{metric.label}</p>
            <p className="text-base font-bold mt-0.5">{metric.formattedValue}</p>
            {metric.description && (
              <p className="text-[10px] text-muted-foreground mt-0.5">{metric.description}</p>
            )}
          </div>
          {TrendIcon && (
            <TrendIcon
              className={cn(
                "w-4 h-4 flex-shrink-0",
                metric.trend === "up" ? "text-emerald-500" : "text-red-500"
              )}
            />
          )}
        </div>
      </Card>
    </motion.div>
  );
}

// ─── Event Feed ──────────────────────────────────────────────────────────────

function EventFeed({ events, currentMonth }: { events: SimEvent[]; currentMonth: number }) {
  const visibleEvents = events.filter((e) => e.month <= currentMonth);

  const iconMap: Record<string, typeof Info> = {
    info: Info,
    positive: CheckCircle2,
    negative: AlertTriangle,
    warning: AlertTriangle,
    decision: Zap,
  };

  const colorMap: Record<string, string> = {
    info: "text-blue-400 bg-blue-400/10",
    positive: "text-emerald-400 bg-emerald-400/10",
    negative: "text-red-400 bg-red-400/10",
    warning: "text-yellow-400 bg-yellow-400/10",
    decision: "text-purple-400 bg-purple-400/10",
  };

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      <AnimatePresence>
        {visibleEvents.map((event, i) => {
          const Icon = iconMap[event.type] || Info;
          const color = colorMap[event.type] || "text-muted-foreground bg-muted/30";

          return (
            <motion.div
              key={`${event.month}-${event.title}-${i}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2.5 p-2 rounded-lg bg-muted/20"
            >
              <div className={cn("w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0", color)}>
                <Icon className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium">{event.title}</p>
                  <span className="text-[9px] text-muted-foreground">Month {event.month}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{event.description}</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {visibleEvents.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No events yet.</p>
      )}
    </div>
  );
}

// ─── Decision Cards ──────────────────────────────────────────────────────────

function DecisionCards({ decisions }: { decisions: DecisionCheckpoint[] }) {
  if (decisions.length === 0) return null;

  return (
    <div className="space-y-2">
      {decisions.map((d) => {
        const chosen = d.options.find((o) => o.id === d.chosenOptionId);
        return (
          <Card key={d.id} className="p-3 rounded-xl border-purple-500/10">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{d.prompt}</p>
                {chosen && (
                  <div className="mt-1.5 px-2 py-1 rounded-md bg-purple-500/10">
                    <p className="text-[11px] font-medium text-purple-400">{chosen.label}</p>
                    <p className="text-[10px] text-muted-foreground">{chosen.description}</p>
                  </div>
                )}
                <span className="text-[9px] text-muted-foreground">Month {d.month}</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Simple Chart ────────────────────────────────────────────────────────────

function SimpleChart({
  data,
  dataKey,
  label,
  color = "hsl(var(--primary))",
  currentMonth,
}: {
  data: { month: number; metrics: Record<string, number> }[];
  dataKey: string;
  label: string;
  color?: string;
  currentMonth: number;
}) {
  const visibleData = data.filter((d) => d.month <= currentMonth);
  if (visibleData.length === 0) return null;

  const values = visibleData.map((d) => d.metrics[dataKey] || 0);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="h-24 flex items-end gap-[1px]">
        {visibleData.map((point, i) => {
          const val = point.metrics[dataKey] || 0;
          const heightPct = Math.max(2, ((val - minVal) / range) * 100);
          return (
            <motion.div
              key={point.month}
              className="flex-1 rounded-t-sm"
              style={{ backgroundColor: val < 0 ? "hsl(var(--destructive))" : color, opacity: 0.7 + (i / visibleData.length) * 0.3 }}
              initial={{ height: 0 }}
              animate={{ height: `${heightPct}%` }}
              transition={{ duration: 0.3, delay: i * 0.01 }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground">
        <span>Month 1</span>
        <span className="font-medium">
          ${Math.round(values[values.length - 1] || 0).toLocaleString()}
        </span>
        <span>Month {currentMonth}</span>
      </div>
    </div>
  );
}

// ─── Premium Gate Modal ──────────────────────────────────────────────────────

function PremiumGateOverlay({
  feature,
  onClose,
  onUpgrade,
}: {
  feature: string;
  onClose: () => void;
  onUpgrade: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-card border rounded-2xl p-6 max-w-sm w-full text-center shadow-xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Crown className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-lg font-bold mb-1">Unlock {feature}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Upgrade to Premium for unlimited runs, saved comparisons, and exported summaries.
        </p>
        <Button
          className="w-full mb-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0"
          onClick={onUpgrade}
        >
          Upgrade to Premium
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Maybe later
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Results Page ───────────────────────────────────────────────────────

export default function SimLabResults() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/simlab/results/:runId");
  const runId = params?.runId || "";
  const { canAccess } = usePremium();
  const queryClient = useQueryClient();

  const [timelineMonth, setTimelineMonth] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showPremiumGate, setShowPremiumGate] = useState<string | null>(null);
  const [saveName, setSaveName] = useState("");

  const { data: runData, isLoading } = useQuery<SimulationRun>({
    queryKey: [`/api/simlab/runs/${runId}`],
    enabled: !!runId,
  });

  const saveMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/simlab/runs/${runId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Run saved!", description: "You can find it in your saved runs." });
      setShowSaveModal(false);
      queryClient.invalidateQueries({ queryKey: [`/api/simlab/runs/${runId}`] });
    },
  });

  const result = runData ? (runData.resultJSON as unknown as SimulationResult) : null;

  // Track results view + run completed (fire once when data loads)
  const trackedRef = useRef(false);
  useEffect(() => {
    if (runData && result && !trackedRef.current) {
      trackedRef.current = true;
      trackSimLabResultsViewed(result.templateId, runId);
      trackSimLabRunCompleted(
        result.templateId,
        runId,
        runData.isPreview,
        result.summary.length,
        result.events.length
      );
    }
  }, [runData, result, runId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FlaskConical className="w-8 h-8 text-cyan-400 animate-pulse" />
      </div>
    );
  }

  if (!runData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Run not found.</p>
        <Button onClick={() => navigate("/simlab")}>Back to Sim Lab</Button>
      </div>
    );
  }

  // result is guaranteed non-null past the runData guard above
  const sim = result!;
  const currentMonth = timelineMonth ?? sim.durationMonths;

  const handlePremiumAction = (feature: string) => {
    if (!canAccess("pro")) {
      trackSimLabPaywallViewed(
        feature === "Save" ? "save" : "compare",
        sim.templateId
      );
      setShowPremiumGate(feature);
    } else if (feature === "Save") {
      trackSimLabSaveClicked(sim.templateId, runId, true);
      setShowSaveModal(true);
    } else if (feature === "Compare") {
      trackSimLabCompareClicked(sim.templateId, true);
      navigate(`/simlab/compare?runId=${runId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 relative overflow-x-hidden">
      <header className="flex items-center justify-between px-4 h-14 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/simlab")}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <FlaskConical className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-sm">Results</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => handlePremiumAction("Save")}
          >
            {canAccess("pro") ? <Save className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => handlePremiumAction("Compare")}
          >
            {canAccess("pro") ? <GitCompare className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            Compare
          </Button>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 pt-4 pb-8 space-y-4">
        {/* Summary metrics */}
        <div className="grid grid-cols-2 gap-2">
          {sim.summary.map((metric, i) => (
            <MetricCard key={metric.id} metric={metric} index={i} />
          ))}
        </div>

        {/* Risk meters */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Risk Assessment
          </h3>
          {sim.risks.map((risk) => (
            <RiskMeterCard key={risk.id} risk={risk} />
          ))}
        </div>

        {/* Timeline scrubber */}
        {sim.timeline.length > 0 && (
          <Card className="p-4 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Timeline
              </h3>
              <span className="text-xs font-bold tabular-nums">
                Month {currentMonth}
              </span>
            </div>
            <Slider
              value={[currentMonth]}
              onValueChange={([v]) => setTimelineMonth(v)}
              min={1}
              max={sim.durationMonths}
              step={1}
              className="mb-4"
            />

            {/* Net worth chart */}
            <SimpleChart
              data={sim.timeline}
              dataKey="netWorth"
              label="Net Worth"
              color="hsl(160, 60%, 45%)"
              currentMonth={currentMonth}
            />

            {/* Cash chart */}
            <div className="mt-3">
              <SimpleChart
                data={sim.timeline}
                dataKey="cash"
                label="Cash"
                color="hsl(210, 60%, 50%)"
                currentMonth={currentMonth}
              />
            </div>
          </Card>
        )}

        {/* Decision checkpoints */}
        {sim.decisions.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Zap className="w-3 h-3" />
              Decision Checkpoints
            </h3>
            <DecisionCards decisions={sim.decisions} />
          </div>
        )}

        {/* Event feed */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Info className="w-3 h-3" />
            Event Feed
          </h3>
          <Card className="p-3 rounded-xl">
            <EventFeed events={sim.events} currentMonth={currentMonth} />
          </Card>
        </div>

        {/* Preview notice for free users */}
        {runData.isPreview && !canAccess("pro") && (
          <Card className="p-4 rounded-xl border-cyan-500/20 bg-gradient-to-r from-card to-cyan-500/[0.03]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">This is a preview run</h3>
                <p className="text-xs text-muted-foreground">
                  Upgrade to save, compare, and run unlimited simulations.
                </p>
              </div>
              <Button
                size="sm"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 flex-shrink-0"
                onClick={() => navigate("/membership")}
              >
                Upgrade
              </Button>
            </div>
          </Card>
        )}

        {/* Run again button */}
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => navigate(`/simlab/setup/${sim.templateId}`)}
        >
          <FlaskConical className="w-4 h-4" />
          Run Again with Different Inputs
        </Button>
      </main>

      {/* Save Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSaveModal(false)}
          >
            <motion.div
              className="bg-card border rounded-2xl p-6 max-w-sm w-full shadow-xl"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-3">Save Run</h3>
              <Input
                placeholder="Name this run..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="mb-3"
                autoFocus
              />
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setShowSaveModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0"
                  onClick={() => saveMutation.mutate(saveName)}
                  disabled={!saveName.trim() || saveMutation.isPending}
                >
                  Save
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Gate */}
      <AnimatePresence>
        {showPremiumGate && (
          <PremiumGateOverlay
            feature={showPremiumGate}
            onClose={() => setShowPremiumGate(null)}
            onUpgrade={() => {
              setShowPremiumGate(null);
              navigate("/membership");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
