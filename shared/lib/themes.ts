import type { ScenarioCategory } from "@shared/schema";

export type ThemeId =
  | "investing"
  | "housing"
  | "lifestyle_creep"
  | "debt_freedom"
  | "scam_defense"
  | "relationships_money";

export interface ThemeDef {
  id: ThemeId;
  label: string;
  description: string;
  /** Lucide icon name — looked up on the client to avoid dragging React deps server-side */
  icon: string;
  /** Tailwind gradient class for the icon background */
  gradient: string;
  /** Scenario categories that contribute to this theme's question pool */
  categories: ScenarioCategory[];
}

export const THEMES: ThemeDef[] = [
  {
    id: "investing",
    label: "Investing 101",
    description: "Markets, compound growth, risk vs. reward",
    icon: "TrendingUp",
    gradient: "bg-gradient-to-br from-emerald-500 to-green-600",
    categories: ["investing", "windfall"],
  },
  {
    id: "housing",
    label: "Buying a House",
    description: "Rent vs. buy, mortgages, down payments",
    icon: "Home",
    gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
    categories: ["housing", "debt"],
  },
  {
    id: "lifestyle_creep",
    label: "Lifestyle Creep",
    description: "Subscriptions, upgrades, daily spending",
    icon: "ShoppingBag",
    gradient: "bg-gradient-to-br from-purple-500 to-pink-500",
    categories: ["lifestyle", "tech", "travel"],
  },
  {
    id: "debt_freedom",
    label: "Crushing Debt",
    description: "Credit cards, loans, payoff strategies",
    icon: "CreditCard",
    gradient: "bg-gradient-to-br from-red-500 to-rose-600",
    categories: ["debt", "credit", "budgeting"],
  },
  {
    id: "scam_defense",
    label: "Scam Defense",
    description: "Spotting fraud, protecting your money",
    icon: "ShieldAlert",
    gradient: "bg-gradient-to-br from-orange-500 to-red-500",
    categories: ["scam", "emergency"],
  },
  {
    id: "relationships_money",
    label: "Money & People",
    description: "Splitting bills, family, generosity",
    icon: "Users",
    gradient: "bg-gradient-to-br from-blue-500 to-indigo-600",
    categories: ["relationships", "family", "giving"],
  },
];

export const THEME_BY_ID: Record<ThemeId, ThemeDef> = THEMES.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<ThemeId, ThemeDef>,
);

export const DEFAULT_THEME: ThemeId = "lifestyle_creep";

export function isValidThemeId(id: string): id is ThemeId {
  return id in THEME_BY_ID;
}

/** Returns the Monday (UTC) of the current week as YYYY-MM-DD. */
export function getCurrentWeekStart(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  // getUTCDay: Sunday = 0, Monday = 1, ... Saturday = 6
  const day = d.getUTCDay();
  const daysSinceMonday = (day + 6) % 7; // Mon=0, Tue=1, ..., Sun=6
  d.setUTCDate(d.getUTCDate() - daysSinceMonday);
  return d.toISOString().slice(0, 10);
}

/** True when current week's Monday is later than the user's stored themeWeekStart. */
export function isThemeChangeAllowed(themeWeekStart: string | null | undefined, now: Date = new Date()): boolean {
  if (!themeWeekStart) return true; // never picked → always allowed
  return getCurrentWeekStart(now) > themeWeekStart;
}

/** Returns ISO timestamp of next Monday 00:00 UTC. */
export function getNextThemeChangeAt(now: Date = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay();
  const daysUntilNextMonday = ((1 - day + 7) % 7) || 7;
  d.setUTCDate(d.getUTCDate() + daysUntilNextMonday);
  return d.toISOString();
}
