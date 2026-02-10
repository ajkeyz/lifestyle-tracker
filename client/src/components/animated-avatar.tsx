import { motion } from "framer-motion";
import { 
  Cat, Dog, Bird, Bot, Skull, Ghost, Fish, Rabbit, 
  Squirrel, Bug, Flame, Rocket, Sparkles, Zap, Star,
  Heart, Crown, Diamond, Moon, Sun
} from "lucide-react";

export interface AvatarConfig {
  id: string;
  icon: typeof Cat;
  gradient: string;
  accentColor: string;
  label: string;
}

export const avatarConfigs: AvatarConfig[] = [
  { id: "cosmic-cat", icon: Cat, gradient: "from-purple-500 via-pink-500 to-rose-500", accentColor: "purple", label: "Cosmic Cat" },
  { id: "neon-dog", icon: Dog, gradient: "from-cyan-400 via-blue-500 to-purple-600", accentColor: "cyan", label: "Neon Pup" },
  { id: "phoenix-bird", icon: Bird, gradient: "from-orange-500 via-red-500 to-pink-500", accentColor: "orange", label: "Phoenix" },
  { id: "cyber-bot", icon: Bot, gradient: "from-emerald-400 via-teal-500 to-cyan-500", accentColor: "emerald", label: "Cyber Bot" },
  { id: "shadow-skull", icon: Skull, gradient: "from-slate-600 via-gray-700 to-zinc-800", accentColor: "slate", label: "Shadow" },
  { id: "spectral-ghost", icon: Ghost, gradient: "from-indigo-400 via-purple-500 to-pink-400", accentColor: "indigo", label: "Spectral" },
  { id: "ocean-fish", icon: Fish, gradient: "from-blue-400 via-cyan-500 to-teal-400", accentColor: "blue", label: "Ocean" },
  { id: "lucky-rabbit", icon: Rabbit, gradient: "from-pink-400 via-rose-400 to-orange-300", accentColor: "pink", label: "Lucky" },
  { id: "forest-squirrel", icon: Squirrel, gradient: "from-amber-500 via-orange-500 to-yellow-400", accentColor: "amber", label: "Forest" },
  { id: "glitch-bug", icon: Bug, gradient: "from-lime-400 via-green-500 to-emerald-500", accentColor: "lime", label: "Glitch" },
  { id: "inferno-flame", icon: Flame, gradient: "from-red-500 via-orange-500 to-yellow-400", accentColor: "red", label: "Inferno" },
  { id: "stellar-rocket", icon: Rocket, gradient: "from-violet-500 via-purple-500 to-fuchsia-500", accentColor: "violet", label: "Stellar" },
  { id: "magic-sparkle", icon: Sparkles, gradient: "from-yellow-400 via-amber-400 to-orange-400", accentColor: "yellow", label: "Magic" },
  { id: "electric-zap", icon: Zap, gradient: "from-yellow-300 via-lime-400 to-green-400", accentColor: "yellow", label: "Electric" },
  { id: "superstar", icon: Star, gradient: "from-amber-400 via-yellow-400 to-orange-300", accentColor: "amber", label: "Superstar" },
  { id: "sweetheart", icon: Heart, gradient: "from-rose-400 via-pink-500 to-red-400", accentColor: "rose", label: "Sweetheart" },
  { id: "royal-crown", icon: Crown, gradient: "from-yellow-500 via-amber-500 to-orange-400", accentColor: "yellow", label: "Royal" },
  { id: "crystal-diamond", icon: Diamond, gradient: "from-sky-300 via-blue-400 to-indigo-400", accentColor: "sky", label: "Crystal" },
  { id: "midnight-moon", icon: Moon, gradient: "from-indigo-600 via-purple-600 to-violet-700", accentColor: "indigo", label: "Midnight" },
  { id: "solar-sun", icon: Sun, gradient: "from-yellow-400 via-orange-400 to-red-400", accentColor: "orange", label: "Solar" },
];

export function getAvatarConfig(id: string): AvatarConfig {
  return avatarConfigs.find(a => a.id === id) || avatarConfigs[0];
}

interface AnimatedAvatarProps {
  avatarId: string;
  size?: "sm" | "md" | "lg" | "xl";
  showRing?: boolean;
  isAnimated?: boolean;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
};

const iconSizes = {
  sm: "w-5 h-5",
  md: "w-8 h-8",
  lg: "w-12 h-12",
  xl: "w-16 h-16",
};

export function AnimatedAvatar({ 
  avatarId, 
  size = "md", 
  showRing = false,
  isAnimated = true,
  onClick,
  selected = false,
  className = ""
}: AnimatedAvatarProps) {
  const config = getAvatarConfig(avatarId);
  const Icon = config.icon;
  
  return (
    <motion.div
      className={`relative ${onClick ? "cursor-pointer" : ""} ${className}`}
      whileHover={onClick ? { scale: 1.05 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      onClick={onClick}
    >
      {showRing && (
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${config.gradient} -m-1`}
          animate={isAnimated ? { 
            rotate: 360,
            scale: [1, 1.02, 1]
          } : undefined}
          transition={isAnimated ? { 
            rotate: { duration: 8, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          } : undefined}
          style={{ padding: "3px" }}
        >
          <div className="w-full h-full rounded-full bg-background" />
        </motion.div>
      )}
      
      {selected && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-primary -m-1"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        />
      )}
      
      <motion.div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center relative overflow-hidden`}
        animate={isAnimated ? { 
          boxShadow: [
            `0 0 20px 0px rgba(var(--${config.accentColor}-rgb, 139, 92, 246), 0.3)`,
            `0 0 30px 5px rgba(var(--${config.accentColor}-rgb, 139, 92, 246), 0.5)`,
            `0 0 20px 0px rgba(var(--${config.accentColor}-rgb, 139, 92, 246), 0.3)`,
          ]
        } : undefined}
        transition={isAnimated ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 dark:from-black/40 to-transparent" />

        {isAnimated && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/10 dark:via-foreground/20 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
          />
        )}
        
        <motion.div
          animate={isAnimated ? { 
            y: [0, -2, 0],
            rotate: [0, -5, 5, 0]
          } : undefined}
          transition={isAnimated ? { 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          } : undefined}
        >
          <Icon className={`${iconSizes[size]} text-white drop-shadow-lg`} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

interface AvatarSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function AvatarSelector({ selectedId, onSelect }: AvatarSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-3 p-4">
      {avatarConfigs.map((config) => (
        <motion.button
          key={config.id}
          type="button"
          className="flex flex-col items-center gap-1 p-2 rounded-xl hover-elevate focus:outline-none focus:ring-2 focus:ring-primary/50"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(config.id)}
          data-testid={`avatar-option-${config.id}`}
        >
          <AnimatedAvatar 
            avatarId={config.id} 
            size="sm" 
            selected={selectedId === config.id}
            isAnimated={selectedId === config.id}
          />
          <span className="text-[10px] text-muted-foreground truncate max-w-full">
            {config.label}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
