import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  Users,
  Plus,
  Trophy,
  Crown,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
  Lock,
  Globe,
  Loader2,
  LogIn,
  Sparkles,
  Flame,
  Target,
  Skull,
  Ghost,
  Zap,
  Heart,
  Star,
  Shield,
  Rocket,
  Diamond,
  Coins,
  type LucideIcon
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { League, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LEAGUE_ICONS: Record<string, LucideIcon> = {
  trophy: Trophy,
  flame: Flame,
  target: Target,
  skull: Skull,
  ghost: Ghost,
  zap: Zap,
  heart: Heart,
  star: Star,
  shield: Shield,
  rocket: Rocket,
  diamond: Diamond,
  coins: Coins,
};

const ICON_OPTIONS = Object.keys(LEAGUE_ICONS);

const FUN_LEAGUE_PRESETS = [
  { name: "No-Spend Demons", icon: "flame" },
  { name: "Soft Life League", icon: "heart" },
  { name: "Debt Escape Room", icon: "ghost" },
  { name: "Money Glazers Club", icon: "skull" },
  { name: "Budget Beasts", icon: "zap" },
  { name: "Savings Squad", icon: "target" },
];

function LeagueIcon({ icon, className }: { icon: string; className?: string }) {
  const IconComponent = LEAGUE_ICONS[icon] || Trophy;
  return <IconComponent className={className} />;
}

type ViewMode = "list" | "create" | "join" | "detail";

export default function Leagues() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  
  const [newLeagueName, setNewLeagueName] = useState("");
  const [newLeagueIcon, setNewLeagueIcon] = useState("trophy");
  const [newLeaguePrivacy, setNewLeaguePrivacy] = useState<"public" | "private">("private");
  const [joinCode, setJoinCode] = useState("");

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: leagues, isLoading: leaguesLoading } = useQuery<League[]>({
    queryKey: ["/api/leagues"],
  });

  const { data: selectedLeague, isLoading: leagueLoading } = useQuery<League>({
    queryKey: ["/api/leagues", selectedLeagueId],
    enabled: !!selectedLeagueId && viewMode === "detail",
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; emoji: string; privacy: "public" | "private" }) => {
      const res = await apiRequest("POST", "/api/leagues", data);
      return res.json() as Promise<League>;
    },
    onSuccess: (league: League) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", league.id] });
      setSelectedLeagueId(league.id);
      setViewMode("detail");
      toast({ title: "League created!", description: `Share code: ${league.inviteCode}` });
    },
    onError: () => {
      toast({ title: "Failed to create league", variant: "destructive" });
    },
  });

  const joinMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const res = await apiRequest("POST", "/api/leagues/join", { inviteCode });
      return res.json() as Promise<League>;
    },
    onSuccess: (league: League) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", league.id] });
      setSelectedLeagueId(league.id);
      setViewMode("detail");
      toast({ title: "Joined league!", description: `Welcome to ${league.name}` });
    },
    onError: () => {
      toast({ title: "Invalid code", description: "No league found with that code", variant: "destructive" });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async (leagueId: string) => {
      await apiRequest("POST", `/api/leagues/${leagueId}/leave`);
      return leagueId;
    },
    onSuccess: (leagueId: string) => {
      queryClient.invalidateQueries({ queryKey: ["/api/leagues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leagues", leagueId] });
      setViewMode("list");
      setSelectedLeagueId(null);
      toast({ title: "Left league" });
    },
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateLeague = () => {
    if (newLeagueName.length < 3) {
      toast({ title: "Name too short", description: "League name must be at least 3 characters", variant: "destructive" });
      return;
    }
    createMutation.mutate({ name: newLeagueName, emoji: newLeagueIcon, privacy: newLeaguePrivacy });
  };

  const handleJoinLeague = () => {
    if (joinCode.length < 6) {
      toast({ title: "Invalid code", description: "Enter a valid 6-character invite code", variant: "destructive" });
      return;
    }
    joinMutation.mutate(joinCode.toUpperCase());
  };

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
                setSelectedLeagueId(null);
              } else {
                setViewMode("list");
              }
            }}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <AppLogo size="sm" />
        <span className="font-bold text-lg" data-testid="text-app-title">Friend Leagues</span>
      </div>
      <ThemeToggle />
    </header>
  );

  if (viewMode === "create") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {renderHeader()}
        <main className="container max-w-md mx-auto p-4 space-y-6">
          <div className="text-center py-4">
            <h1 className="text-2xl font-bold mb-2" data-testid="text-create-title">Create a League</h1>
            <p className="text-muted-foreground text-sm">Challenge your friends to weekly money battles</p>
          </div>

          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="league-name">League Name</Label>
              <Input
                id="league-name"
                placeholder="e.g., No-Spend Demons"
                value={newLeagueName}
                onChange={(e) => setNewLeagueName(e.target.value.slice(0, 30))}
                data-testid="input-league-name"
              />
            </div>

            <div className="space-y-2">
              <Label>Pick an Icon</Label>
              <div className="flex flex-wrap gap-2">
                {ICON_OPTIONS.map((iconName) => (
                  <Button
                    key={iconName}
                    variant={newLeagueIcon === iconName ? "default" : "outline"}
                    size="icon"
                    onClick={() => setNewLeagueIcon(iconName)}
                    data-testid={`button-icon-${iconName}`}
                  >
                    <LeagueIcon icon={iconName} className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Privacy</Label>
              <Select value={newLeaguePrivacy} onValueChange={(v) => setNewLeaguePrivacy(v as "public" | "private")}>
                <SelectTrigger data-testid="select-privacy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private" data-testid="select-option-private">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Lock className="w-4 h-4" />
                      <span>Private - Invite only</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="public" data-testid="select-option-public">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Globe className="w-4 h-4" />
                      <span>Public - Anyone can join</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="p-4 bg-muted/30">
            <p className="text-sm text-center text-muted-foreground" data-testid="text-weekly-reset">
              <Sparkles className="w-4 h-4 inline mr-1" />
              Every week is a fresh chance to climb.
            </p>
          </Card>

          <div className="space-y-3">
            <Button 
              size="lg" 
              className="w-full" 
              onClick={handleCreateLeague}
              disabled={createMutation.isPending}
              data-testid="button-create-league"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Plus className="w-5 h-5 mr-2" />
              )}
              Create League
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center">Try one of these fun names:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {FUN_LEAGUE_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewLeagueName(preset.name);
                    setNewLeagueIcon(preset.icon);
                  }}
                  data-testid={`button-preset-${preset.name.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  <LeagueIcon icon={preset.icon} className="w-4 h-4 mr-1" />
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (viewMode === "join") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {renderHeader()}
        <main className="container max-w-md mx-auto p-4 space-y-6">
          <div className="text-center py-4">
            <h1 className="text-2xl font-bold mb-2" data-testid="text-join-title">Join a League</h1>
            <p className="text-muted-foreground text-sm">Enter the invite code your friend shared</p>
          </div>

          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-code">Invite Code</Label>
              <Input
                id="invite-code"
                placeholder="e.g., ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 10))}
                className="text-center text-2xl font-mono tracking-widest"
                data-testid="input-invite-code"
              />
            </div>
          </Card>

          <Card className="p-4 bg-muted/30">
            <p className="text-sm text-center text-muted-foreground" data-testid="text-weekly-reset-join">
              <Sparkles className="w-4 h-4 inline mr-1" />
              Every week is a fresh chance to climb.
            </p>
          </Card>

          <Button 
            size="lg" 
            className="w-full" 
            onClick={handleJoinLeague}
            disabled={joinMutation.isPending}
            data-testid="button-join-league"
          >
            {joinMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <LogIn className="w-5 h-5 mr-2" />
            )}
            Join League
          </Button>
        </main>
      </div>
    );
  }

  if (viewMode === "detail" && selectedLeague) {
    const myMember = selectedLeague.members.find((m) => m.userId === user?.id);
    const sortedMembers = [...selectedLeague.members].sort((a, b) => a.weeklyRank - b.weeklyRank);

    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {renderHeader()}
        <main className="container max-w-md mx-auto p-4 space-y-4">
          <Card className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
              <LeagueIcon icon={selectedLeague.emoji} className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-1" data-testid="text-league-name">{selectedLeague.name}</h1>
            <div className="flex items-center justify-center gap-2 flex-wrap text-muted-foreground text-sm">
              {selectedLeague.privacy === "private" ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Globe className="w-4 h-4" />
              )}
              <span>{selectedLeague.privacy === "private" ? "Private" : "Public"}</span>
              <span>•</span>
              <span>{selectedLeague.members.length} members</span>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <p className="text-xs text-muted-foreground">Invite Code</p>
                <p className="text-xl font-mono font-bold tracking-widest" data-testid="text-invite-code">
                  {selectedLeague.inviteCode}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyCode(selectedLeague.inviteCode)}
                data-testid="button-copy-code"
              >
                {copiedCode ? (
                  <Check className="w-4 h-4 mr-1" />
                ) : (
                  <Copy className="w-4 h-4 mr-1" />
                )}
                {copiedCode ? "Copied!" : "Copy"}
              </Button>
            </div>
          </Card>

          <Card className="p-4 bg-muted/30">
            <p className="text-sm text-center text-muted-foreground">
              <Sparkles className="w-4 h-4 inline mr-1" />
              Every week is a fresh chance to climb.
            </p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <Trophy className="w-5 h-5 text-accent" />
              <h3 className="font-semibold">Weekly Rankings</h3>
            </div>
            <div className="space-y-2">
              {sortedMembers.map((member, index) => (
                <div 
                  key={member.userId}
                  className={`flex items-center justify-between gap-3 flex-wrap p-3 rounded-md ${
                    member.userId === user?.id ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                  }`}
                  data-testid={`member-rank-${index + 1}`}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${
                      index === 0 ? "bg-yellow-500/20 text-yellow-600" :
                      index === 1 ? "bg-gray-400/20 text-gray-500" :
                      index === 2 ? "bg-orange-500/20 text-orange-600" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
                    </div>
                    <div>
                      <p className="font-medium" data-testid={`text-member-${index + 1}-name`}>
                        {member.username}
                        {member.userId === user?.id && " (You)"}
                      </p>
                      {member.isWeeklyWinner && (
                        <p className="text-xs text-yellow-600">Weekly Winner!</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold" data-testid={`text-member-${index + 1}-score`}>
                      {member.weeklyScore}
                    </p>
                    <p className="text-xs text-muted-foreground">pts</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {selectedLeague.previousWeekWinner && (
            <Card className="p-4">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold">Last Week's Winner</h3>
              </div>
              <p className="text-muted-foreground" data-testid="text-previous-winner">
                {selectedLeague.previousWeekWinner}
              </p>
            </Card>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => leaveMutation.mutate(selectedLeague.id)}
            disabled={leaveMutation.isPending}
            data-testid="button-leave-league"
          >
            {leaveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Leave League
          </Button>
        </main>
      </div>
    );
  }

  if (viewMode === "detail" && leagueLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {renderHeader()}
        <main className="container max-w-md mx-auto p-4 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {renderHeader()}
      <main className="container max-w-md mx-auto p-4 space-y-4">
        <div className="flex gap-3">
          <Button 
            className="flex-1" 
            onClick={() => setViewMode("create")}
            data-testid="button-create-new"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create League
          </Button>
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={() => setViewMode("join")}
            data-testid="button-join-existing"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Join League
          </Button>
        </div>

        <Card className="p-4 bg-muted/30">
          <p className="text-sm text-center text-muted-foreground" data-testid="text-weekly-reset-list">
            <Sparkles className="w-4 h-4 inline mr-1" />
            Every week is a fresh chance to climb.
          </p>
        </Card>

        {leaguesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : leagues && leagues.length > 0 ? (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Your Leagues</h2>
            {leagues.map((league) => {
              const myRank = league.members.find((m) => m.userId === user?.id)?.weeklyRank || 0;
              return (
                <Card 
                  key={league.id}
                  className="p-4 cursor-pointer"
                  onClick={() => {
                    setSelectedLeagueId(league.id);
                    setViewMode("detail");
                  }}
                  data-testid={`card-league-${league.id}`}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <LeagueIcon icon={league.emoji} className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold" data-testid={`text-league-name-${league.id}`}>{league.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {league.members.length} members • Rank #{myRank}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-8 text-center" data-testid="card-no-leagues">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold mb-2">No leagues yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create a league or join one with a friend's invite code
            </p>
          </Card>
        )}

        <Button 
          variant="ghost" 
          className="w-full" 
          onClick={() => navigate("/")}
          data-testid="button-back-home"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </main>
    </div>
  );
}
