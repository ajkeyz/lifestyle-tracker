import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  ArrowLeft,
  Heart,
  EyeOff,
  Users,
  Flame,
  BookOpen,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Bell,
  Shield,
  Settings2,
  Volume2,
  VolumeX,
  Crown,
  Sparkles,
  Trash2,
  AlertTriangle,
  Download,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Timer,
  Vibrate,
  Share2,
  Star,
  Mail,
  FileText,
  Lock,
  UserPlus,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useSound } from "@/hooks/use-sound";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { ReferralCard } from "@/components/referral-card";
import { AnimatedAvatar } from "@/components/animated-avatar";
import type { User } from "@shared/schema";
import { AmbientBackground } from "@/components/ambient-background";
import { GradientStripe } from "@/components/gradient-stripe";

// ─── Inline helpers ───────────────────────────────────────────────────

function SectionHeader({ children }: { children: string }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 mb-2">
      {children}
    </h2>
  );
}

function SettingsRow({
  icon: Icon,
  iconClassName,
  label,
  description,
  onClick,
  trailing,
  className,
}: {
  icon: LucideIcon;
  iconClassName?: string;
  label: string;
  description?: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${onClick ? "cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors" : ""} ${className || ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconClassName || "bg-muted"}`}>
        <Icon className="w-4 h-4 text-inherit" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground leading-tight mt-0.5">{description}</p>
        )}
      </div>
      {trailing ?? (onClick ? <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : null)}
    </div>
  );
}

const TIMER_OPTIONS = [
  { value: "15", label: "15s — Fast" },
  { value: "20", label: "20s — Default" },
  { value: "30", label: "30s — Relaxed" },
];

// ─── Main component ──────────────────────────────────────────────────

export default function Settings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { soundEnabled, toggleSound, isToggling } = useSound();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [lowPressureOpen, setLowPressureOpen] = useState(false);
  const [hapticEnabled, setHapticEnabled] = useState(
    () => localStorage.getItem("hapticEnabled") !== "false"
  );
  const [timerDuration, setTimerDuration] = useState(
    () => localStorage.getItem("timerDuration") || "20"
  );

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: friends } = useQuery<{ id: string; username: string; avatar: string; moneyHealth: number; streak: number }[]>({
    queryKey: ["/api/friends"],
  });

  const { data: adminCheck } = useQuery<{ isAdmin: boolean; isModerator: boolean; hasAccess: boolean }>({
    queryKey: ["/api/admin/check"],
  });

  const toggleLowPressureMode = useMutation({
    mutationFn: async (enabled: boolean) => {
      return apiRequest("POST", "/api/low-pressure-mode", { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: user?.lowPressureMode ? "Low Pressure Mode disabled" : "Low Pressure Mode enabled",
        description: user?.lowPressureMode
          ? "Rankings and comparisons are now visible."
          : "Focus on your personal growth.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/account");
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account and all data have been permanently deleted.",
      });
      setTimeout(() => {
        logout();
      }, 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete account. Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleHapticToggle = (enabled: boolean) => {
    setHapticEnabled(enabled);
    localStorage.setItem("hapticEnabled", String(enabled));
    toast({
      title: enabled ? "Haptic feedback enabled" : "Haptic feedback disabled",
      description: enabled ? "You'll feel vibrations during gameplay." : "Vibrations are now off.",
    });
  };

  const handleTimerChange = (value: string) => {
    setTimerDuration(value);
    localStorage.setItem("timerDuration", value);
    toast({
      title: "Timer updated",
      description: `Question timer set to ${value} seconds.`,
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: "Lifestyle Creep",
      text: "I'm playing Lifestyle Creep — a daily money game like Wordle! Make real-life money decisions and compete with friends.",
      url: window.location.origin,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        toast({ title: "Link copied!", description: "Share it with your friends." });
      }
    } catch {
      // User cancelled share
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50 p-4">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-24 w-full mb-4 rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50 relative overflow-x-clip">
      <AmbientBackground variant="default" />
      {/* Header */}
      <header className="flex items-center gap-3 px-4 h-14 border-b bg-card/80 backdrop-blur-xl sticky top-0 z-50 border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display font-extrabold text-[15px] leading-none tracking-[-0.04em]" data-testid="text-page-title">Settings</h1>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-6">

        {/* ─── Profile Banner ───────────────────────────────── */}
        <Card
          className="relative cursor-pointer overflow-hidden border-0 bg-gradient-to-br from-card via-card to-primary/5 dark:to-primary/10 rounded-2xl"
          onClick={() => navigate("/profile")}
          data-testid="card-profile-banner"
        >
          <CardContent className="p-5">
            <GradientStripe variant="primary" />
            <div className="flex items-center gap-4">
              <AnimatedAvatar
                avatarId={user.avatar || "cosmic-cat"}
                size="lg"
                isAnimated={false}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="font-display font-bold text-xl truncate">
                    {user.username}
                  </h2>
                  {user.membershipTier === "pro" && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white flex-shrink-0">
                      PRO
                    </span>
                  )}
                  {user.membershipTier === "plus" && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white flex-shrink-0">
                      PLUS
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
                <p className="text-xs text-muted-foreground mt-1">Tap to view profile</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </div>
          </CardContent>
        </Card>

        {/* ─── Appearance ───────────────────────────────────── */}
        <div>
          <SectionHeader>Appearance</SectionHeader>
          <Card className="overflow-hidden rounded-2xl" data-testid="card-appearance">
            <CardContent className="p-4">
              <div className="flex gap-2">
                {([
                  { value: "light" as const, icon: Sun, label: "Light" },
                  { value: "dark" as const, icon: Moon, label: "Dark" },
                  { value: "system" as const, icon: Monitor, label: "System" },
                ] as const).map(({ value, icon: ThemeIcon, label }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition-all ${
                      theme === value
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                    data-testid={`button-theme-${value}`}
                  >
                    <ThemeIcon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Gameplay ─────────────────────────────────────── */}
        <div>
          <SectionHeader>Gameplay</SectionHeader>
          <Card className="overflow-hidden rounded-2xl" data-testid="card-gameplay">
            {/* Low Pressure Mode */}
            <Collapsible open={lowPressureOpen} onOpenChange={setLowPressureOpen}>
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4 h-4 text-pink-500" />
                </div>
                <CollapsibleTrigger asChild>
                  <div className="flex-1 min-w-0 cursor-pointer">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium leading-tight">Low Pressure Mode</p>
                      <motion.div
                        animate={{ rotate: lowPressureOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                      </motion.div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                      Play without the stress
                    </p>
                  </div>
                </CollapsibleTrigger>
                <Switch
                  checked={user.lowPressureMode}
                  onCheckedChange={(checked) => toggleLowPressureMode.mutate(checked)}
                  disabled={toggleLowPressureMode.isPending}
                  data-testid="switch-low-pressure-mode"
                />
              </div>
              <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                <div className="px-4 pb-3 space-y-2.5 ml-11">
                  {[
                    { icon: EyeOff, text: "No ranks shown", desc: "Position numbers hidden across the app" },
                    { icon: Users, text: "No friend comparisons", desc: "Leaderboards and competitive features hidden" },
                    { icon: Flame, text: "Just your streak + learning", desc: "Focus on daily practice and growth", iconClass: "text-orange-500" },
                    { icon: BookOpen, text: "Deep Dive still available", desc: "Learn from every decision", iconClass: "text-blue-500" },
                  ].map(({ icon: ItemIcon, text, desc, iconClass }) => (
                    <div key={text} className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ItemIcon className={`w-3 h-3 ${iconClass || "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{text}</p>
                        <p className="text-[11px] text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Sound Effects */}
            <SettingsRow
              icon={soundEnabled ? Volume2 : VolumeX}
              iconClassName="bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-emerald-500"
              label="Sound Effects"
              description="Audio feedback during gameplay"
              trailing={
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={() => toggleSound()}
                  disabled={isToggling}
                  data-testid="switch-sound-effects"
                />
              }
            />

            <Separator />

            {/* Haptic Feedback */}
            <SettingsRow
              icon={Vibrate}
              iconClassName="bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-500"
              label="Haptic Feedback"
              description="Vibration on interactions"
              trailing={
                <Switch
                  checked={hapticEnabled}
                  onCheckedChange={handleHapticToggle}
                  data-testid="switch-haptic-feedback"
                />
              }
            />

            <Separator />

            {/* Timer Duration */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
                <Timer className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">Timer Duration</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">Time per question</p>
              </div>
              <Select value={timerDuration} onValueChange={handleTimerChange}>
                <SelectTrigger className="w-[130px] h-9 text-xs" data-testid="select-timer-duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        </div>

        {/* ─── Features ─────────────────────────────────────── */}
        <div>
          <SectionHeader>Features</SectionHeader>
          <Card className="overflow-hidden rounded-2xl" data-testid="card-features">
            <SettingsRow
              icon={BookOpen}
              iconClassName="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 text-yellow-600"
              label="Financial Tips Library"
              description="Browse money wisdom by category"
              onClick={() => navigate("/tips")}
            />
            <Separator />
            <SettingsRow
              icon={Shield}
              iconClassName="bg-gradient-to-br from-purple-500/20 to-violet-600/20 text-purple-500"
              label="Streak Insurance"
              description="Protect and restore your streaks"
              onClick={() => navigate("/streak-insurance")}
            />
            <Separator />
            <SettingsRow
              icon={Crown}
              iconClassName="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 text-yellow-600"
              label="Membership"
              description={
                user.membershipTier === "free"
                  ? "Unlock premium features"
                  : `Manage your ${user.membershipTier === "pro" ? "Pro" : "Plus"} plan`
              }
              onClick={() => navigate("/membership")}
              trailing={
                <div className="flex items-center gap-2">
                  {user.membershipTier === "pro" && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                      PRO
                    </span>
                  )}
                  {user.membershipTier === "plus" && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                      PLUS
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              }
            />
            <Separator />
            <SettingsRow
              icon={Bell}
              iconClassName="bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-orange-500"
              label="Notifications"
              description="Smart reminders, not spam"
              onClick={() => navigate("/notifications-prefs")}
            />
          </Card>
        </div>

        {/* ─── Referral Card ────────────────────────────────── */}
        <ReferralCard />

        {/* ─── Friends ────────────────────────────────────────── */}
        {!user.lowPressureMode && (
          <div>
            <SectionHeader>Friends</SectionHeader>
            <Card className="overflow-hidden rounded-2xl" data-testid="card-friends-section">
              {/* Rankings header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Trophy className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold">Rankings</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground"
                  onClick={() => navigate("/friends")}
                >
                  View All
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Ranking rows */}
              <div className="px-4 pb-3">
                {friends && friends.length > 0 ? (
                  <div className="space-y-1">
                    {friends.slice(0, 5).map((friend, index) => (
                      <Link
                        key={friend.id}
                        href={`/profile/${friend.id}`}
                        data-testid={`friend-rank-${friend.id}`}
                      >
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                          <span className="text-xs font-bold text-muted-foreground w-5 text-center tabular-nums">
                            #{index + 1}
                          </span>
                          <div className="relative">
                            <AnimatedAvatar avatarId={friend.avatar || "cosmic-cat"} size="sm" />
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${
                                friend.streak > 0 ? "bg-green-500" : "bg-muted-foreground/30"
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{friend.username}</p>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-primary" />
                              {friend.moneyHealth}
                            </span>
                            {friend.streak > 0 && (
                              <span className="flex items-center gap-1">
                                <Flame className="w-3 h-3 text-orange-500" />
                                {friend.streak}d
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center">
                      <Users className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-0.5">No friends yet</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Add friends to compare scores
                    </p>
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => navigate("/friends")}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add Friends
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ─── About & Support ──────────────────────────────── */}
        <div>
          <SectionHeader>About & Support</SectionHeader>
          <Card className="overflow-hidden rounded-2xl" data-testid="card-about-support">
            <SettingsRow
              icon={HelpCircle}
              iconClassName="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-blue-500"
              label="Help & FAQ"
              description="Get answers to common questions"
              onClick={() => navigate("/help")}
            />
            <Separator />
            <SettingsRow
              icon={Mail}
              iconClassName="bg-gradient-to-br from-teal-500/20 to-green-500/20 text-teal-500"
              label="Contact Support"
              description="Report bugs or ask questions"
              onClick={() => {
                window.location.href = "mailto:support@lifestylecreep.app";
              }}
            />
            <Separator />
            <SettingsRow
              icon={Share2}
              iconClassName="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-500"
              label="Share with Friends"
              description="Invite others to play"
              onClick={handleShare}
              trailing={
                <Share2 className="w-4 h-4 text-muted-foreground" />
              }
            />
            <Separator />
            <SettingsRow
              icon={Star}
              iconClassName="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 text-yellow-500"
              label="Rate the App"
              description="Help us grow with a review"
              onClick={() => {
                // Will link to actual app store URL when published
                toast({ title: "Coming soon!", description: "App Store rating link will be available soon." });
              }}
            />
            <Separator />
            <SettingsRow
              icon={FileText}
              iconClassName="bg-muted text-muted-foreground"
              label="Terms of Service"
              onClick={() => navigate("/terms")}
            />
            <Separator />
            <SettingsRow
              icon={Lock}
              iconClassName="bg-muted text-muted-foreground"
              label="Privacy Policy"
              onClick={() => navigate("/privacy")}
            />
          </Card>
        </div>

        {/* ─── Admin (conditional) ──────────────────────────── */}
        {adminCheck?.hasAccess && (
          <div>
            <Card className="overflow-hidden rounded-2xl" data-testid="card-admin">
              <SettingsRow
                icon={Settings2}
                iconClassName="bg-gradient-to-br from-slate-700/20 to-slate-900/20 text-slate-500"
                label="Admin Dashboard"
                description={adminCheck.isAdmin ? "Super Admin" : "Moderator"}
                onClick={() => navigate("/admin")}
              />
            </Card>
          </div>
        )}

        {/* ─── Data & Account ───────────────────────────────── */}
        <div>
          <SectionHeader>Data & Account</SectionHeader>
          <Card className="overflow-hidden rounded-2xl" data-testid="card-data-account">
            {/* Download Data */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Download className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">Download Your Data</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                  Export profile, history & settings
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.location.href = "/api/export-data";
                  toast({
                    title: "Downloading data",
                    description: "Your data export will download shortly.",
                  });
                }}
                data-testid="button-export-data"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export
              </Button>
            </div>

            <Separator />

            {/* Log Out */}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <LogOut className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-tight">Log Out</p>
                <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                  Sign out of your account
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                data-testid="button-logout"
              >
                Log Out
              </Button>
            </div>

            <Separator />

            {/* Delete Account */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight text-destructive">Delete Account</p>
                  <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                    Permanently delete all data
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-destructive/5 mb-3 ml-11">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  This cannot be undone. All data including streak, achievements, and game history will be permanently deleted.
                </p>
              </div>

              <div className="ml-11">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      disabled={deleteAccountMutation.isPending}
                      data-testid="button-delete-account"
                    >
                      {deleteAccountMutation.isPending ? (
                        "Deleting..."
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                          Delete My Account
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p>
                          This will permanently delete your account and remove your data from our servers.
                        </p>
                        <div className="space-y-2 text-sm">
                          <p className="font-medium text-foreground">You will lose:</p>
                          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Your {user?.streak || 0} day streak</li>
                            <li>All {user?.gamesPlayed || 0} games played</li>
                            <li>{user?.badges?.length || 0} achievements earned</li>
                            <li>Friends, leagues, and challenges</li>
                            <li>Purchase history (if applicable)</li>
                          </ul>
                        </div>
                        <p className="text-destructive font-medium">
                          This action cannot be undone.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteAccountMutation.mutate()}
                        className="bg-destructive hover:bg-destructive/90"
                        data-testid="button-confirm-delete"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        </div>

        {/* ─── App Info Footer ──────────────────────────────── */}
        <footer className="text-center pb-24 pt-4 space-y-1" data-testid="footer-app-info">
          <p className="text-xs text-muted-foreground/60 font-mono">
            Lifestyle Creep v1.0.0
          </p>
          <p className="text-[11px] text-muted-foreground/40">
            Made with care for your financial future
          </p>
        </footer>

      </main>
    </div>
  );
}
