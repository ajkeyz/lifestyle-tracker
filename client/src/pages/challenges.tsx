import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  ArrowLeft, 
  Heart, 
  Flame, 
  Target, 
  Send, 
  Trophy,
  Shield,
  Loader2,
  Check,
  X,
  Swords,
  ChevronRight,
  Plus,
  MessageCircle,
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { EmptyState } from "@/components/empty-state";
import type { User, Challenge, ChallengeType } from "@shared/schema";
import { CHALLENGE_TYPES, TRASH_TALK_PRESETS, CHALLENGE_BADGES } from "@shared/schema";

type ViewMode = "list" | "create" | "detail";

interface FriendSummary {
  id: string;
  username: string;
  avatar: string;
  moneyHealth: number;
  streak: number;
}

const ChallengeIcon = ({ type, className }: { type: string; className?: string }) => {
  switch (type) {
    case "heart":
    case "money_health":
      return <Heart className={className} />;
    case "flame":
    case "streak":
      return <Flame className={className} />;
    case "target":
    case "accuracy":
      return <Target className={className} />;
    case "trophy":
      return <Trophy className={className} />;
    case "shield":
      return <Shield className={className} />;
    case "swords":
      return <Swords className={className} />;
    default:
      return <Trophy className={className} />;
  }
};

const BadgeIcon = ({ icon, className }: { icon: string; className?: string }) => {
  switch (icon) {
    case "trophy":
      return <Trophy className={className} />;
    case "flame":
      return <Flame className={className} />;
    case "target":
      return <Target className={className} />;
    case "swords":
      return <Swords className={className} />;
    case "shield":
      return <Shield className={className} />;
    default:
      return <Trophy className={className} />;
  }
};

