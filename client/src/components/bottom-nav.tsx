import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { AnimatedAvatar } from "@/components/animated-avatar";
import { Home, Gamepad2, Users2, User } from "lucide-react";
import type { User as UserType } from "@shared/schema";

interface NavItem {
  path: string;
  icon: typeof Home;
  label: string;
  /** Show notification dot when true */
  showDot?: boolean;
}

export function BottomNav() {
  const [location] = useLocation();
  const { data: user } = useQuery<UserType>({ queryKey: ["/api/user"] });

  // Check for unread social activity
  const { data: socialUnread } = useQuery<{ hasUnread: boolean }>({
    queryKey: ["/api/social/unread"],
    refetchInterval: 60000, // check every minute
  });

  const navItems: NavItem[] = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/play-hub", icon: Gamepad2, label: "Play" },
    { path: "/social", icon: Users2, label: "Social", showDot: socialUnread?.hasUnread },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    return location.startsWith(path);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t safe-area-bottom"
      data-testid="bottom-nav"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;
          const isProfile = item.label === "Profile";

          return (
            <Link
              key={item.path}
              href={item.path}
              className="relative flex flex-col items-center justify-center flex-1 h-full"
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <motion.div
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
                whileTap={{ scale: 0.95 }}
              >
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute top-0 left-0 right-0 mx-auto w-8 h-1 bg-primary rounded-b-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                {isProfile && user?.avatar ? (
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full overflow-hidden",
                      active && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                    )}
                  >
                    <AnimatedAvatar
                      avatarId={user.avatar}
                      size="xs"
                      isAnimated={false}
                      className="w-6 h-6 [&>div]:w-6 [&>div]:h-6"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <Icon className={cn("w-5 h-5", active && "animate-bounce-subtle")} />
                    {/* Notification dot */}
                    {item.showDot && !active && (
                      <motion.div
                        className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      />
                    )}
                  </div>
                )}
                <span className="text-[10px] font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SafeAreaSpacer() {
  return <div className="h-20" />;
}
