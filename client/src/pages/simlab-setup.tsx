import { useState, useMemo, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { usePremium } from "@/hooks/use-premium";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { trackSimLabSetupStarted, trackSimLabRunStarted } from "@/lib/analytics";
import {
  ChevronLeft,
  ChevronDown,
  FlaskConical,
  Play,
  Loader2,
  DollarSign,
  Home,
  TrendingUp,
} from "lucide-react";
import type { BuyAHouseInput } from "@shared/lib/simlab/templates/buy-a-house";
import type { RSULiquidationInput, RSUStrategy, RSUGoal, RiskTolerance } from "@shared/lib/simlab/templates/rsu-liquidation";

// ─── Input Field Component ───────────────────────────────────────────────────

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  helper,
  error,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  helper?: string;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className={cn(
            "h-9 text-sm",
            prefix && "pl-7",
            suffix && "pr-12",
            error && "border-destructive"
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
            {suffix}
          </span>
        )}
      </div>
      {helper && !error && <p className="text-[10px] text-muted-foreground">{helper}</p>}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  helper,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  helper?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{label}</Label>
        <span className="text-xs font-bold tabular-nums text-primary">
          {value}{suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      {helper && <p className="text-[10px] text-muted-foreground">{helper}</p>}
    </div>
  );
}

