import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  TrendingUp,
  ChevronRight,
  Check,
  X,
  RefreshCw,
  Loader2,
  Users,
  Lock,
  Cat,
  Dog,
  Bird,
  Bot,
  Skull,
  Ghost,
  Fish,
  Rabbit,
  Squirrel,
  Bug,
  Flame,
  Rocket
} from "lucide-react";
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

const avatarOptions = [
  { id: "cat", label: "Cat", icon: Cat },
  { id: "dog", label: "Dog", icon: Dog },
  { id: "bird", label: "Bird", icon: Bird },
  { id: "robot", label: "Robot", icon: Bot },
  { id: "skull", label: "Skull", icon: Skull },
  { id: "ghost", label: "Ghost", icon: Ghost },
  { id: "fish", label: "Fish", icon: Fish },
  { id: "rabbit", label: "Rabbit", icon: Rabbit },
  { id: "squirrel", label: "Squirrel", icon: Squirrel },
  { id: "bug", label: "Bug", icon: Bug },
  { id: "flame", label: "Flame", icon: Flame },
  { id: "rocket", label: "Rocket", icon: Rocket },
];

const getAvatarIcon = (id: string) => {
  const option = avatarOptions.find(opt => opt.id === id);
  return option?.icon || Cat;
};

const formSchema = updateProfileSchema.extend({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be 20 characters or less")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
});

type FormData = z.infer<typeof formSchema>;

export default function ProfileSetup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [debouncedUsername, setDebouncedUsername] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      avatar: "cat",
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
    enabled: debouncedUsername.length >= 3,
    staleTime: 5000,
  });

  useEffect(() => {
    if (user?.profileSetupComplete) {
      navigate("/setup");
    }
  }, [user?.profileSetupComplete, navigate]);

  const saveProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      navigate("/setup");
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
    const options = avatarOptions.filter(opt => opt.id !== avatar);
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

  if (user?.profileSetupComplete) {
    return null;
  }

  const SelectedAvatarIcon = getAvatarIcon(avatar);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center justify-between gap-2 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg" data-testid="text-app-title">Lifestyle Creep</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="container max-w-md mx-auto p-4 space-y-6">
        <div className="text-center py-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-profile-title">
            Set Up Your Profile
          </h1>
          <p className="text-muted-foreground" data-testid="text-profile-description">
            Choose how you appear to friends
          </p>
        </div>

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
                    <div className="flex justify-center mb-4">
                      <div 
                        className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-primary/30"
                        data-testid="display-selected-avatar"
                      >
                        <SelectedAvatarIcon className="w-12 h-12 text-primary" />
                      </div>
                    </div>
                    <FormControl>
                      <div className="grid grid-cols-6 gap-2">
                        {avatarOptions.map((opt) => {
                          const Icon = opt.icon;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => field.onChange(opt.id)}
                              className={cn(
                                "w-full aspect-square rounded-md flex items-center justify-center transition-all",
                                field.value === opt.id
                                  ? "bg-primary/20 ring-2 ring-primary"
                                  : "bg-muted/50 hover-elevate"
                              )}
                              title={opt.label}
                              data-testid={`button-avatar-${opt.id}`}
                            >
                              <Icon className="w-5 h-5" />
                            </button>
                          );
                        })}
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
              className="w-full"
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
