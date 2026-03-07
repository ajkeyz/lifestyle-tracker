import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AmbientBackground } from "@/components/ambient-background";
import { Mascot, type MascotContext } from "@/components/mascot";
import {
  Users,
  Search,
  Contact,
  ChevronRight,
  UserPlus,
  Shield,
  Loader2,
  Check,
  X,
  ArrowLeft,
  Flame,
  Heart
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface FriendEntry {
  id: string;
  username: string;
  avatar: string;
  moneyHealth: number;
  streak: number;
}

type ViewMode = "main" | "search" | "contacts" | "contacts-granted";

export default function FriendsSetup() {
  const [, navigate] = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>("main");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        setDebouncedQuery(searchQuery);
      } else {
        setDebouncedQuery("");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchChange = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
    setSearchQuery(cleaned);
  };

  const { data: searchResult, isLoading: isSearching, error: searchError } = useQuery<{ found: boolean; username: string | null }>({
    queryKey: [`/api/search-user/${debouncedQuery}`],
    enabled: debouncedQuery.length >= 3,
    staleTime: 5000,
  });

  const { data: friends, isLoading: friendsLoading } = useQuery<FriendEntry[]>({
    queryKey: ["/api/friends"],
  });

  const handleSkip = () => {
    navigate("/setup");
  };

  const handleContinue = () => {
    navigate("/setup");
  };

  if (viewMode === "contacts") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50 relative overflow-x-clip">
        <AmbientBackground variant="default" />
        <header className="flex items-center gap-3 px-4 h-14 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <AppLogo size="sm" />
            <span className="font-display font-extrabold text-[15px] leading-none tracking-[-0.04em]" data-testid="text-app-title">Lifestyle Creep</span>
          </div>
        </header>

        <main className="container max-w-md mx-auto p-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center py-6"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center">
              <Contact className="w-8 h-8 text-accent" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-[-0.02em] mb-2" data-testid="text-contacts-title">
              Find Friends in Contacts
            </h1>
            <p className="text-muted-foreground" data-testid="text-contacts-description">
              See which of your contacts are already playing
            </p>
          </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
                  className="flex justify-center"
                >
                  <Mascot
                    mood="waving"
                    size="sm"
                    showBubble={true}
                    message="More friends = more fun!"
                    context={{ screen: "home", username: "", streak: 0 } satisfies MascotContext}
                  />
                </motion.div>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-md" data-testid="contacts-privacy-info">
              <Shield className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium" data-testid="text-contacts-privacy-title">Your privacy is protected</p>
                <p className="text-xs text-muted-foreground" data-testid="text-contacts-privacy-detail">
                  We only check for matches. We never store or share your contacts.
                </p>
              </div>
            </div>

            <p className="text-sm text-center text-muted-foreground" data-testid="text-contacts-info">
              Contact access is optional. You can always add friends by username instead.
            </p>
          </Card>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full btn-premium border-0"
              onClick={() => setViewMode("contacts-granted")}
              data-testid="button-allow-contacts"
            >
              <Contact className="w-5 h-5 mr-2" />
              Allow Contact Access
            </Button>

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setViewMode("main")}
              data-testid="button-back-to-main"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (viewMode === "contacts-granted") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50 relative overflow-x-clip">
        <AmbientBackground variant="default" />
        <header className="flex items-center gap-3 px-4 h-14 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <AppLogo size="sm" />
            <span className="font-display font-extrabold text-[15px] leading-none tracking-[-0.04em]" data-testid="text-app-title">Lifestyle Creep</span>
          </div>
        </header>

        <main className="container max-w-md mx-auto p-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-[-0.02em] mb-2" data-testid="text-contacts-granted-title">
              Contacts Enabled
            </h1>
            <p className="text-muted-foreground" data-testid="text-contacts-granted-description">
              We'll notify you when friends join the game
            </p>
          </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
                  className="flex justify-center"
                >
                  <Mascot
                    mood="waving"
                    size="sm"
                    showBubble={true}
                    message="More friends = more fun!"
                    context={{ screen: "home", username: "", streak: 0 } satisfies MascotContext}
                  />
                </motion.div>

          <Card className="p-6">
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-md" data-testid="contacts-status">
              <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium" data-testid="text-contacts-status-title">No contacts found yet</p>
                <p className="text-xs text-muted-foreground" data-testid="text-contacts-status-detail">
                  We'll let you know when your contacts start playing
                </p>
              </div>
            </div>
          </Card>

          <Button
            size="lg"
            className="w-full btn-premium border-0"
            onClick={handleContinue}
            data-testid="button-continue-after-contacts"
          >
            Continue
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </main>
      </div>
    );
  }

  if (viewMode === "search") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50 relative overflow-x-clip">
        <AmbientBackground variant="default" />
        <header className="flex items-center gap-3 px-4 h-14 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <AppLogo size="sm" />
            <span className="font-display font-extrabold text-[15px] leading-none tracking-[-0.04em]" data-testid="text-app-title">Lifestyle Creep</span>
          </div>
        </header>

        <main className="container max-w-md mx-auto p-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-center py-6"
          >
            <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-[-0.02em] mb-2" data-testid="text-search-title">
              Find a Friend
            </h1>
            <p className="text-muted-foreground" data-testid="text-search-description">
              Enter their username to connect
            </p>
          </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
                  className="flex justify-center"
                >
                  <Mascot
                    mood="waving"
                    size="sm"
                    showBubble={true}
                    message="More friends = more fun!"
                    context={{ screen: "home", username: "", streak: 0 } satisfies MascotContext}
                  />
                </motion.div>

          <Card className="p-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-10"
                data-testid="input-search-username"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isSearching && (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" data-testid="icon-search-loading" />
                )}
                {!isSearching && searchResult?.found && (
                  <Check className="w-4 h-4 text-green-500" data-testid="icon-user-found" />
                )}
                {!isSearching && debouncedQuery.length >= 3 && searchResult && !searchResult.found && (
                  <X className="w-4 h-4 text-red-500" data-testid="icon-user-not-found" />
                )}
              </div>
            </div>

            {searchResult?.found && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md" data-testid="search-result-found">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-medium" data-testid="text-found-username">{searchResult.username}</span>
                </div>
                <Button size="sm" data-testid="button-add-friend">
                  <UserPlus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            )}

            {debouncedQuery.length >= 3 && searchResult && !searchResult.found && (
              <p className="text-sm text-muted-foreground text-center" data-testid="text-no-results">
                No user found with that username
              </p>
            )}

            {searchQuery.length > 0 && searchQuery.length < 3 && (
              <p className="text-xs text-muted-foreground text-center" data-testid="text-search-hint">
                Type at least 3 characters to search
              </p>
            )}

            {searchError && (
              <p className="text-sm text-destructive text-center" data-testid="text-search-error">
                Could not search. Please try again.
              </p>
            )}
          </Card>

          <div className="space-y-3">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setViewMode("main")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              size="lg"
              className="w-full btn-premium border-0"
              onClick={handleContinue}
              data-testid="button-continue"
            >
              Continue
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50 relative overflow-x-clip">
      <AmbientBackground variant="default" />
      <header className="flex items-center gap-3 px-4 h-14 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} aria-label="Go back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <AppLogo size="sm" />
          <span className="font-display font-extrabold text-[15px] leading-none tracking-[-0.04em]" data-testid="text-app-title">Lifestyle Creep</span>
        </div>
      </header>

      <main className="container max-w-md mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center py-6"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-[-0.02em] mb-2" data-testid="text-friends-title">
            Play with Friends
          </h1>
          <p className="text-muted-foreground" data-testid="text-friends-description">
            Compete on leaderboards and challenge each other
          </p>
        </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
                  className="flex justify-center"
                >
                  <Mascot
                    mood="waving"
                    size="sm"
                    showBubble={true}
                    message="More friends = more fun!"
                    context={{ screen: "home", username: "", streak: 0 } satisfies MascotContext}
                  />
                </motion.div>

        <div className="space-y-3">
          <Card 
            className="p-4 cursor-pointer hover-elevate"
            onClick={() => setViewMode("search")}
            data-testid="card-find-by-username"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold" data-testid="text-option-search-title">Find friends by username</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-option-search-description">
                  Search for people you know
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </div>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover-elevate"
            onClick={() => setViewMode("contacts")}
            data-testid="card-invite-contacts"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Contact className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold" data-testid="text-option-contacts-title">Invite contacts</h3>
                <p className="text-sm text-muted-foreground" data-testid="text-option-contacts-description">
                  See who else is playing
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </div>
          </Card>
        </div>

        {friendsLoading ? (
          <div className="space-y-3" data-testid="friends-list-loading">
            <div className="flex items-center justify-between gap-2 px-1">
              <h2 className="text-sm font-semibold tracking-[-0.02em]">Your Friends</h2>
            </div>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : friends && friends.length > 0 ? (
          <div className="space-y-3" data-testid="friends-list-section">
            <div className="flex items-center justify-between gap-2 px-1">
              <h2 className="text-sm font-semibold tracking-[-0.02em]" data-testid="text-friends-list-title">
                Your Friends
              </h2>
              <Badge variant="secondary" data-testid="badge-friends-count">
                {friends.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {friends.map((friend) => (
                <Card
                  key={friend.id}
                  className="p-3"
                  data-testid={`friend-card-${friend.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10" data-testid={`friend-avatar-${friend.id}`}>
                      <AvatarImage src={friend.avatar} alt={friend.username} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {friend.username?.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate" data-testid={`friend-username-${friend.id}`}>
                        {friend.username}
                      </p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {friend.streak > 0 && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`friend-streak-${friend.id}`}>
                            <Flame className="w-3 h-3 text-orange-500" />
                            {friend.streak}d
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-muted-foreground" data-testid={`friend-health-${friend.id}`}>
                          <Heart className="w-3 h-3 text-primary" />
                          {friend.moneyHealth}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 space-y-2" data-testid="friends-list-empty">
            <div className="w-12 h-12 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
              <Users className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              No friends added yet
            </p>
            <p className="text-xs text-muted-foreground/70">
              Search by username or invite contacts to get started
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-md" data-testid="privacy-notice">
          <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <p className="text-sm text-muted-foreground" data-testid="text-privacy-notice">
            We never message anyone without your tap.
          </p>
        </div>

        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={handleSkip}
          data-testid="button-skip"
        >
          Skip for now
        </Button>

        <p className="text-center text-xs text-muted-foreground" data-testid="text-friends-note">
          You can add friends anytime from your profile
        </p>
      </main>
    </div>
  );
}
