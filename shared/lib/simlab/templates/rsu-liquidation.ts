/**
 * RSU Liquidation Strategy Simulator
 *
 * Compare RSU sell strategies over a vesting period.
 * Deterministic with seeded stock price movements.
 */

import {
  createRNG,
  formatCurrency,
  riskLevel,
  generateRunId,
  type SimTemplate,
  type SimTemplateInfo,
  type SimulationResult,
  type TimelinePoint,
  type SimEvent,
  type DecisionCheckpoint,
  type RiskMeter,
  type SummaryMetric,
} from "../engine";

// ─── Input Schema ────────────────────────────────────────────────────────────

export type RSUStrategy = "sell_all_at_vest" | "sell_50_at_vest" | "hold_12_months_then_sell" | "ladder_sell_monthly";
export type RSUGoal = "buy_house" | "invest" | "pay_debt";
export type RiskTolerance = "low" | "medium" | "high";

export interface RSULiquidationInput {
  sharesPerQuarter: number;
  vestingQuarters: number;
  currentSharePrice: number;
  taxRateEstimate: number;
  concentrationTargetPercent: number;
  goal: RSUGoal;
  riskTolerance: RiskTolerance;
  strategy: RSUStrategy;
  compareStrategy?: RSUStrategy;
  /** Other net worth (to calculate concentration) */
  otherNetWorth: number;
}

const DEFAULT_INPUTS: RSULiquidationInput = {
  sharesPerQuarter: 100,
  vestingQuarters: 16,
  currentSharePrice: 150,
  taxRateEstimate: 35,
  concentrationTargetPercent: 20,
  goal: "invest",
  riskTolerance: "medium",
  strategy: "sell_all_at_vest",
  otherNetWorth: 200000,
};

// ─── Template ────────────────────────────────────────────────────────────────

const INFO: SimTemplateInfo = {
  id: "rsu_liquidation",
  title: "RSU Liquidation Strategy",
  description: "Compare RSU sell strategies and find the right balance of risk and reward.",
  icon: "TrendingUp",
  category: "Investment",
  estimatedTime: "3 min",
  version: "1.0.0",
  inputDefaults: DEFAULT_INPUTS as unknown as Record<string, unknown>,
};

function validate(input: RSULiquidationInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (input.sharesPerQuarter <= 0) errors.sharesPerQuarter = "Must be positive.";
  if (input.vestingQuarters < 1 || input.vestingQuarters > 20)
    errors.vestingQuarters = "Must be 1-20 quarters.";
  if (input.currentSharePrice <= 0) errors.currentSharePrice = "Must be positive.";
  if (input.taxRateEstimate < 0 || input.taxRateEstimate > 60)
    errors.taxRateEstimate = "Must be 0-60%.";
  if (input.concentrationTargetPercent < 5 || input.concentrationTargetPercent > 100)
    errors.concentrationTargetPercent = "Must be 5-100%.";
  if (input.otherNetWorth < 0) errors.otherNetWorth = "Cannot be negative.";
  return errors;
}

function simulateStrategy(
  input: RSULiquidationInput,
  strategy: RSUStrategy,
  rng: () => number
): {
  timeline: TimelinePoint[];
  events: SimEvent[];
  totalProceeds: number;
  totalTax: number;
  finalConcentration: number;
  worstConcentration: number;
} {
  const timeline: TimelinePoint[] = [];
  const events: SimEvent[] = [];

  let sharePrice = input.currentSharePrice;
  let sharesHeld = 0;
  let cashFromSales = 0;
  let totalTax = 0;
  let worstConcentration = 0;

  const totalMonths = input.vestingQuarters * 3;

  for (let m = 1; m <= totalMonths; m++) {
    // Stock price random walk (monthly drift + volatility)
    const drift = 0.005; // ~6% annual
    const volatility = input.riskTolerance === "high" ? 0.08 : input.riskTolerance === "medium" ? 0.05 : 0.03;
    const shock = (rng() - 0.5) * 2 * volatility;
    sharePrice *= 1 + drift + shock;

    // Stock shock events
    if (m > 3 && rng() < 0.03) {
      const crashMultiplier = 0.7 + rng() * 0.15;
      sharePrice *= crashMultiplier;
      events.push({
        month: m,
        type: "negative",
        title: "Stock Shock",
        description: `Share price dropped to ${formatCurrency(sharePrice)} (-${Math.round((1 - crashMultiplier) * 100)}%).`,
        impact: { sharePrice: Math.round(sharePrice) },
      });
    }

    // Quarterly vesting
    if (m % 3 === 0 && m / 3 <= input.vestingQuarters) {
      sharesHeld += input.sharesPerQuarter;
      events.push({
        month: m,
        type: "positive",
        title: "RSU Vest",
        description: `${input.sharesPerQuarter} shares vested at ${formatCurrency(sharePrice)}/share.`,
      });

      // Apply sell strategy
      let sharesToSell = 0;
      switch (strategy) {
        case "sell_all_at_vest":
          sharesToSell = input.sharesPerQuarter;
          break;
        case "sell_50_at_vest":
          sharesToSell = Math.floor(input.sharesPerQuarter * 0.5);
          break;
        case "hold_12_months_then_sell":
          // Sell shares that vested 12+ months ago
          if (m >= 15) sharesToSell = input.sharesPerQuarter;
          break;
        case "ladder_sell_monthly":
          sharesToSell = Math.floor(input.sharesPerQuarter * 0.33);
          break;
      }

      if (sharesToSell > 0) {
        const grossProceeds = sharesToSell * sharePrice;
        const tax = grossProceeds * (input.taxRateEstimate / 100);
        cashFromSales += grossProceeds - tax;
        totalTax += tax;
        sharesHeld -= sharesToSell;
      }
    }

    // For ladder strategy, also sell between vests
    if (strategy === "ladder_sell_monthly" && sharesHeld > 0 && m % 3 !== 0) {
      const sell = Math.min(Math.ceil(sharesHeld * 0.1), sharesHeld);
      if (sell > 0) {
        const grossProceeds = sell * sharePrice;
        const tax = grossProceeds * (input.taxRateEstimate / 100);
        cashFromSales += grossProceeds - tax;
        totalTax += tax;
        sharesHeld -= sell;
      }
    }

    // Calculate concentration
    const stockValue = sharesHeld * sharePrice;
    const totalNW = input.otherNetWorth + cashFromSales + stockValue;
    const concentration = totalNW > 0 ? (stockValue / totalNW) * 100 : 0;
    worstConcentration = Math.max(worstConcentration, concentration);

    timeline.push({
      month: m,
      label: m % 12 === 0 ? `Year ${m / 12}` : `Month ${m}`,
      metrics: {
        sharePrice: Math.round(sharePrice * 100) / 100,
        sharesHeld,
        stockValue: Math.round(stockValue),
        cashFromSales: Math.round(cashFromSales),
        totalNetWorth: Math.round(totalNW),
        concentrationPercent: Math.round(concentration * 10) / 10,
      },
    });
  }

  const finalStockValue = sharesHeld * sharePrice;
  const finalTotalNW = input.otherNetWorth + cashFromSales + finalStockValue;
  const finalConcentration = finalTotalNW > 0 ? (finalStockValue / finalTotalNW) * 100 : 0;

  return {
    timeline,
    events,
    totalProceeds: cashFromSales,
    totalTax,
    finalConcentration,
    worstConcentration,
  };
}

