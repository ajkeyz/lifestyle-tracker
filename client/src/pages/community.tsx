import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CreatorLeaderboard } from "@/components/creator-leaderboard";
import {
  ArrowLeft,
  Plus,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Flame,
  Clock,
  TrendingUp,
  Trophy,
  Heart,
  Users,
  Smartphone,
  Plane,
  Sparkles,
  AlertTriangle,
  CreditCard,
  Briefcase,
  Award,
} from "lucide-react";
import type { CommunityScenario, COMMUNITY_CATEGORIES } from "@shared/schema";

const CATEGORY_ICONS: Record<string, typeof Smartphone> = {
  tech: Smartphone,
  travel: Plane,
  lifestyle: Sparkles,
  scam: AlertTriangle,
  investing: TrendingUp,
  debt: CreditCard,
  career: Briefcase,
  relationships: Users,
};

const CATEGORY_LABELS: Record<string, string> = {
  tech: "Tech",
  travel: "Travel",
  lifestyle: "Lifestyle",
  scam: "Scams",
  investing: "Investing",
  debt: "Debt",
  career: "Career",
  relationships: "Friends & Family",
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function ScenarioCard({ 
  scenario, 
  onVote, 
  onClick,
  isVoting,
  showBadge = false,
}: { 
  scenario: CommunityScenario; 
  onVote: (type: "up" | "down") => void;
  onClick: () => void;
  isVoting: boolean;
  showBadge?: boolean;
}) {
  const CategoryIcon = CATEGORY_ICONS[scenario.category] || Sparkles;
  const netVotes = scenario.upvotes - scenario.downvotes;
  const unlockedBadges = scenario.authorBadges.filter(b => b.unlocked);
  
  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5"
      onClick={onClick}
      data-testid={`card-scenario-${scenario.id}`}
    >
      <CardContent className="p-6 space-y-3">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="flex flex-col items-center gap-1">
            <Button
              variant={scenario.userVote === "up" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onVote("up"); }}
              disabled={isVoting}
              data-testid={`button-upvote-${scenario.id}`}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span className={`text-sm font-semibold ${netVotes > 0 ? "text-green-500" : netVotes < 0 ? "text-red-500" : ""}`}>
              {netVotes}
            </span>
            <Button
              variant={scenario.userVote === "down" ? "destructive" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={(e) => { e.stopPropagation(); onVote("down"); }}
              disabled={isVoting}
              data-testid={`button-downvote-${scenario.id}`}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {scenario.isRealistOfWeek && (
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                  <Flame className="w-3 h-3 mr-1" />
                  Realest
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                <CategoryIcon className="w-3 h-3 mr-1" />
                {CATEGORY_LABELS[scenario.category]}
              </Badge>
              {scenario.type === "hypothetical" && (
                <Badge variant="secondary" className="text-xs">Hypothetical</Badge>
              )}
            </div>
            
            <h3 className="font-semibold line-clamp-2 mb-2" data-testid={`text-scenario-title-${scenario.id}`}>
              {scenario.title}
            </h3>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {scenario.context}
            </p>
            
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-primary/10">
                    {scenario.authorUsername.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">{scenario.authorUsername}</span>
                {showBadge && unlockedBadges.length > 0 && (
                  <Badge variant="outline" className="text-xs h-5">
                    <Award className="w-3 h-3 mr-1" />
                    {unlockedBadges.length}
                  </Badge>
                )}
                {scenario.authorMoneyHealth > 80 && (
                  <Badge variant="outline" className="text-xs h-5 border-green-500/50 text-green-500">
                    <Heart className="w-3 h-3 mr-1" />
                    {scenario.authorMoneyHealth}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {scenario.commentCount}
                </span>
                <span>{formatTimeAgo(scenario.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Community() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState<"latest" | "hot" | "realest">("hot");
  const [category, setCategory] = useState<string>("all");
  const [votingId, setVotingId] = useState<string | null>(null);

  const { data: scenarios, isLoading } = useQuery<CommunityScenario[]>({
    queryKey: ["/api/community/scenarios", { category, sortBy }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (category !== "all") params.append("category", category);
      params.append("sortBy", sortBy);
      const res = await fetch(`/api/community/scenarios?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch scenarios");
      return res.json();
    },
  });

  const { data: realistOfWeek } = useQuery<CommunityScenario[]>({
    queryKey: ["/api/community/realest-of-week"],
  });

  const voteMutation = useMutation({
    mutationFn: async ({ scenarioId, type }: { scenarioId: string; type: "up" | "down" }) => {
      setVotingId(scenarioId);
      return apiRequest("POST", `/api/community/scenarios/${scenarioId}/vote`, { type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/scenarios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/realest-of-week"] });
    },
    onSettled: () => {
      setVotingId(null);
    },
  });

  const categories = [
    { id: "all", label: "All" },
    { id: "relationships", label: "Friends" },
    { id: "lifestyle", label: "Lifestyle" },
    { id: "career", label: "Career" },
    { id: "investing", label: "Investing" },
    { id: "debt", label: "Debt" },
    { id: "scam", label: "Scams" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
      <header className="flex items-center justify-between gap-4 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-bold text-lg" data-testid="text-page-title">Community</h1>
            <p className="text-xs text-muted-foreground">Real scenarios, real advice</p>
          </div>
        </div>
        <Button
          className="btn-gold border-0 font-semibold"
          onClick={() => navigate("/community/submit")}
          data-testid="button-submit-scenario"
        >
          <Plus className="w-4 h-4 mr-2" />
          Submit
        </Button>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-6">
        {realistOfWeek && realistOfWeek.length > 0 && realistOfWeek[0].isRealistOfWeek && (
          <Card className="border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-transparent" data-testid="card-realest-of-week">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Realest Scenario of the Week
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <ScenarioCard
                scenario={realistOfWeek[0]}
                onVote={(type) => voteMutation.mutate({ scenarioId: realistOfWeek[0].id, type })}
                onClick={() => navigate(`/community/${realistOfWeek[0].id}`)}
                isVoting={votingId === realistOfWeek[0].id}
                showBadge
              />
            </CardContent>
          </Card>
        )}

        {/* Top Creators Leaderboard */}
        <CreatorLeaderboard limit={5} showTitle={true} />

        <div className="space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={category === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(cat.id)}
                data-testid={`button-category-${cat.id}`}
              >
                {cat.label}
              </Button>
            ))}
          </div>

          <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <TabsList className="w-full">
              <TabsTrigger value="hot" className="flex-1" data-testid="tab-hot">
                <Flame className="w-4 h-4 mr-2" />
                Hot
              </TabsTrigger>
              <TabsTrigger value="latest" className="flex-1" data-testid="tab-latest">
                <Clock className="w-4 h-4 mr-2" />
                Latest
              </TabsTrigger>
              <TabsTrigger value="realest" className="flex-1" data-testid="tab-realest">
                <TrendingUp className="w-4 h-4 mr-2" />
                Top
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <>
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </>
          ) : scenarios && scenarios.length > 0 ? (
            scenarios.map((scenario) => (
              <ScenarioCard
                key={scenario.id}
                scenario={scenario}
                onVote={(type) => voteMutation.mutate({ scenarioId: scenario.id, type })}
                onClick={() => navigate(`/community/${scenario.id}`)}
                isVoting={votingId === scenario.id}
                showBadge
              />
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No scenarios yet</p>
                <p className="text-sm text-muted-foreground mb-4">Someone will read this before their next purchase.</p>
                <Button onClick={() => navigate("/community/submit")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Scenario
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
