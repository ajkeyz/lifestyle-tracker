import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Send,
  Flame,
  Heart,
  Users,
  Smartphone,
  Plane,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Briefcase,
  Award,
  Lightbulb,
  Shield,
} from "lucide-react";
import type { CommunityScenario, CommunityComment } from "@shared/schema";

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
  tech: "Tech & Gadgets",
  travel: "Travel",
  lifestyle: "Lifestyle",
  scam: "Scams & Fraud",
  investing: "Investing",
  debt: "Debt & Loans",
  career: "Career & Salary",
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

function CommentCard({ 
  comment, 
  onVote,
  isVoting,
}: { 
  comment: CommunityComment; 
  onVote: () => void;
  isVoting: boolean;
}) {
  const unlockedBadges = comment.authorBadges.filter(b => b.unlocked);
  
  return (
    <Card className={comment.isAdvice ? "border-l-4 border-l-green-500" : ""} data-testid={`card-comment-${comment.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary/10">
              {comment.authorUsername.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium text-sm">{comment.authorUsername}</span>
              {comment.isAdvice && (
                <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                  <Lightbulb className="w-3 h-3 mr-1" />
                  Advice
                </Badge>
              )}
              {unlockedBadges.length > 0 && (
                <Badge variant="outline" className="text-xs h-5">
                  <Award className="w-3 h-3 mr-1" />
                  {unlockedBadges.length}
                </Badge>
              )}
              {comment.authorMoneyHealth > 80 && (
                <Badge variant="outline" className="text-xs h-5 border-green-500/50 text-green-500">
                  <Heart className="w-3 h-3 mr-1" />
                  {comment.authorMoneyHealth}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{formatTimeAgo(comment.createdAt)}</span>
            </div>
            
            <p className="text-sm mb-2">{comment.content}</p>
            
            <Button
              variant={comment.userVote === "up" ? "default" : "ghost"}
              size="sm"
              className="h-7 px-2"
              onClick={onVote}
              disabled={isVoting}
              data-testid={`button-vote-comment-${comment.id}`}
            >
              <ArrowUp className="w-3 h-3 mr-1" />
              {comment.upvotes}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CommunityDetail() {
  const [, navigate] = useLocation();
  const params = useParams();
  const scenarioId = params.id as string;
  const { toast } = useToast();
  
  const [commentText, setCommentText] = useState("");
  const [isAdvice, setIsAdvice] = useState(false);
  const [votingCommentId, setVotingCommentId] = useState<string | null>(null);

  const { data: scenario, isLoading: scenarioLoading } = useQuery<CommunityScenario>({
    queryKey: ["/api/community/scenarios", scenarioId],
    queryFn: async () => {
      const res = await fetch(`/api/community/scenarios/${scenarioId}`);
      if (!res.ok) throw new Error("Failed to fetch scenario");
      return res.json();
    },
  });

  const { data: comments, isLoading: commentsLoading } = useQuery<CommunityComment[]>({
    queryKey: ["/api/community/scenarios", scenarioId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/community/scenarios/${scenarioId}/comments`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
  });

  const voteScenario = useMutation({
    mutationFn: async (type: "up" | "down") => {
      return apiRequest("POST", `/api/community/scenarios/${scenarioId}/vote`, { type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/scenarios", scenarioId] });
    },
  });

  const voteComment = useMutation({
    mutationFn: async (commentId: string) => {
      setVotingCommentId(commentId);
      return apiRequest("POST", `/api/community/comments/${commentId}/vote`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/scenarios", scenarioId, "comments"] });
    },
    onSettled: () => {
      setVotingCommentId(null);
    },
  });

  const addComment = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/community/comments", {
        scenarioId,
        content: commentText,
        isAdvice,
      });
    },
    onSuccess: () => {
      setCommentText("");
      setIsAdvice(false);
      queryClient.invalidateQueries({ queryKey: ["/api/community/scenarios", scenarioId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/scenarios", scenarioId] });
      toast({
        title: "Comment added",
        description: isAdvice ? "Your financial advice has been shared!" : "Your comment has been posted!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (scenarioLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4">
        <Button variant="ghost" onClick={() => navigate("/community")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="text-center mt-20">
          <p className="text-muted-foreground">Scenario not found</p>
        </div>
      </div>
    );
  }

  const CategoryIcon = CATEGORY_ICONS[scenario.category] || Sparkles;
  const netVotes = scenario.upvotes - scenario.downvotes;
  const unlockedBadges = scenario.authorBadges.filter(b => b.unlocked);
  const adviceComments = comments?.filter(c => c.isAdvice) || [];
  const regularComments = comments?.filter(c => !c.isAdvice) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center gap-3 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/community")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-bold text-lg truncate" data-testid="text-page-title">Scenario</h1>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-6">
        <Card data-testid="card-scenario-detail">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {scenario.isRealistOfWeek && (
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                  <Flame className="w-3 h-3 mr-1" />
                  Realest of the Week
                </Badge>
              )}
              <Badge variant="outline">
                <CategoryIcon className="w-3 h-3 mr-1" />
                {CATEGORY_LABELS[scenario.category]}
              </Badge>
              {scenario.type === "hypothetical" && (
                <Badge variant="secondary">Hypothetical</Badge>
              )}
            </div>

            <h2 className="text-xl font-bold" data-testid="text-scenario-title">{scenario.title}</h2>
            
            <p className="text-muted-foreground">{scenario.context}</p>
            
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <p className="font-medium">{scenario.question}</p>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10">
                    {scenario.authorUsername.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{scenario.authorUsername}</span>
                    {unlockedBadges.length > 0 && (
                      <Badge variant="outline" className="text-xs h-5">
                        <Award className="w-3 h-3 mr-1" />
                        {unlockedBadges.length} badges
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Heart className="w-3 h-3" />
                    <span>Money Health: {scenario.authorMoneyHealth}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant={scenario.userVote === "up" ? "default" : "outline"}
                  size="sm"
                  onClick={() => voteScenario.mutate("up")}
                  disabled={voteScenario.isPending}
                  data-testid="button-upvote"
                >
                  <ArrowUp className="w-4 h-4 mr-1" />
                  {scenario.upvotes}
                </Button>
                <Button
                  variant={scenario.userVote === "down" ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => voteScenario.mutate("down")}
                  disabled={voteScenario.isPending}
                  data-testid="button-downvote"
                >
                  <ArrowDown className="w-4 h-4 mr-1" />
                  {scenario.downvotes}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {adviceComments.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Shield className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold">Financial Advice</h3>
              <Badge variant="secondary" className="text-xs">{adviceComments.length}</Badge>
            </div>
            {adviceComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onVote={() => voteComment.mutate(comment.id)}
                isVoting={votingCommentId === comment.id}
              />
            ))}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <MessageCircle className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Comments</h3>
            <Badge variant="secondary" className="text-xs">{regularComments.length}</Badge>
          </div>

          <Card data-testid="card-add-comment">
            <CardContent className="p-4 space-y-3">
              <Textarea
                placeholder="Share your thoughts or advice..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="min-h-24"
                data-testid="input-comment"
              />
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is-advice"
                    checked={isAdvice}
                    onCheckedChange={setIsAdvice}
                    data-testid="switch-is-advice"
                  />
                  <Label htmlFor="is-advice" className="text-sm flex items-center gap-1">
                    <Lightbulb className="w-4 h-4 text-green-500" />
                    This is financial advice
                  </Label>
                </div>
                <Button
                  onClick={() => addComment.mutate()}
                  disabled={!commentText.trim() || addComment.isPending}
                  data-testid="button-submit-comment"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Post
                </Button>
              </div>
            </CardContent>
          </Card>

          {commentsLoading ? (
            <>
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </>
          ) : regularComments.length > 0 ? (
            regularComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onVote={() => voteComment.mutate(comment.id)}
                isVoting={votingCommentId === comment.id}
              />
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No comments yet. Be the first to respond!</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
