import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AnimatedAvatar, avatarConfigs } from "@/components/animated-avatar";
import { AmbientBackground } from "@/components/ambient-background";
import { Mascot, type MascotContext } from "@/components/mascot";
import {
  ChevronRight,
  Check,
  X,
  RefreshCw,
  Loader2,
  Users,
  Lock,
  ArrowLeft
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema } from "@shared/schema";
import type { User, UpdateProfile } from "@shared/schema";
import { cn } from "@/lib/utils";
import { z } from "zod";

const formSchema = updateProfileSchema.extend({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be 20 characters or less")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
});

type FormData = z.infer<typeof formSchema>;

export default function ProfileSetup() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Check if we're in edit mode (coming from profile page)
  const isEditMode = typeof window !== 'undefined' && window.location.search.includes("edit=true");
  const [debouncedUsername, setDebouncedUsername] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      avatar: "cosmic-cat",
      bio: "",
      allowFriendsToFind: true,
      isProfilePrivate: false,
    },
  });

  const username = form.watch("username");
  const avatar = form.watch("avatar");
  const bio = form.watch("bio") || "";

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username.length >= 3) {
        setDebouncedUsername(username);
      } else {
        setDebouncedUsername("");
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username]);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: usernameCheck, isLoading: isCheckingUsername } = useQuery<{ available: boolean; reason: string | null }>({
    queryKey: ["/api/check-username", debouncedUsername],
    queryFn: async () => {
      const res = await fetch(`/api/check-username/${encodeURIComponent(debouncedUsername)}`);
      if (!res.ok) throw new Error("Failed to check username");
      return res.json();
    },
    enabled: debouncedUsername.length >= 3,
    staleTime: 5000,
  });

  useEffect(() => {
    // Populate form with existing user data in edit mode
    if (user && isEditMode) {
      form.reset({
        username: user.username || "",
        avatar: user.avatar || "cosmic-cat",
        bio: user.bio || "",
        allowFriendsToFind: user.allowFriendsToFind ?? true,
        isProfilePrivate: user.isProfilePrivate ?? false,
        moneyPhilosophy: user.moneyPhilosophy || "",
        whyImHere: user.whyImHere || "",
        friendVisibility: user.friendVisibility || "trend",
      });
    }
  }, [user, isEditMode]);

  const isPostGame = typeof window !== 'undefined' && window.location.search.includes("postgame=true");

  useEffect(() => {
    if (user?.profileSetupComplete && !isEditMode) {
      navigate("/");
    }
  }, [user?.profileSetupComplete, isEditMode, navigate]);

  const saveProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      if (isEditMode) {
        toast({
          title: "Profile updated",
          description: "Your changes have been saved.",
        });
        navigate("/social", { replace: true });
      } else if (isPostGame) {
        toast({
          title: "Profile set up!",
          description: "You're all set. Welcome to Lifestyle Creep!",
        });
        navigate("/", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const randomizeAvatar = () => {
    const options = avatarConfigs.filter(opt => opt.id !== avatar);
    const random = options[Math.floor(Math.random() * options.length)];
    form.setValue("avatar", random.id);
  };

  const handleUsernameChange = (value: string, onChange: (value: string) => void) => {
    const cleaned = value.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
    onChange(cleaned);
  };

  const canSubmit = username.length >= 3 && usernameCheck?.available === true;

  const onSubmit = (data: FormData) => {
    if (canSubmit) {
      saveProfileMutation.mutate(data);
    }
  };

  if (user?.profileSetupComplete && !isEditMode) {
    return null;
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
          <h1 className="text-2xl md:text-3xl font-display font-bold mb-2" data-testid="text-profile-title">
            Set Up Your Profile
          </h1>
          <p className="text-muted-foreground" data-testid="text-profile-description">
            Choose how you appear to friends
          </p>
        </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
                  className="flex justify-center py-2"
                >
                  <Mascot
                    mood="waving"
                    size="sm"
                    showBubble={true}
                    speechDelay={1400}
                    context={{ screen: "profile-setup" } satisfies MascotContext}
                  />
                </motion.div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="p-6 space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-username">Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="Choose a username"
                          {...field}
                          onChange={(e) => handleUsernameChange(e.target.value, field.onChange)}
                          className={cn(
                            "pr-10",
                            usernameCheck?.available === true && "border-green-500 focus-visible:ring-green-500",
                            usernameCheck?.available === false && "border-red-500 focus-visible:ring-red-500"
                          )}
                          data-testid="input-username"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {isCheckingUsername && (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" data-testid="icon-username-loading" />
                          )}
                          {!isCheckingUsername && usernameCheck?.available === true && (
                            <Check className="w-4 h-4 text-green-500" data-testid="icon-username-available" />
                          )}
                          {!isCheckingUsername && usernameCheck?.available === false && (
                            <X className="w-4 h-4 text-red-500" data-testid="icon-username-taken" />
                          )}
                        </div>
                      </div>
                    </FormControl>
                    {usernameCheck && (
                      <p 
                        className={cn(
                          "text-xs",
                          usernameCheck.available ? "text-green-600" : "text-red-600"
                        )}
                        data-testid="text-username-status"
                      >
                        {usernameCheck.available ? "Username available!" : usernameCheck.reason}
                      </p>
                    )}
                    <FormDescription data-testid="text-username-hint">
                      3-20 characters, letters, numbers, and underscores only
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avatar"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel data-testid="label-avatar">Avatar</FormLabel>
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="sm" 
                        onClick={randomizeAvatar}
                        data-testid="button-randomize-avatar"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Randomize
                      </Button>
                    </div>
                    <div className="flex justify-center mb-6" data-testid="display-selected-avatar">
                      <AnimatedAvatar 
                        avatarId={field.value} 
                        size="xl" 
                        showRing={true}
                        isAnimated={true}
                      />
                    </div>
                    <FormControl>
                      <div className="grid grid-cols-5 gap-3">
                        {avatarConfigs.map((config) => (
                          <button
                            key={config.id}
                            type="button"
                            onClick={() => field.onChange(config.id)}
                            className={cn(
                              "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                              field.value === config.id
                                ? "bg-primary/20 ring-2 ring-primary"
                                : "hover-elevate"
                            )}
                            data-testid={`button-avatar-${config.id}`}
                          >
                            <AnimatedAvatar 
                              avatarId={config.id} 
                              size="sm" 
                              isAnimated={field.value === config.id}
                            />
                            <span className="text-[9px] text-muted-foreground truncate max-w-full">
                              {config.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel data-testid="label-bio">Bio (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Something fun about you..."
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.slice(0, 100))}
                        className="resize-none"
                        rows={2}
                        data-testid="input-bio"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground text-right" data-testid="text-bio-count">
                      {bio.length}/100
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-semibold" data-testid="text-privacy-title">Privacy Settings</h3>
              
              <FormField
                control={form.control}
                name="allowFriendsToFind"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <FormLabel className="text-sm font-medium cursor-pointer" data-testid="label-allow-friends">
                          Allow friends to find me
                        </FormLabel>
                        <p className="text-xs text-muted-foreground" data-testid="text-allow-friends-hint">
                          Friends can search by username
                        </p>
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-allow-friends"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isProfilePrivate"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <div>
                        <FormLabel className="text-sm font-medium cursor-pointer" data-testid="label-private-profile">
                          Make my profile private
                        </FormLabel>
                        <p className="text-xs text-muted-foreground" data-testid="text-private-profile-hint">
                          Hide stats from leaderboards
                        </p>
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-private-profile"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </Card>

            <Button
              type="submit"
              size="lg"
              className="w-full btn-premium border-0"
              disabled={!canSubmit || saveProfileMutation.isPending}
              data-testid="button-continue"
            >
              {saveProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>
        </Form>
      </main>
    </div>
  );
}
