import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Trophy, Flame, Star, Users, Gift, Bell, 
  CheckCircle, AlertCircle, Info, X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

type NotificationType = "achievement" | "streak" | "friend" | "reward" | "info" | "success" | "warning";

interface GameNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
}

interface NotificationToastProps {
  notifications: GameNotification[];
  onDismiss: (id: string) => void;
  position?: "top-right" | "top-center" | "bottom-right" | "bottom-center";
}

export function NotificationToast({ 
  notifications, 
  onDismiss,
  position = "top-right"
}: NotificationToastProps) {
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "achievement":
        return <Trophy className="w-5 h-5 text-chart-5" />;
      case "streak":
        return <Flame className="w-5 h-5 text-destructive" />;
      case "friend":
        return <Users className="w-5 h-5 text-primary" />;
      case "reward":
        return <Gift className="w-5 h-5 text-chart-4" />;
      case "success":
        return <CheckCircle className="w-5 h-5 text-primary" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-chart-5" />;
      default:
        return <Info className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2"
  };

  return (
    <div className={cn("fixed z-50 flex flex-col gap-2", positionClasses[position])} data-testid="notification-container">
      <AnimatePresence>
        {notifications.map((notification) => (
          <SingleNotification
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
            icon={getIcon(notification.type)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface SingleNotificationProps {
  notification: GameNotification;
  onDismiss: (id: string) => void;
  icon: React.ReactNode;
}

function SingleNotification({ notification, onDismiss, icon }: SingleNotificationProps) {
  const [progress, setProgress] = useState(100);
  const duration = notification.duration || 5000;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining === 0) {
        onDismiss(notification.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [notification.id, duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={cn(
        "relative overflow-hidden",
        "bg-card border rounded-lg shadow-lg",
        "min-w-72 max-w-sm"
      )}
      data-testid={`notification-${notification.id}`}
    >
      <div className="p-4 flex items-start gap-3">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        >
          {icon}
        </motion.div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold">{notification.title}</p>
          <p className="text-sm text-muted-foreground">{notification.message}</p>
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={() => onDismiss(notification.id)}
          data-testid={`button-dismiss-notification-${notification.id}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <motion.div
        className="h-1 bg-primary"
        initial={{ width: "100%" }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.1 }}
      />
    </motion.div>
  );
}

interface AchievementUnlockProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  rarity?: "common" | "rare" | "epic" | "legendary";
  onClose: () => void;
}

export function AchievementUnlock({
  title,
  description,
  icon,
  rarity = "common",
  onClose
}: AchievementUnlockProps) {
  const rarityColors = {
    common: "from-gray-500 to-gray-600",
    rare: "from-blue-500 to-blue-600",
    epic: "from-purple-500 to-purple-600",
    legendary: "from-yellow-500 to-amber-600"
  };

  const rarityGlow = {
    common: "",
    rare: "shadow-blue-500/30",
    epic: "shadow-purple-500/30",
    legendary: "shadow-yellow-500/50"
  };

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className={cn(
          "relative bg-card rounded-xl p-6 max-w-sm w-full",
          "shadow-2xl",
          rarityGlow[rarity]
        )}
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 10 }}
        transition={{ type: "spring", stiffness: 200 }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          className={cn(
            "absolute inset-0 rounded-xl opacity-20",
            "bg-gradient-to-br",
            rarityColors[rarity]
          )}
          animate={{
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        <div className="relative text-center">
          <motion.div
            className="mb-4 flex justify-center"
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            {icon || <Star className="w-16 h-16 text-chart-5 fill-chart-5" />}
          </motion.div>

          <motion.p
            className="text-xs uppercase tracking-wider text-muted-foreground mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Achievement Unlocked
          </motion.p>

          <motion.h3
            className={cn(
              "text-xl font-bold mb-2",
              "bg-gradient-to-r bg-clip-text text-transparent",
              rarityColors[rarity]
            )}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {title}
          </motion.h3>

          <motion.p
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {description}
          </motion.p>

          <motion.div
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button onClick={onClose}>Awesome!</Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
