import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Home, 
  Users, 
  MessageSquare, 
  User,
  Trophy
} from "lucide-react";
import type { User as UserType } from "@shared/schema";

interface NavItem {
  path: string;
  icon: typeof Home;
  label: string;
}

const navItems: NavItem[] = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/leaderboard", icon: Trophy, label: "Ranks" },
  { path: "/community", icon: MessageSquare, label: "Community" },
  { path: "/friends", icon: Users, label: "Friends" },
  { path: "/profile", icon: User, label: "Profile" },
];

export function BottomNav() {
  const [location] = useLocation();
  const { data: user } = useQuery<UserType>({ queryKey: ["/api/user"] });

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
                  <Avatar className={cn("w-5 h-5", active && "ring-2 ring-primary ring-offset-1 ring-offset-background")}>
                    <AvatarImage src={user.avatar} alt={user.username || "Profile"} />
                    <AvatarFallback className="text-[8px]">
                      {(user.username || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Icon className={cn("w-5 h-5", active && "animate-bounce-subtle")} />
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

interface FloatingPlayButtonProps {
  onClick: () => void;
  disabled?: boolean;
  hasPlayedToday?: boolean;
  className?: string;
}

export function FloatingPlayButton({
  onClick,
  disabled = false,
  hasPlayedToday = false,
  className,
}: FloatingPlayButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "fixed bottom-20 right-4 z-40",
        "w-14 h-14 rounded-full",
        "bg-gradient-to-br from-primary to-primary/80",
        "text-white shadow-lg shadow-primary/30",
        "flex items-center justify-center",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        hasPlayedToday && "bg-gradient-to-br from-accent to-accent/80 shadow-accent/30",
        className
      )}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      data-testid="fab-play"
    >
      {hasPlayedToday ? (
        <Trophy className="w-6 h-6" />
      ) : (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current">
            <path d="M8 5v14l11-7z" />
          </svg>
        </motion.div>
      )}
      
      {!hasPlayedToday && !disabled && (
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/30"
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.button>
  );
}

export function SafeAreaSpacer() {
  return <div className="h-20" />;
}
