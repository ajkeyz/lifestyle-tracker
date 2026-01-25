import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Shield, ShieldOff, UserX, UserCheck, Plus, FileText, Users, AlertTriangle, Search, Settings } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Moderator, BannedUser, AdminScenario } from "@shared/schema";

interface AdminUser {
  id: string;
  username: string;
  avatar: string;
  moneyHealth: number;
  gamesPlayed: number;
}

interface AdminCheck {
  isAdmin: boolean;
  isModerator: boolean;
  hasAccess: boolean;
}

export default function Admin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [banReason, setBanReason] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: adminCheck, isLoading: checkingAccess } = useQuery<AdminCheck>({
    queryKey: ["/api/admin/check"],
  });

  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: adminCheck?.hasAccess,
  });

  const { data: moderators = [] } = useQuery<Moderator[]>({
    queryKey: ["/api/admin/moderators"],
    enabled: adminCheck?.isAdmin,
  });

  const { data: bannedUsers = [] } = useQuery<BannedUser[]>({
    queryKey: ["/api/admin/banned"],
    enabled: adminCheck?.hasAccess,
  });

  const { data: scenarios = [] } = useQuery<AdminScenario[]>({
    queryKey: ["/api/admin/scenarios"],
    enabled: adminCheck?.hasAccess,
  });

  const addModeratorMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", "/api/admin/moderators", { userId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderators"] });
      toast({ title: "Moderator added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add moderator", variant: "destructive" });
    },
  });

  const removeModeratorMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/moderators/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/moderators"] });
      toast({ title: "Moderator removed" });
    },
    onError: () => {
      toast({ title: "Failed to remove moderator", variant: "destructive" });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const res = await apiRequest("POST", "/api/admin/ban", { userId, reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banned"] });
      setSelectedUserId(null);
      setBanReason("");
      toast({ title: "User banned successfully" });
    },
    onError: () => {
      toast({ title: "Failed to ban user", variant: "destructive" });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("POST", `/api/admin/unban/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banned"] });
      toast({ title: "User unbanned" });
    },
    onError: () => {
      toast({ title: "Failed to unban user", variant: "destructive" });
    },
  });

  if (checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    );
  }

  if (!adminCheck?.hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the admin panel.
            </p>
            <Button onClick={() => navigate("/")} data-testid="button-go-home">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isBanned = (userId: string) => bannedUsers.some(b => b.userId === userId);
  const isMod = (userId: string) => moderators.some(m => m.userId === userId);

  const draftScenarios = scenarios.filter(s => s.status === "draft");
  const publishedScenarios = scenarios.filter(s => s.status === "published");

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
        <div className="flex-1">
          <h1 className="text-lg font-bold" data-testid="text-page-title">Admin Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            {adminCheck.isAdmin ? "Super Admin" : "Moderator"}
          </p>
        </div>
        <Button onClick={() => navigate("/admin/scenario-builder")} data-testid="button-new-scenario">
          <Plus className="h-4 w-4 mr-2" />
          New Scenario
        </Button>
      </header>

      <main className="p-4 space-y-6">
        <Tabs defaultValue="scenarios" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scenarios" data-testid="tab-scenarios">
              <FileText className="h-4 w-4 mr-2" />
              Scenarios
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            {adminCheck.isAdmin && (
              <TabsTrigger value="moderators" data-testid="tab-moderators">
                <Shield className="h-4 w-4 mr-2" />
                Moderators
              </TabsTrigger>
            )}
            <TabsTrigger value="banned" data-testid="tab-banned">
              <UserX className="h-4 w-4 mr-2" />
              Banned
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scenarios" className="space-y-4 mt-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Draft Scenarios ({draftScenarios.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {draftScenarios.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">No draft scenarios</p>
                  ) : (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {draftScenarios.map(scenario => (
                          <Card 
                            key={scenario.id} 
                            className="p-3 cursor-pointer hover-elevate"
                            onClick={() => navigate(`/admin/scenario-builder/${scenario.id}`)}
                            data-testid={`card-draft-scenario-${scenario.id}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{scenario.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">{scenario.category}</Badge>
                                  <Badge variant="outline" className="text-xs">Difficulty {scenario.difficulty}</Badge>
                                </div>
                              </div>
                              <Badge variant="outline">Draft</Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Published Scenarios ({publishedScenarios.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {publishedScenarios.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">No published scenarios</p>
                  ) : (
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {publishedScenarios.map(scenario => (
                          <Card 
                            key={scenario.id} 
                            className="p-3 cursor-pointer hover-elevate"
                            onClick={() => navigate(`/admin/scenario-builder/${scenario.id}`)}
                            data-testid={`card-published-scenario-${scenario.id}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{scenario.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">{scenario.category}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    Published {new Date(scenario.publishDate || "").toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <Badge variant="default">Live</Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-users"
              />
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredUsers.map(user => (
                  <Card key={user.id} className="p-3" data-testid={`card-user-${user.id}`}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{user.username}</p>
                          {isMod(user.id) && (
                            <Badge variant="secondary" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Mod
                            </Badge>
                          )}
                          {isBanned(user.id) && (
                            <Badge variant="destructive" className="text-xs">Banned</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Health: {user.moneyHealth} | Games: {user.gamesPlayed}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {!isBanned(user.id) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUserId(user.id)}
                            data-testid={`button-ban-${user.id}`}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => unbanUserMutation.mutate(user.id)}
                            data-testid={`button-unban-${user.id}`}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        {adminCheck.isAdmin && !isMod(user.id) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addModeratorMutation.mutate(user.id)}
                            data-testid={`button-make-mod-${user.id}`}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {selectedUserId === user.id && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <Input
                          placeholder="Reason for ban (required)"
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          data-testid="input-ban-reason"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => banUserMutation.mutate({ userId: user.id, reason: banReason })}
                            disabled={banReason.length < 5}
                            data-testid="button-confirm-ban"
                          >
                            Confirm Ban
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSelectedUserId(null); setBanReason(""); }}
                            data-testid="button-cancel-ban"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {adminCheck.isAdmin && (
            <TabsContent value="moderators" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current Moderators</CardTitle>
                  <CardDescription>Manage who can access the admin panel and moderate content</CardDescription>
                </CardHeader>
                <CardContent>
                  {moderators.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">No moderators assigned yet</p>
                  ) : (
                    <div className="space-y-2">
                      {moderators.map(mod => (
                        <Card key={mod.userId} className="p-3" data-testid={`card-moderator-${mod.userId}`}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>{mod.username[0]?.toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{mod.username}</p>
                                <p className="text-xs text-muted-foreground">
                                  Added {new Date(mod.assignedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeModeratorMutation.mutate(mod.userId)}
                              data-testid={`button-remove-mod-${mod.userId}`}
                            >
                              <ShieldOff className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="banned" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Banned Users ({bannedUsers.length})</CardTitle>
                <CardDescription>Users who have been removed from the community</CardDescription>
              </CardHeader>
              <CardContent>
                {bannedUsers.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No banned users</p>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {bannedUsers.map(banned => (
                        <Card key={banned.userId} className="p-3" data-testid={`card-banned-${banned.userId}`}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>{banned.username[0]?.toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{banned.username}</p>
                                <p className="text-xs text-muted-foreground">
                                  Banned by {banned.bannedByUsername} on {new Date(banned.bannedAt).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-destructive mt-1">
                                  Reason: {banned.reason}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => unbanUserMutation.mutate(banned.userId)}
                              data-testid={`button-unban-banned-${banned.userId}`}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Unban
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
