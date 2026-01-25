import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  ChevronDown,
  ChevronUp,
  Heart,
  Brain,
  Calendar,
  FileQuestion,
  Users,
  Scale,
  MessageCircle,
  Flag
} from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  icon: typeof Heart;
}

const faqItems: FAQItem[] = [
  {
    id: "money-health",
    question: "What is Money Health?",
    answer: "Money Health is your overall financial wellness score from 0-100. It combines your cash flow, debt levels, credit score, stress levels, and investments into one easy-to-understand number. Think of it like a fitness tracker, but for your finances. Higher is better, and it changes based on the decisions you make in the game.",
    icon: Heart,
  },
  {
    id: "stress",
    question: "How is Stress calculated?",
    answer: "Stress reflects the mental burden of your financial decisions. Taking on high-interest debt, living paycheck to paycheck, or making risky investments increases stress. Building savings, paying off debt, and making stable choices reduces it. Low stress (under 30) means financial peace of mind. High stress (over 70) means your finances are causing anxiety.",
    icon: Brain,
  },
  {
    id: "miss-day",
    question: "What if I miss a day?",
    answer: "Missing a day normally breaks your streak. However, you can use Freeze Tokens to protect your streak. Each freeze token covers one missed day. You earn freeze tokens by hitting streak milestones (7, 14, 30 days). If you have a token and miss a day, it's automatically used to keep your streak alive.",
    icon: Calendar,
  },
  {
    id: "real-scenarios",
    question: "Are scenarios real?",
    answer: "Yes and no. Each scenario is inspired by real financial situations people face every day — from subscription traps to investment opportunities to debt decisions. We simplify them for quick gameplay, but the lessons are based on real financial principles and common money mistakes.",
    icon: FileQuestion,
  },
  {
    id: "friend-leagues",
    question: "How do friend leagues work?",
    answer: "Leagues let you compete with friends on a weekly basis. Create or join a league with an invite code. Each week, everyone's scores reset and you compete for the top spot. The winner gets bragging rights and a crown badge. Leagues are optional — if competition stresses you out, try Low Pressure Mode in Settings.",
    icon: Users,
  },
  {
    id: "is-advice",
    question: "Is this advice?",
    answer: "No. Lifestyle Creep is an educational game, not financial advice. We teach general money principles through gameplay, but everyone's situation is different. For personal financial decisions, consult a qualified financial advisor. Our goal is to help you think critically about money, not tell you exactly what to do.",
    icon: Scale,
  },
];

export default function Help() {
  const [, navigate] = useLocation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleContactSupport = () => {
    window.open("mailto:support@lifestylecreep.app?subject=Help%20Request", "_blank");
  };

  const handleReportScenario = () => {
    window.open("mailto:support@lifestylecreep.app?subject=Scenario%20Report&body=Please%20describe%20the%20scenario%20and%20issue:", "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center gap-3 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg" data-testid="text-page-title">Help & FAQ</h1>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-4">
        <p className="text-sm text-muted-foreground mb-4">
          Tap a question to see the answer
        </p>

        {faqItems.map((item) => {
          const isExpanded = expandedId === item.id;
          const Icon = item.icon;
          
          return (
            <Card 
              key={item.id} 
              className="cursor-pointer overflow-hidden"
              onClick={() => toggleExpanded(item.id)}
              data-testid={`card-faq-${item.id}`}
            >
              <CardHeader className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-base font-medium">{item.question}</CardTitle>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="px-4 pb-4 pt-0">
                  <p className="text-sm text-muted-foreground leading-relaxed pl-13">
                    {item.answer}
                  </p>
                </CardContent>
              )}
            </Card>
          );
        })}

        <div className="pt-6 space-y-3">
          <p className="text-sm font-medium text-center text-muted-foreground">
            Still need help?
          </p>
          
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={handleContactSupport}
            data-testid="button-contact-support"
          >
            <MessageCircle className="w-4 h-4" />
            Contact Support
          </Button>

          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={handleReportScenario}
            data-testid="button-report-scenario"
          >
            <Flag className="w-4 h-4" />
            Report a Scenario
          </Button>
        </div>
      </main>
    </div>
  );
}
