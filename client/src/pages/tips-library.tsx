import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Lightbulb, 
  Search,
  Wallet,
  PiggyBank,
  TrendingUp,
  ShieldAlert,
  CreditCard,
  Home,
  Plane,
  Laptop,
  ChevronDown,
  ChevronUp,
  Sparkles
} from "lucide-react";

interface Tip {
  id: string;
  category: string;
  title: string;
  content: string;
  icon: typeof Lightbulb;
}

const TIPS: Tip[] = [
  // Saving
  { id: "1", category: "saving", title: "Pay yourself first", content: "Automate your savings — what you don't see, you won't spend. Set up automatic transfers to savings on payday.", icon: PiggyBank },
  { id: "2", category: "saving", title: "The 24-hour rule", content: "A 24-hour rule on big purchases prevents impulse regret. Sleep on major decisions before buying.", icon: PiggyBank },
  { id: "3", category: "saving", title: "Track subscriptions", content: "Track subscriptions monthly; small leaks sink big ships. Cancel services you don't actively use.", icon: PiggyBank },
  { id: "4", category: "saving", title: "Emergency fund priority", content: "An emergency fund is peace of mind, not wasted money. Aim for 3-6 months of expenses.", icon: PiggyBank },
  
  // Spending
  { id: "5", category: "spending", title: "Cost-per-use thinking", content: "Compare cost-per-use, not just price tags. A $200 jacket worn 100 times costs less than a $50 one worn twice.", icon: Wallet },
  { id: "6", category: "spending", title: "Lifestyle creep awareness", content: "Lifestyle creep happens slowly — review expenses quarterly. When income rises, save the difference first.", icon: Wallet },
  { id: "7", category: "spending", title: "Budget what's left", content: "Pay yourself first, then budget what's left. Don't budget to see what you can save.", icon: Wallet },
  { id: "8", category: "spending", title: "Needs vs wants", content: "Before buying, ask: 'Will I still want this in 30 days?' Most impulse wants fade quickly.", icon: Wallet },
  
  // Investing
  { id: "9", category: "investing", title: "Start early, stay consistent", content: "Time in the market beats timing the market. Starting with $50/month at 25 beats $500/month at 45.", icon: TrendingUp },
  { id: "10", category: "investing", title: "Diversification is protection", content: "Never have more than 10-15% of your portfolio in any single stock, including company stock.", icon: TrendingUp },
  { id: "11", category: "investing", title: "Index funds for beginners", content: "Low-cost index funds outperform most actively managed funds over time. Keep it simple.", icon: TrendingUp },
  { id: "12", category: "investing", title: "Compound interest magic", content: "Compound interest is the 8th wonder of the world. $10,000 at 7% becomes $76,000 in 30 years.", icon: TrendingUp },
  
  // Debt
  { id: "13", category: "debt", title: "High-interest first", content: "Pay off high-interest debt first (usually credit cards). Minimum on others until the first is clear.", icon: CreditCard },
  { id: "14", category: "debt", title: "Credit score matters", content: "Your credit score affects loan rates, rent applications, and even job offers. Check it regularly.", icon: CreditCard },
  { id: "15", category: "debt", title: "Avoid lifestyle debt", content: "Never go into debt for lifestyle upgrades. If you can't afford it in cash, you can't afford it.", icon: CreditCard },
  { id: "16", category: "debt", title: "Debt avalanche vs snowball", content: "Avalanche (highest rate first) saves money. Snowball (smallest balance first) builds momentum. Pick what works for you.", icon: CreditCard },
  
  // Scam Protection
  { id: "17", category: "scam", title: "If it seems too good...", content: "If returns seem too good to be true, they are. 10% guaranteed returns don't exist in legitimate investments.", icon: ShieldAlert },
  { id: "18", category: "scam", title: "Never share sensitive info", content: "Banks never ask for passwords or PINs via email or phone. When in doubt, hang up and call back.", icon: ShieldAlert },
  { id: "19", category: "scam", title: "Pressure means walk away", content: "Legitimate opportunities don't expire in 24 hours. High-pressure tactics are a red flag.", icon: ShieldAlert },
  { id: "20", category: "scam", title: "Verify before trusting", content: "Verify identities independently. Scammers can spoof caller IDs and email addresses.", icon: ShieldAlert },
  
  // Lifestyle
  { id: "21", category: "lifestyle", title: "Housing costs rule", content: "Keep housing costs under 30% of gross income. Under 25% gives you real financial flexibility.", icon: Home },
  { id: "22", category: "lifestyle", title: "The latte factor is real", content: "$5/day on small luxuries = $1,825/year = $100,000+ over 20 years if invested.", icon: Home },
  { id: "23", category: "lifestyle", title: "Experiences over things", content: "Research shows spending on experiences brings more lasting happiness than material goods.", icon: Home },
  
  // Tech
  { id: "24", category: "tech", title: "Subscription audit", content: "Audit all subscriptions quarterly. The average person wastes $200+/month on unused services.", icon: Laptop },
  { id: "25", category: "tech", title: "Buy refurbished tech", content: "Certified refurbished devices are 30-50% cheaper with same warranties. Smart money move.", icon: Laptop },
  
  // Travel
  { id: "26", category: "travel", title: "Travel rewards strategy", content: "Use credit card points strategically. The same 50,000 points can be worth $500 or $2,000 depending on redemption.", icon: Plane },
  { id: "27", category: "travel", title: "Book flights strategically", content: "Domestic flights are cheapest 1-3 months out. International? 2-8 months ahead.", icon: Plane },
];

