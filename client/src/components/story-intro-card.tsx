import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  Plane,
  ShoppingBag,
  ShieldAlert,
  TrendingUp,
  CreditCard,
  Briefcase,
  Heart,
} from "lucide-react";

type ScenarioCategory = "tech" | "travel" | "lifestyle" | "scam" | "investing" | "debt" | "career" | "relationships";

interface StoryTemplate {
  icon: typeof Smartphone;
  persona: string;
  intro: string;
  color: string;
  bg: string;
}

const storyTemplates: Record<ScenarioCategory, StoryTemplate> = {
  tech: {
    icon: Smartphone,
    persona: "The Early Adopter",
    intro: "New tech drops daily. Upgrades whisper promises of a better life. But does shinier always mean smarter?",
    color: "text-blue-500",
    bg: "from-blue-500/10 to-blue-500/5",
  },
  travel: {
    icon: Plane,
    persona: "The Wanderer",
    intro: "The world beckons with deals and destinations. Every trip is a story, but every booking is a trade-off.",
    color: "text-sky-500",
    bg: "from-sky-500/10 to-sky-500/5",
  },
  lifestyle: {
    icon: ShoppingBag,
    persona: "The Daily Decider",
    intro: "Coffee runs, subscriptions, impulse buys. Small choices that quietly shape your financial future.",
    color: "text-emerald-500",
    bg: "from-emerald-500/10 to-emerald-500/5",
  },
  scam: {
    icon: ShieldAlert,
    persona: "The Skeptic",
    intro: "Too-good-to-be-true offers lurk everywhere. Can you spot the traps before they spring?",
    color: "text-red-500",
    bg: "from-red-500/10 to-red-500/5",
  },
  investing: {
    icon: TrendingUp,
    persona: "The Builder",
    intro: "Markets move fast. Friends share hot tips. The real question: do you know your risk from your reward?",
    color: "text-green-500",
    bg: "from-green-500/10 to-green-500/5",
  },
  debt: {
    icon: CreditCard,
    persona: "The Balancer",
    intro: "Bills pile up. Minimum payments feel easy. But the math of debt has a way of catching up.",
    color: "text-orange-500",
    bg: "from-orange-500/10 to-orange-500/5",
  },
  career: {
    icon: Briefcase,
    persona: "The Climber",
    intro: "Salary negotiations, side hustles, career pivots. Your biggest asset is your earning potential.",
    color: "text-violet-500",
    bg: "from-violet-500/10 to-violet-500/5",
  },
  relationships: {
    icon: Heart,
    persona: "The Partner",
    intro: "Money and relationships are deeply intertwined. Splitting bills, shared goals, and the conversations nobody wants to have.",
    color: "text-pink-500",
    bg: "from-pink-500/10 to-pink-500/5",
  },
};

interface StoryIntroCardProps {
  category: ScenarioCategory;
  onBegin: () => void;
}

export function StoryIntroCard({ category, onBegin }: StoryIntroCardProps) {
  const template = storyTemplates[category] || storyTemplates.lifestyle;
  const Icon = template.icon;

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      data-testid="story-intro-card"
    >
      <motion.div
        className={`w-20 h-20 rounded-2xl bg-gradient-to-b ${template.bg} flex items-center justify-center mb-6`}
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
      >
        <Icon className={`w-10 h-10 ${template.color}`} />
      </motion.div>

      <motion.p
        className={`text-xs font-semibold uppercase tracking-widest ${template.color} mb-2`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {template.persona}
      </motion.p>

      <motion.h2
        className="text-xl font-bold mb-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        Today&apos;s Scenario
      </motion.h2>

      <motion.p
        className="text-sm text-muted-foreground leading-relaxed max-w-sm mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {template.intro}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          size="lg"
          onClick={onBegin}
          className="px-8 rounded-full"
          data-testid="btn-begin-story"
        >
          Begin
        </Button>
      </motion.div>
    </motion.div>
  );
}