function run(
  input: RSULiquidationInput,
  seed: number,
  _userDecisions: Record<string, string> = {}
): SimulationResult {
  const rng = createRNG(seed);
  const runId = generateRunId();

  // Run primary strategy
  const primary = simulateStrategy(input, input.strategy, rng);

  // Decision: strategy selection (informational)
  const decisions: DecisionCheckpoint[] = [
    {
      month: 0,
      id: "strategy_selection",
      prompt: "Choose your RSU liquidation strategy",
      options: [
        { id: "sell_all_at_vest", label: "Sell All at Vest", description: "Immediate diversification, highest tax efficiency.", impact: {} },
        { id: "sell_50_at_vest", label: "Sell 50% at Vest", description: "Partial diversification, some upside exposure.", impact: {} },
        { id: "hold_12_months_then_sell", label: "Hold 12mo Then Sell", description: "Long-term capital gains, higher concentration risk.", impact: {} },
        { id: "ladder_sell_monthly", label: "Ladder Sell Monthly", description: "Gradual diversification over time.", impact: {} },
      ],
      chosenOptionId: input.strategy,
    },
  ];

  // Risk meters
  const concentrationRisk = Math.min(100, Math.round(primary.worstConcentration * 1.5));
  const risks: RiskMeter[] = [
    {
      id: "concentration",
      label: "Concentration Risk",
      value: concentrationRisk,
      level: riskLevel(concentrationRisk),
      description: `Peak stock concentration: ${Math.round(primary.worstConcentration)}%. Target: under ${input.concentrationTargetPercent}%.`,
    },
    {
      id: "tax_efficiency",
      label: "Tax Drag",
      value: Math.min(100, Math.round((primary.totalTax / (primary.totalProceeds + primary.totalTax)) * 100 * 2)),
      level: riskLevel(Math.round((primary.totalTax / Math.max(1, primary.totalProceeds + primary.totalTax)) * 100)),
      description: `Total estimated tax: ${formatCurrency(primary.totalTax)}.`,
    },
  ];

  const STRATEGY_LABELS: Record<RSUStrategy, string> = {
    sell_all_at_vest: "Sell All at Vest",
    sell_50_at_vest: "Sell 50% at Vest",
    hold_12_months_then_sell: "Hold 12mo, Then Sell",
    ladder_sell_monthly: "Ladder Sell Monthly",
  };

  const summary: SummaryMetric[] = [
    {
      id: "net_proceeds",
      label: "Net Proceeds (after tax)",
      value: Math.round(primary.totalProceeds),
      formattedValue: formatCurrency(Math.round(primary.totalProceeds)),
      trend: "up",
    },
    {
      id: "total_tax",
      label: "Estimated Tax Paid",
      value: Math.round(primary.totalTax),
      formattedValue: formatCurrency(Math.round(primary.totalTax)),
      trend: "down",
    },
    {
      id: "final_concentration",
      label: "Final Concentration",
      value: Math.round(primary.finalConcentration),
      formattedValue: `${Math.round(primary.finalConcentration)}%`,
      trend: primary.finalConcentration > input.concentrationTargetPercent ? "down" : "up",
    },
    {
      id: "strategy",
      label: "Strategy Used",
      value: 0,
      formattedValue: STRATEGY_LABELS[input.strategy],
    },
  ];

  return {
    templateId: "rsu_liquidation",
    templateVersion: INFO.version,
    seed,
    runId,
    timeline: primary.timeline,
    events: primary.events,
    decisions,
    risks,
    summary,
    durationMonths: input.vestingQuarters * 3,
    computedAt: new Date().toISOString(),
  };
}

export const rsuLiquidationTemplate: SimTemplate<RSULiquidationInput> = {
  info: INFO,
  validate,
  run,
};