const CATEGORIES = [
  { id: "all", label: "All Tips", icon: Sparkles },
  { id: "saving", label: "Saving", icon: PiggyBank },
  { id: "spending", label: "Spending", icon: Wallet },
  { id: "investing", label: "Investing", icon: TrendingUp },
  { id: "debt", label: "Debt", icon: CreditCard },
  { id: "scam", label: "Scam Protection", icon: ShieldAlert },
  { id: "lifestyle", label: "Lifestyle", icon: Home },
  { id: "tech", label: "Tech", icon: Laptop },
  { id: "travel", label: "Travel", icon: Plane },
];

export default function TipsLibrary() {
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  const filteredTips = TIPS.filter((tip) => {
    const matchesCategory = selectedCategory === "all" || tip.category === selectedCategory;
    const matchesSearch = 
      searchQuery === "" ||
      tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <h1 className="font-display font-bold text-lg tracking-tight" data-testid="text-page-title">
            Financial Tips Library
          </h1>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-tips"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            return (
              <Badge
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer gap-1 ${isSelected ? "" : "hover-elevate"}`}
                onClick={() => setSelectedCategory(category.id)}
                data-testid={`badge-category-${category.id}`}
              >
                <Icon className="w-3 h-3" />
                {category.label}
              </Badge>
            );
          })}
        </div>

        {/* Tips Count */}
        <p className="text-sm text-muted-foreground">
          {filteredTips.length} tip{filteredTips.length !== 1 ? "s" : ""} found
        </p>

        {/* Tips List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTips.map((tip, index) => {
              const Icon = tip.icon;
              const isExpanded = expandedTip === tip.id;
              
              return (
                <motion.div
                  key={tip.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card
                    className="p-4 cursor-pointer hover-elevate"
                    onClick={() => setExpandedTip(isExpanded ? null : tip.id)}
                    data-testid={`card-tip-${tip.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-medium text-sm">{tip.title}</h3>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-sm text-muted-foreground mt-2"
                            >
                              {tip.content}
                            </motion.p>
                          )}
                        </AnimatePresence>
                        {!isExpanded && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {tip.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredTips.length === 0 && (
          <div className="text-center py-12">
            <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No tips found matching your search.</p>
          </div>
        )}
      </main>
    </div>
  );
}
