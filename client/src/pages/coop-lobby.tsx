import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppLogo } from "@/components/app-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Users, Copy, Check, Loader2, UserPlus } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CoopSession, User } from "@shared/schema";

export default function CoopLobby() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [joinCode, setJoinCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: session, refetch: refetchSession } = useQuery<CoopSession>({
    queryKey: ["/api/coop/session", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/coop/session/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch session");
      return res.json();
    },
    enabled: !!sessionId,
    refetchInterval: sessionId ? 2000 : false,
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/coop/create");
      return res.json() as Promise<CoopSession>;
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      setIsHost(true);
      toast({
        title: "Session created",
        description: "Share the code with your friend to play together!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const joinSessionMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", "/api/coop/join", { code });
      return res.json() as Promise<CoopSession>;
    },
    onSuccess: (data) => {
      setSessionId(data.id);
      setIsHost(false);
      navigate(`/coop-game/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Invalid code",
        description: "Session not found or already full.",
        variant: "destructive",
      });
    },
  });

  const startGameMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/coop/session/${sessionId}/start`);
      return res.json() as Promise<CoopSession>;
    },
    onSuccess: (data) => {
      navigate(`/coop-game/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start game. Make sure your friend has joined.",
        variant: "destructive",
      });
    },
  });

  const handleCopyCode = async () => {
    if (session?.code) {
      await navigator.clipboard.writeText(session.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleJoin = () => {
    if (joinCode.length === 6) {
      joinSessionMutation.mutate(joinCode.toUpperCase());
    }
  };

  const handleStartGame = () => {
    if (session && session.players.length >= 2) {
      startGameMutation.mutate();
    }
  };

  const canStart = session && session.players.length >= 2 && isHost;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <AppLogo size="sm" />
          <h1 className="font-display text-lg font-semibold tracking-tight">
            Play with Friend
          </h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-md mx-auto space-y-6">
        {!sessionId ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-display text-2xl tracking-tight">
                  Challenge a Friend
                </CardTitle>
                <CardDescription>
                  Play today&apos;s scenarios together and see who makes smarter money moves!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full h-12"
                  onClick={() => createSessionMutation.mutate()}
                  disabled={createSessionMutation.isPending}
                  data-testid="button-create-session"
                >
                  {createSessionMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-5 w-5 mr-2" />
                  )}
                  Create New Game
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      or join a friend
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="join-code">Enter 6-digit code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="join-code"
                      placeholder="ABC123"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                      className="text-center font-mono text-lg tracking-widest uppercase"
                      maxLength={6}
                      data-testid="input-join-code"
                    />
                    <Button
                      onClick={handleJoin}
                      disabled={joinCode.length !== 6 || joinSessionMutation.isPending}
                      data-testid="button-join-session"
                    >
                      {joinSessionMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        "Join"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="font-display text-xl tracking-tight">
                  Waiting for Player
                </CardTitle>
                <CardDescription>
                  Share this code with your friend
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center gap-2">
                  <div className="bg-muted rounded-lg px-6 py-4 font-mono text-3xl tracking-[0.3em] font-bold">
                    {session?.code || "------"}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyCode}
                    data-testid="button-copy-code"
                  >
                    {copiedCode ? (
                      <Check className="h-5 w-5 text-primary" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Players ({session?.players.length || 0}/2)
                  </p>
                  <div className="space-y-2">
                    {session?.players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                      >
                        <Avatar className="h-10 w-10 border">
                          <AvatarImage src={player.avatar} />
                          <AvatarFallback>
                            {player.username?.slice(0, 2).toUpperCase() || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{player.username || "Player"}</p>
                          <p className="text-xs text-muted-foreground">
                            {player.connected ? "Connected" : "Connecting..."}
                          </p>
                        </div>
                        {player.id === session.hostId && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            Host
                          </span>
                        )}
                      </div>
                    ))}

                    {session && session.players.length < 2 && (
                      <div className="flex items-center gap-3 p-3 border-2 border-dashed rounded-lg">
                        <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">Waiting for friend to join...</p>
                      </div>
                    )}
                  </div>
                </div>

                {isHost && (
                  <Button
                    className="w-full h-12"
                    onClick={handleStartGame}
                    disabled={!canStart || startGameMutation.isPending}
                    data-testid="button-start-game"
                  >
                    {startGameMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : null}
                    {canStart ? "Start Game" : "Waiting for friend..."}
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