function OptionPicker<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex gap-2">
        {options.map((opt) => (
          <Button
            key={opt.value}
            variant={value === opt.value ? "default" : "outline"}
            size="sm"
            className={cn("flex-1 text-xs h-8", value === opt.value && "bg-primary")}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ─── Buy a House Setup ───────────────────────────────────────────────────────

function BuyAHouseSetup({
  onRun,
  isRunning,
  isPreview,
}: {
  onRun: (input: Record<string, unknown>) => void;
  isRunning: boolean;
  isPreview: boolean;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [input, setInput] = useState<BuyAHouseInput>({
    incomeMonthly: 6000,
    savingsCash: 50000,
    monthlyExpenses: 3000,
    homePrice: 350000,
    downPaymentPercent: 20,
    interestRate: 6.5,
    loanTermYears: 30,
    propertyTaxMonthly: 350,
    insuranceMonthly: 150,
    hoaMonthly: 0,
    emergencyFundMonthsTarget: 6,
    maintenancePercentYearly: 1,
    homeValueGrowthRate: 3,
    rentAlternativeMonthly: 1800,
  });

  const update = <K extends keyof BuyAHouseInput>(key: K, val: BuyAHouseInput[K]) =>
    setInput((p) => ({ ...p, [key]: val }));

  // Quick validation
  const monthlyPaymentEstimate = useMemo(() => {
    const loan = input.homePrice * (1 - input.downPaymentPercent / 100);
    const r = input.interestRate / 100 / 12;
    const n = input.loanTermYears * 12;
    if (r === 0) return Math.round(loan / n);
    return Math.round((loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  }, [input.homePrice, input.downPaymentPercent, input.interestRate, input.loanTermYears]);

  const housingRatio = (monthlyPaymentEstimate + input.propertyTaxMonthly + input.insuranceMonthly + input.hoaMonthly) / input.incomeMonthly;

  return (
    <div className="space-y-4">
      {/* Quick preview card */}
      <Card className="p-3 rounded-xl border-primary/10 bg-primary/[0.03]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Est. Monthly Payment</p>
            <p className="text-lg font-bold">${monthlyPaymentEstimate.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Housing Ratio</p>
            <p className={cn(
              "text-lg font-bold",
              housingRatio > 0.36 ? "text-destructive" : housingRatio > 0.28 ? "text-yellow-500" : "text-emerald-500"
            )}>
              {Math.round(housingRatio * 100)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Core inputs */}
      <Card className="p-4 rounded-xl space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Your Finances
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Monthly Income" value={input.incomeMonthly} onChange={(v) => update("incomeMonthly", v)} prefix="$" min={0} />
          <NumberField label="Monthly Expenses" value={input.monthlyExpenses} onChange={(v) => update("monthlyExpenses", v)} prefix="$" min={0} />
          <NumberField label="Cash Savings" value={input.savingsCash} onChange={(v) => update("savingsCash", v)} prefix="$" min={0} />
        </div>
      </Card>

      <Card className="p-4 rounded-xl space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Home className="w-4 h-4 text-primary" />
          Home Details
        </h3>
        <NumberField label="Home Price" value={input.homePrice} onChange={(v) => update("homePrice", v)} prefix="$" min={10000} />
        <SliderField label="Down Payment" value={input.downPaymentPercent} onChange={(v) => update("downPaymentPercent", v)} min={3} max={50} suffix="%" helper={`$${Math.round(input.homePrice * input.downPaymentPercent / 100).toLocaleString()} down`} />
        <SliderField label="Interest Rate" value={input.interestRate} onChange={(v) => update("interestRate", v)} min={2} max={12} step={0.25} suffix="%" />
        <OptionPicker label="Loan Term" value={String(input.loanTermYears) as "15" | "30"} onChange={(v) => update("loanTermYears", Number(v) as 15 | 30)} options={[{ value: "15", label: "15 years" }, { value: "30", label: "30 years" }]} />
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Property Tax/mo" value={input.propertyTaxMonthly} onChange={(v) => update("propertyTaxMonthly", v)} prefix="$" min={0} />
          <NumberField label="Insurance/mo" value={input.insuranceMonthly} onChange={(v) => update("insuranceMonthly", v)} prefix="$" min={0} />
        </div>
        <NumberField label="HOA/mo (optional)" value={input.hoaMonthly} onChange={(v) => update("hoaMonthly", v)} prefix="$" min={0} />
        <SliderField label="Emergency Fund Target" value={input.emergencyFundMonthsTarget} onChange={(v) => update("emergencyFundMonthsTarget", v)} min={1} max={12} suffix=" months" />
      </Card>

      {/* Advanced accordion */}
      <button
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        <ChevronDown className={cn("w-3 h-3 transition-transform", showAdvanced && "rotate-180")} />
        Advanced Settings
      </button>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="p-4 rounded-xl space-y-4">
              <SliderField label="Maintenance Cost/yr" value={input.maintenancePercentYearly} onChange={(v) => update("maintenancePercentYearly", v)} min={0.5} max={3} step={0.25} suffix="% of home value" />
              <SliderField label="Home Appreciation" value={input.homeValueGrowthRate} onChange={(v) => update("homeValueGrowthRate", v)} min={0} max={8} step={0.5} suffix="%/yr" />
              <NumberField label="Rent Alternative/mo" value={input.rentAlternativeMonthly} onChange={(v) => update("rentAlternativeMonthly", v)} prefix="$" min={0} helper="What you'd pay in rent instead" />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Run button */}
      <Button
        className="w-full gap-2 h-12 text-base font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0"
        onClick={() => onRun(input as unknown as Record<string, unknown>)}
        disabled={isRunning}
        data-testid="simlab-run-button"
      >
        {isRunning ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Simulating...
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            {isPreview ? "Run Preview" : "Run Simulation"}
          </>
        )}
      </Button>
    </div>
  );
}

// ─── RSU Setup ───────────────────────────────────────────────────────────────

function RSUSetup({
  onRun,
  isRunning,
  isPreview,
}: {
  onRun: (input: Record<string, unknown>) => void;
  isRunning: boolean;
  isPreview: boolean;
}) {
  const [input, setInput] = useState<RSULiquidationInput>({
    sharesPerQuarter: 100,
    vestingQuarters: 16,
    currentSharePrice: 150,
    taxRateEstimate: 35,
    concentrationTargetPercent: 20,
    goal: "invest",
    riskTolerance: "medium",
    strategy: "sell_all_at_vest",
    otherNetWorth: 200000,
  });

  const update = <K extends keyof RSULiquidationInput>(key: K, val: RSULiquidationInput[K]) =>
    setInput((p) => ({ ...p, [key]: val }));

  const totalShareValue = input.sharesPerQuarter * input.vestingQuarters * input.currentSharePrice;

  return (
    <div className="space-y-4">
      <Card className="p-3 rounded-xl border-primary/10 bg-primary/[0.03]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total RSU Value</p>
            <p className="text-lg font-bold">${totalShareValue.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pre-Tax</p>
            <p className="text-xs text-muted-foreground">over {input.vestingQuarters} quarters</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 rounded-xl space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Vesting Details
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <NumberField label="Shares/Quarter" value={input.sharesPerQuarter} onChange={(v) => update("sharesPerQuarter", v)} min={1} />
          <NumberField label="Vesting Quarters" value={input.vestingQuarters} onChange={(v) => update("vestingQuarters", v)} min={1} max={20} />
        </div>
        <NumberField label="Current Share Price" value={input.currentSharePrice} onChange={(v) => update("currentSharePrice", v)} prefix="$" min={1} />
        <NumberField label="Other Net Worth" value={input.otherNetWorth} onChange={(v) => update("otherNetWorth", v)} prefix="$" min={0} helper="Savings, investments, etc. (excl. RSUs)" />
        <SliderField label="Tax Rate Estimate" value={input.taxRateEstimate} onChange={(v) => update("taxRateEstimate", v)} min={10} max={50} suffix="%" />
        <SliderField label="Concentration Target" value={input.concentrationTargetPercent} onChange={(v) => update("concentrationTargetPercent", v)} min={5} max={50} suffix="%" helper="Max % of net worth in company stock" />
      </Card>

      <Card className="p-4 rounded-xl space-y-4">
        <h3 className="text-sm font-semibold">Strategy</h3>
        <OptionPicker
          label="Sell Strategy"
          value={input.strategy}
          onChange={(v) => update("strategy", v as RSUStrategy)}
          options={[
            { value: "sell_all_at_vest", label: "Sell All" },
            { value: "sell_50_at_vest", label: "Sell 50%" },
            { value: "hold_12_months_then_sell", label: "Hold 12mo" },
            { value: "ladder_sell_monthly", label: "Ladder" },
          ]}
        />
        <OptionPicker
          label="Goal"
          value={input.goal}
          onChange={(v) => update("goal", v as RSUGoal)}
          options={[
            { value: "buy_house", label: "Buy House" },
            { value: "invest", label: "Invest" },
            { value: "pay_debt", label: "Pay Debt" },
          ]}
        />
        <OptionPicker
          label="Risk Tolerance"
          value={input.riskTolerance}
          onChange={(v) => update("riskTolerance", v as RiskTolerance)}
          options={[
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
          ]}
        />
      </Card>

      <Button
        className="w-full gap-2 h-12 text-base font-bold bg-gradient-to-r from-violet-500 to-purple-600 text-white border-0"
        onClick={() => onRun(input as unknown as Record<string, unknown>)}
        disabled={isRunning}
        data-testid="simlab-run-button"
      >
        {isRunning ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Simulating...
          </>
        ) : (
          <>
            <Play className="w-5 h-5" />
            {isPreview ? "Run Preview" : "Run Simulation"}
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Main Setup Page ─────────────────────────────────────────────────────────

export default function SimLabSetup() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/simlab/setup/:templateId");
  const templateId = params?.templateId || "buy_a_house";
  const { canAccess } = usePremium();
  const isPreview = !canAccess("pro");

  // Track setup page view
  useEffect(() => {
    trackSimLabSetupStarted(templateId);
  }, [templateId]);

  const runMutation = useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      trackSimLabRunStarted(templateId, isPreview, input);
      const res = await fetch("/api/simlab/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          input,
          isPreview,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.error || "Failed to run simulation");
      }
      return res.json();
    },
    onSuccess: (data) => {
      navigate(`/simlab/results/${data.run.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Simulation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const TEMPLATE_TITLES: Record<string, string> = {
    buy_a_house: "Buy a House",
    rsu_liquidation: "RSU Liquidation",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 relative overflow-x-hidden">
      <header className="flex items-center gap-2 px-4 h-14 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/simlab")}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <FlaskConical className="w-4 h-4 text-cyan-400" />
        <span className="font-semibold text-sm">{TEMPLATE_TITLES[templateId] || "Setup"}</span>
      </header>

      <main className="container max-w-lg mx-auto px-4 pt-4 pb-8">
        {templateId === "buy_a_house" && (
          <BuyAHouseSetup
            onRun={(input) => runMutation.mutate(input)}
            isRunning={runMutation.isPending}
            isPreview={isPreview}
          />
        )}
        {templateId === "rsu_liquidation" && (
          <RSUSetup
            onRun={(input) => runMutation.mutate(input)}
            isRunning={runMutation.isPending}
            isPreview={isPreview}
          />
        )}
      </main>
    </div>
  );
}
