/**
 * Buy a House Simulator
 *
 * Simulates home purchase over a configurable loan term.
 * Includes decision checkpoints (down payment strategy, refinance),
 * seeded random events (repair, income changes), and risk meters.
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

export interface BuyAHouseInput {
  // Core
  incomeMonthly: number;
  savingsCash: number;
  monthlyExpenses: number;
  homePrice: number;
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: 15 | 30;
  propertyTaxMonthly: number;
  insuranceMonthly: number;
  hoaMonthly: number;
  emergencyFundMonthsTarget: number;
  // Advanced
  maintenancePercentYearly: number;
  homeValueGrowthRate: number;
  rentAlternativeMonthly: number;
}

const DEFAULT_INPUTS: BuyAHouseInput = {
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
};

// ─── Template ────────────────────────────────────────────────────────────────

const INFO: SimTemplateInfo = {
  id: "buy_a_house",
  title: "Buy a House",
  description: "Simulate a home purchase and see how it affects your finances over time.",
  icon: "Home",
  category: "Major Purchases",
  estimatedTime: "3 min",
  version: "1.0.0",
  inputDefaults: DEFAULT_INPUTS as unknown as Record<string, unknown>,
};

function validate(input: BuyAHouseInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (input.incomeMonthly <= 0) errors.incomeMonthly = "Income must be positive.";
  if (input.savingsCash < 0) errors.savingsCash = "Savings cannot be negative.";
  if (input.homePrice <= 0) errors.homePrice = "Home price must be positive.";
  if (input.downPaymentPercent < 3 || input.downPaymentPercent > 100)
    errors.downPaymentPercent = "Down payment must be 3-100%.";
  if (input.interestRate <= 0 || input.interestRate > 20)
    errors.interestRate = "Rate must be between 0-20%.";
  if (input.loanTermYears !== 15 && input.loanTermYears !== 30)
    errors.loanTermYears = "Must be 15 or 30 years.";
  if (input.monthlyExpenses < 0) errors.monthlyExpenses = "Expenses cannot be negative.";
  if (input.emergencyFundMonthsTarget < 1 || input.emergencyFundMonthsTarget > 24)
    errors.emergencyFundMonthsTarget = "Must be 1-24 months.";
  return errors;
}

function calculateMonthlyPayment(principal: number, annualRate: number, termMonths: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return principal / termMonths;
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

function run(
  input: BuyAHouseInput,
  seed: number,
  userDecisions: Record<string, string> = {}
): SimulationResult {
  const rng = createRNG(seed);
  const runId = generateRunId();

  // ── Derived values ──
  const downPayment = input.homePrice * (input.downPaymentPercent / 100);
  const loanAmount = input.homePrice - downPayment;
  const termMonths = input.loanTermYears * 12;
  let interestRate = input.interestRate;
  const simDuration = Math.min(termMonths, 60); // Simulate up to 5 years

  let mortgagePayment = calculateMonthlyPayment(loanAmount, interestRate, termMonths);
  const maintenanceMonthly = (input.homePrice * (input.maintenancePercentYearly / 100)) / 12;
  let totalHousingCost = mortgagePayment + input.propertyTaxMonthly + input.insuranceMonthly + input.hoaMonthly + maintenanceMonthly;

  // ── State tracking ──
  let cash = input.savingsCash - downPayment;
  let loanBalance = loanAmount;
  let homeValue = input.homePrice;
  let income = input.incomeMonthly;
  const monthlyGrowthRate = Math.pow(1 + input.homeValueGrowthRate / 100, 1 / 12) - 1;

  const timeline: TimelinePoint[] = [];
  const events: SimEvent[] = [];
  const decisions: DecisionCheckpoint[] = [];

  // ── Decision 1: Down payment strategy ──
  const downPaymentDecision: DecisionCheckpoint = {
    month: 0,
    id: "down_payment_strategy",
    prompt: "Choose your down payment strategy",
    options: [
      {
        id: "minimum",
        label: "Minimum (3%)",
        description: "Keep more cash on hand, but pay PMI (~$150/mo) and have a larger loan.",
        impact: { cash: +(downPayment - input.homePrice * 0.03), monthlyCost: +150 },
      },
      {
        id: "recommended",
        label: `Recommended (${input.downPaymentPercent}%)`,
        description: "Balance between cash reserves and lower monthly payments.",
        impact: { cash: 0, monthlyCost: 0 },
      },
    ],
    chosenOptionId: userDecisions["down_payment_strategy"] || "recommended",
  };
  decisions.push(downPaymentDecision);

  // Apply decision 1
  if (downPaymentDecision.chosenOptionId === "minimum") {
    const minDown = input.homePrice * 0.03;
    cash = input.savingsCash - minDown;
    const newLoan = input.homePrice - minDown;
    loanBalance = newLoan;
    mortgagePayment = calculateMonthlyPayment(newLoan, interestRate, termMonths);
    totalHousingCost = mortgagePayment + input.propertyTaxMonthly + input.insuranceMonthly + input.hoaMonthly + maintenanceMonthly + 150; // PMI
  }

  // Initial event
  events.push({
    month: 0,
    type: "info",
    title: "Home Purchased!",
    description: `You bought a home for ${formatCurrency(input.homePrice)} with ${formatCurrency(downPaymentDecision.chosenOptionId === "minimum" ? input.homePrice * 0.03 : downPayment)} down.`,
  });

  // ── Monthly simulation loop ──
  let worstCashMonth = cash;
  let worstCashMonthIndex = 0;
  let totalRentSavings = 0;

  for (let m = 1; m <= simDuration; m++) {
    // Income
    cash += income;

    // Housing costs
    cash -= totalHousingCost;

    // Other expenses
    cash -= input.monthlyExpenses;

    // Loan amortization
    const monthlyInterest = (interestRate / 100 / 12) * loanBalance;
    const principalPayment = mortgagePayment - monthlyInterest;
    loanBalance = Math.max(0, loanBalance - principalPayment);

    // Home appreciation
    homeValue *= 1 + monthlyGrowthRate;

    // Rent comparison
    totalRentSavings += input.rentAlternativeMonthly - totalHousingCost;

    // Track worst cash month
    if (cash < worstCashMonth) {
      worstCashMonth = cash;
      worstCashMonthIndex = m;
    }

    // ── Random events (seeded) ──

    // Surprise repair (year 1-3, ~15% chance each year checked quarterly)
    if (m >= 6 && m <= 36 && m % 3 === 0 && rng() < 0.05) {
      const repairCost = Math.round(2000 + rng() * 8000);
      cash -= repairCost;
      events.push({
        month: m,
        type: "negative",
        title: "Surprise Repair",
        description: `Unexpected ${rng() > 0.5 ? "plumbing" : "roof"} repair cost ${formatCurrency(repairCost)}.`,
        impact: { cash: -repairCost },
      });
    }

    // Income change (bonus or dip, ~10% chance at month 12, 24, 36)
    if (m === 12 || m === 24 || m === 36) {
      const roll = rng();
      if (roll < 0.15) {
        // Bonus
        const bonus = Math.round(income * (0.5 + rng() * 1.5));
        cash += bonus;
        events.push({
          month: m,
          type: "positive",
          title: "Year-End Bonus!",
          description: `You received a ${formatCurrency(bonus)} bonus.`,
          impact: { cash: bonus },
        });
      } else if (roll > 0.85) {
        // Income dip
        const reduction = Math.round(income * 0.1);
        income -= reduction;
        events.push({
          month: m,
          type: "negative",
          title: "Income Reduction",
          description: `Your monthly income decreased by ${formatCurrency(reduction)} due to industry changes.`,
          impact: { incomeMonthly: -reduction },
        });
      }
    }

    // ── Decision 2: Refinance opportunity at ~month 24 ──
    if (m === 24) {
      const rateDropChance = rng();
      if (rateDropChance < 0.6) {
        const newRate = Math.max(3.5, interestRate - 1.0 - rng() * 0.5);
        const closingCost = Math.round(loanBalance * 0.015);

        const refiDecision: DecisionCheckpoint = {
          month: m,
          id: "refinance_opportunity",
          prompt: `Rates dropped! You could refinance from ${interestRate.toFixed(1)}% to ${newRate.toFixed(1)}%.`,
          options: [
            {
              id: "refinance",
              label: "Refinance",
              description: `Pay ${formatCurrency(closingCost)} closing costs, save ~${formatCurrency(
                (mortgagePayment - calculateMonthlyPayment(loanBalance, newRate, termMonths - m))
              )}/mo.`,
              impact: { cash: -closingCost, interestRate: -(interestRate - newRate) },
            },
            {
              id: "keep_rate",
              label: "Keep Current Rate",
              description: "No closing costs, keep current payment.",
              impact: {},
            },
          ],
          chosenOptionId: userDecisions["refinance_opportunity"] || "refinance",
        };
        decisions.push(refiDecision);

        if (refiDecision.chosenOptionId === "refinance") {
          cash -= closingCost;
          interestRate = newRate;
          mortgagePayment = calculateMonthlyPayment(loanBalance, newRate, termMonths - m);
          totalHousingCost = mortgagePayment + input.propertyTaxMonthly + input.insuranceMonthly + input.hoaMonthly + maintenanceMonthly;

          events.push({
            month: m,
            type: "positive",
            title: "Refinanced!",
            description: `New rate: ${newRate.toFixed(1)}%. Closing costs: ${formatCurrency(closingCost)}.`,
            impact: { interestRate: -((input.interestRate - newRate)), cash: -closingCost },
          });
        } else {
          events.push({
            month: m,
            type: "info",
            title: "Refinance Declined",
            description: `You chose to keep your ${interestRate.toFixed(1)}% rate.`,
          });
        }
      }
    }

    // ── Record timeline point ──
    const equity = homeValue - loanBalance;
    const netWorth = cash + equity;
    const label = m % 12 === 0 ? `Year ${m / 12}` : `Month ${m}`;

    timeline.push({
      month: m,
      label,
      metrics: {
        cash: Math.round(cash),
        homeValue: Math.round(homeValue),
        loanBalance: Math.round(loanBalance),
        equity: Math.round(equity),
        netWorth: Math.round(netWorth),
        monthlyPayment: Math.round(totalHousingCost),
        cashRunwayMonths: totalHousingCost + input.monthlyExpenses > 0
          ? Math.max(0, Math.round(cash / (totalHousingCost + input.monthlyExpenses)))
          : 99,
      },
    });
  }

  // ── Risk Meters ──
  const finalCash = timeline[timeline.length - 1]?.metrics.cash ?? cash;
  const finalRunway = totalHousingCost + input.monthlyExpenses > 0
    ? finalCash / (totalHousingCost + input.monthlyExpenses)
    : 99;
  const housingRatio = totalHousingCost / income;

  const housePoorRisk = Math.min(100, Math.round(housingRatio * 100 * 2.5)); // >40% = critical
  const emergencyFundRisk = Math.min(
    100,
    Math.max(0, Math.round(100 - (finalRunway / input.emergencyFundMonthsTarget) * 100))
  );

  const risks: RiskMeter[] = [
    {
      id: "house_poor",
      label: "House Poor Risk",
      value: housePoorRisk,
      level: riskLevel(housePoorRisk),
      description: `Housing costs are ${Math.round(housingRatio * 100)}% of income. Recommended: under 28%.`,
    },
    {
      id: "emergency_fund",
      label: "Emergency Fund Risk",
      value: emergencyFundRisk,
      level: riskLevel(emergencyFundRisk),
      description: `Cash runway: ${Math.round(finalRunway)} months. Target: ${input.emergencyFundMonthsTarget} months.`,
    },
  ];

  // ── Summary Metrics ──
  const finalEquity = Math.round(homeValue - loanBalance);
  const finalNetWorth = Math.round(finalCash + finalEquity);
  const breakEvenMonth = timeline.findIndex(
    (t) => totalRentSavings < 0 && t.metrics.netWorth > input.savingsCash
  );

  const summary: SummaryMetric[] = [
    {
      id: "monthly_payment",
      label: "Monthly Payment (PITI)",
      value: Math.round(totalHousingCost),
      formattedValue: formatCurrency(Math.round(totalHousingCost)),
      description: "Principal + Interest + Tax + Insurance + HOA + Maintenance",
    },
    {
      id: "net_worth_5yr",
      label: "Projected Net Worth (5yr)",
      value: finalNetWorth,
      formattedValue: formatCurrency(finalNetWorth),
      trend: finalNetWorth > input.savingsCash ? "up" : "down",
    },
    {
      id: "home_equity",
      label: "Home Equity (5yr)",
      value: finalEquity,
      formattedValue: formatCurrency(finalEquity),
      trend: "up",
    },
    {
      id: "cash_remaining",
      label: "Cash Remaining",
      value: Math.round(finalCash),
      formattedValue: formatCurrency(Math.round(finalCash)),
      trend: finalCash > 0 ? "neutral" : "down",
    },
    {
      id: "worst_cash_month",
      label: "Lowest Cash Point",
      value: Math.round(worstCashMonth),
      formattedValue: `${formatCurrency(Math.round(worstCashMonth))} (Month ${worstCashMonthIndex})`,
      trend: worstCashMonth < 0 ? "down" : "neutral",
    },
    {
      id: "rent_vs_buy",
      label: "Buy vs Rent (5yr)",
      value: Math.round(-totalRentSavings),
      formattedValue: totalRentSavings < 0
        ? `Buying saves ${formatCurrency(Math.round(-totalRentSavings))}`
        : `Renting saves ${formatCurrency(Math.round(totalRentSavings))}`,
      trend: totalRentSavings < 0 ? "up" : "down",
    },
  ];

  return {
    templateId: "buy_a_house",
    templateVersion: INFO.version,
    seed,
    runId,
    timeline,
    events,
    decisions,
    risks,
    summary,
    durationMonths: simDuration,
    computedAt: new Date().toISOString(),
  };
}

export const buyAHouseTemplate: SimTemplate<BuyAHouseInput> = {
  info: INFO,
  validate,
  run,
};