export default function Challenges() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [selectedChallengeType, setSelectedChallengeType] = useState<ChallengeType>("money_health");
  const [selectedTrashTalk, setSelectedTrashTalk] = useState<string>(TRASH_TALK_PRESETS[0]);
  const [customMessage, setCustomMessage] = useState<string>("");
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: friends = [], isLoading: friendsLoading } = useQuery<FriendSummary[]>({
    queryKey: ["/api/friends"],
  });

  const { data: challenges = [], isLoading: challengesLoading } = useQuery<Challenge[]>({
    queryKey: ["/api/challenges"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { challengeeId: string; type: ChallengeType; trashTalk: string; customMessage?: string | null }) => {
      const res = await apiRequest("POST", "/api/challenges", data);
      return res.json() as Promise<Challenge>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      setViewMode("list");
      resetForm();
      toast({ title: "Challenge sent!", description: "Let's see if they can beat you" });
    },
    onError: () => {
      toast({ title: "Failed to send challenge", variant: "destructive" });
    },
  });

  const respondMutation = useMutation({
    mutationFn: async ({ challengeId, accept }: { challengeId: string; accept: boolean }) => {
      const res = await apiRequest("POST", `/api/challenges/${challengeId}/respond`, { accept });
      return res.json() as Promise<Challenge>;
    },
    onSuccess: (challenge) => {
      queryClient.invalidateQueries({ queryKey: ["/api/challenges"] });
      if (challenge.winnerId === user?.id) {
        toast({ title: "You won!", description: "Nice work! You beat the challenge" });
      } else if (challenge.winnerId) {
        toast({ title: "Challenge complete", description: "Better luck next time!" });
      } else {
        toast({ title: "Challenge declined" });
      }
    },
    onError: () => {
      toast({ title: "Failed to respond", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setSelectedFriendId(null);
    setSelectedChallengeType("money_health");
    setSelectedTrashTalk(TRASH_TALK_PRESETS[0]);
    setCustomMessage("");
  };

  const handleSendChallenge = () => {
    if (!selectedFriendId) return;
    createMutation.mutate({
      challengeeId: selectedFriendId,
      type: selectedChallengeType,
      trashTalk: selectedTrashTalk,
      customMessage: customMessage || null,
    });
  };

  const selectedFriend = friends.find(f => f.id === selectedFriendId);
  const selectedChallenge = challenges.find(c => c.id === selectedChallengeId);

  const pendingChallenges = challenges.filter(c => c.status === "pending" && c.challengeeId === user?.id);
  const sentChallenges = challenges.filter(c => c.challengerId === user?.id);
  const completedChallenges = challenges.filter(c => c.status === "completed");

  const renderHeader = () => (
    <header className="flex items-center justify-between gap-2 flex-wrap p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center gap-2 flex-wrap">
        {viewMode !== "list" && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              if (viewMode === "detail") {
                setViewMode("list");
                setSelectedChallengeId(null);
              } else {
                setViewMode("list");
                resetForm();
              }
            }}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        {viewMode === "list" && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/")}
            data-testid="button-home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Swords className="w-4 h-4 text-primary-foreground" />
        </div>
        <h1 className="text-lg font-semibold">
          {viewMode === "create" ? "New Challenge" : viewMode === "detail" ? "Challenge" : "Challenges"}
        </h1>
      </div>
      <ThemeToggle />
    </header>
  );

  if (viewMode === "create") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {renderHeader()}
        <main className="container max-w-md mx-auto p-4 space-y-6">
          <div className="text-center py-2">
            <h2 className="text-xl font-bold mb-1" data-testid="text-create-title">Challenge a Friend</h2>
            <p className="text-muted-foreground text-sm">Pick a friend, pick a challenge, add some heat</p>
          </div>

          <Card className="p-4">
            <Label className="mb-3 block">Pick a Friend</Label>
            {friendsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : friends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No friends found. Complete the onboarding to see friends!
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className={`flex items-center justify-between gap-3 flex-wrap p-3 rounded-md cursor-pointer ${
                      selectedFriendId === friend.id ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                    }`}
                    onClick={() => setSelectedFriendId(friend.id)}
                    data-testid={`card-friend-${friend.id}`}
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{friend.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{friend.username}</p>
                        <p className="text-xs text-muted-foreground">
                          <Heart className="w-3 h-3 inline mr-1" />
                          {friend.moneyHealth}
                          <span className="mx-2">|</span>
                          <Flame className="w-3 h-3 inline mr-1" />
                          {friend.streak} streak
                        </p>
                      </div>
                    </div>
                    {selectedFriendId === friend.id && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <Label className="mb-3 block">Pick Challenge Type</Label>
            <div className="space-y-2">
              {CHALLENGE_TYPES.map((cType) => (
                <div
                  key={cType.id}
                  className={`flex items-center justify-between gap-3 flex-wrap p-3 rounded-md cursor-pointer ${
                    selectedChallengeType === cType.id ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                  }`}
                  onClick={() => setSelectedChallengeType(cType.id)}
                  data-testid={`option-challenge-${cType.id}`}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <ChallengeIcon type={cType.icon} className="w-5 h-5 text-accent" />
                    </div>
                    <p className="font-medium">{cType.label}</p>
                  </div>
                  {selectedChallengeType === cType.id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <Label className="mb-3 block">Add Some Trash Talk</Label>
            <div className="flex flex-wrap gap-2 mb-4">
              {TRASH_TALK_PRESETS.map((talk) => (
                <Button
                  key={talk}
                  variant={selectedTrashTalk === talk ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTrashTalk(talk)}
                  data-testid={`button-trash-${talk.slice(0, 10).replace(/\s+/g, "-").toLowerCase()}`}
                >
                  {talk.length > 25 ? talk.slice(0, 25) + "..." : talk}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <Label className="mb-3 block">Custom Message (Optional)</Label>
            <Textarea
              placeholder="Add a personal touch..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value.slice(0, 200))}
              className="resize-none"
              data-testid="input-custom-message"
            />
            <p className="text-xs text-muted-foreground mt-2 text-right">{customMessage.length}/200</p>
          </Card>

          <Button
            size="lg"
            className="w-full"
            onClick={handleSendChallenge}
            disabled={!selectedFriendId || createMutation.isPending}
            data-testid="button-send-challenge"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Send className="w-5 h-5 mr-2" />
            )}
            Send Challenge
          </Button>
        </main>
      </div>
    );
  }

  if (viewMode === "detail" && selectedChallenge) {
    const isChallenger = selectedChallenge.challengerId === user?.id;
    const isPending = selectedChallenge.status === "pending";
    const isCompleted = selectedChallenge.status === "completed";
    const isWinner = selectedChallenge.winnerId === user?.id;
    const badge = selectedChallenge.badgeAwarded 
      ? CHALLENGE_BADGES.find(b => b.id === selectedChallenge.badgeAwarded)
      : null;

    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {renderHeader()}
        <main className="container max-w-md mx-auto p-4 space-y-4">
          <Card className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
              <ChallengeIcon type={selectedChallenge.type} className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-bold mb-2" data-testid="text-challenge-type">
              {CHALLENGE_TYPES.find(t => t.id === selectedChallenge.type)?.label}
            </h2>
            <div className="flex items-center justify-center gap-4 flex-wrap mb-4">
              <div className="text-center">
                <Avatar className="w-12 h-12 mx-auto mb-1">
                  <AvatarFallback>{selectedChallenge.challengerUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium">{selectedChallenge.challengerUsername}</p>
                <p className="text-lg font-bold text-primary">{selectedChallenge.challengerValue}</p>
              </div>
              <span className="text-2xl font-bold text-muted-foreground">VS</span>
              <div className="text-center">
                <Avatar className="w-12 h-12 mx-auto mb-1">
                  <AvatarFallback>{selectedChallenge.challengeeUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium">{selectedChallenge.challengeeUsername}</p>
                <p className="text-lg font-bold text-primary">
                  {selectedChallenge.challengeeValue !== null ? selectedChallenge.challengeeValue : "?"}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3 flex-wrap">
              <MessageCircle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium italic" data-testid="text-trash-talk">"{selectedChallenge.trashTalk}"</p>
                {selectedChallenge.customMessage && (
                  <p className="text-sm text-muted-foreground mt-2" data-testid="text-custom-message">
                    {selectedChallenge.customMessage}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {isCompleted && badge && isWinner && (
            <Card className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <BadgeIcon icon={badge.icon} className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="font-bold text-yellow-600" data-testid="text-badge-name">{badge.name}</p>
                  <p className="text-sm text-muted-foreground">{badge.description}</p>
                </div>
              </div>
            </Card>
          )}

          {isCompleted && (
            <>
              <Card className={`p-4 text-center ${isWinner ? "bg-green-500/10 border-green-500/30" : "bg-muted/50"}`}>
                {isWinner ? (
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Trophy className="w-6 h-6 text-green-600" />
                    <p className="font-bold text-green-600" data-testid="text-result">You Won!</p>
                  </div>
                ) : selectedChallenge.winnerId ? (
                  <p className="font-medium text-muted-foreground" data-testid="text-result">
                    {isChallenger ? selectedChallenge.challengeeUsername : selectedChallenge.challengerUsername} won this one
                  </p>
                ) : (
                  <p className="font-medium text-muted-foreground" data-testid="text-result">It's a tie!</p>
                )}
              </Card>

              {/* Revenge Mode: Challenge back after losing */}
              {!isWinner && selectedChallenge.winnerId && (
                <Card className="p-4 bg-gradient-to-r from-destructive/10 to-orange-500/10 border-destructive/30">
                  <div className="text-center mb-3">
                    <h3 className="font-bold text-lg mb-1 flex items-center justify-center gap-2">
                      <Swords className="w-5 h-5 text-destructive" />
                      Revenge Mode
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Challenge them back with <span className="font-bold text-destructive">DOUBLE</span> the stakes!
                    </p>
                  </div>
                  <Button
                    size="lg"
                    variant="destructive"
                    className="w-full gap-2"
                    onClick={() => {
                      const opponentId = isChallenger ? selectedChallenge.challengeeId : selectedChallenge.challengerId;
                      setSelectedFriendId(opponentId);
                      setSelectedChallengeType(selectedChallenge.type as ChallengeType);
                      setSelectedTrashTalk("Rematch time! Double or nothing! 🔥");
                      setViewMode("create");
                    }}
                    data-testid="button-revenge"
                  >
                    <Swords className="w-5 h-5" />
                    Challenge Again
                  </Button>
                </Card>
              )}
            </>
          )}

          {isPending && !isChallenger && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={() => respondMutation.mutate({ challengeId: selectedChallenge.id, accept: false })}
                disabled={respondMutation.isPending}
                data-testid="button-decline"
              >
                <X className="w-5 h-5 mr-2" />
                Decline
              </Button>
              <Button
                size="lg"
                className="flex-1"
                onClick={() => respondMutation.mutate({ challengeId: selectedChallenge.id, accept: true })}
                disabled={respondMutation.isPending}
                data-testid="button-accept"
              >
                {respondMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Check className="w-5 h-5 mr-2" />
                )}
                Accept
              </Button>
            </div>
          )}

          {isPending && isChallenger && (
            <Card className="p-4 bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">
                Waiting for {selectedChallenge.challengeeUsername} to respond...
              </p>
            </Card>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {renderHeader()}
      <main className="container max-w-md mx-auto p-4 space-y-6">
        <Button
          size="lg"
          className="w-full"
          onClick={() => setViewMode("create")}
          data-testid="button-new-challenge"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Challenge
        </Button>

        {pendingChallenges.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 flex-wrap">
              <Swords className="w-5 h-5 text-accent" />
              Incoming Challenges
            </h3>
            <div className="space-y-2">
              {pendingChallenges.map((challenge) => (
                <Card
                  key={challenge.id}
                  className="p-4 cursor-pointer"
                  onClick={() => {
                    setSelectedChallengeId(challenge.id);
                    setViewMode("detail");
                  }}
                  data-testid={`card-challenge-${challenge.id}`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback>{challenge.challengerUsername.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{challenge.challengerUsername}</p>
                        <p className="text-xs text-muted-foreground">
                          {CHALLENGE_TYPES.find(t => t.id === challenge.type)?.label}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {sentChallenges.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 flex-wrap">
              <Send className="w-5 h-5 text-muted-foreground" />
              Sent Challenges
            </h3>
            <div className="space-y-2">
              {sentChallenges.slice(0, 5).map((challenge) => (
                <Card
                  key={challenge.id}
                  className="p-4 cursor-pointer"
                  onClick={() => {
                    setSelectedChallengeId(challenge.id);
                    setViewMode("detail");
                  }}
                  data-testid={`card-sent-${challenge.id}`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        challenge.status === "completed" 
                          ? challenge.winnerId === user?.id 
                            ? "bg-green-500/20" 
                            : "bg-muted" 
                          : "bg-accent/20"
                      }`}>
                        <ChallengeIcon 
                          type={challenge.type} 
                          className={`w-5 h-5 ${
                            challenge.status === "completed" 
                              ? challenge.winnerId === user?.id 
                                ? "text-green-600" 
                                : "text-muted-foreground"
                              : "text-accent"
                          }`} 
                        />
                      </div>
                      <div>
                        <p className="font-medium">vs {challenge.challengeeUsername}</p>
                        <p className="text-xs text-muted-foreground">
                          {challenge.status === "pending" ? "Waiting..." : 
                           challenge.status === "completed" ? (challenge.winnerId === user?.id ? "You won!" : "They won") :
                           challenge.status === "declined" ? "Declined" : challenge.status}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {challenges.length === 0 && !challengesLoading && (
          <EmptyState
            type="no-challenges"
            actionLabel="Challenge Friend"
            onAction={() => setViewMode("create")}
          />
        )}

        {challengesLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </main>
    </div>
  );
}
