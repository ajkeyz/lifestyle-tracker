import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
  color?: "primary" | "success" | "warning" | "danger" | "gradient";
  showPercentage?: boolean;
  animate?: boolean;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  className,
  children,
  color = "primary",
  showPercentage = false,
  animate = true
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const colorClasses = {
    primary: "stroke-primary",
    success: "stroke-primary",
    warning: "stroke-chart-5",
    danger: "stroke-destructive",
    gradient: ""
  };

  const gradientId = `progress-gradient-${Math.random().toString(36).slice(2)}`;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} data-testid="progress-ring">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        
        {color === "gradient" && (
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="50%" stopColor="hsl(var(--chart-4))" />
              <stop offset="100%" stopColor="hsl(var(--chart-5))" />
            </linearGradient>
          </defs>
        )}

        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color === "gradient" ? `url(#${gradientId})` : undefined}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={color !== "gradient" ? colorClasses[color] : ""}
          initial={animate ? { strokeDashoffset: circumference } : undefined}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference
          }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showPercentage && (
          <motion.span
            className="text-lg font-bold"
            initial={animate ? { opacity: 0, scale: 0.5 } : undefined}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            {Math.round(progress)}%
          </motion.span>
        ))}
      </div>
    </div>
  );
}

interface MultiProgressRingProps {
  segments: {
    value: number;
    color: string;
    label?: string;
  }[];
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}

export function MultiProgressRing({
  segments,
  size = 120,
  strokeWidth = 8,
  className,
  children
}: MultiProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let accumulatedOffset = 0;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        
        {segments.map((segment, index) => {
          const segmentLength = (segment.value / total) * circumference;
          const offset = circumference - segmentLength + accumulatedOffset;
          accumulatedOffset -= segmentLength;

          return (
            <motion.circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeOut", delay: index * 0.2 }}
              style={{
                strokeDasharray: circumference
              }}
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

interface ScoreRingProps {
  score: number;
  maxScore?: number;
  size?: number;
  className?: string;
  label?: string;
}

export function ScoreRing({ 
  score, 
  maxScore = 100, 
  size = 100, 
  className,
  label = "Score"
}: ScoreRingProps) {
  const progress = (score / maxScore) * 100;
  
  const getColor = () => {
    if (progress >= 80) return "success";
    if (progress >= 60) return "primary";
    if (progress >= 40) return "warning";
    return "danger";
  };

  return (
    <ProgressRing
      progress={progress}
      size={size}
      color={getColor()}
      className={className}
    >
      <div className="text-center">
        <motion.div
          className="text-2xl font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {score}
        </motion.div>
        <motion.div
          className="text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {label}
        </motion.div>
      </div>
    </ProgressRing>
  );
}

interface TimerRingProps {
  timeRemaining: number;
  totalTime: number;
  size?: number;
  className?: string;
  critical?: number;
}

export function TimerRing({
  timeRemaining,
  totalTime,
  size = 80,
  className,
  critical = 5
}: TimerRingProps) {
  const progress = (timeRemaining / totalTime) * 100;
  const isCritical = timeRemaining <= critical;

  return (
    <motion.div
      animate={isCritical ? {
        scale: [1, 1.05, 1]
      } : {}}
      transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
    >
      <ProgressRing
        progress={progress}
        size={size}
        strokeWidth={6}
        color={isCritical ? "danger" : "primary"}
        className={className}
        animate={false}
      >
        <motion.span
          className={cn(
            "text-xl font-bold",
            isCritical && "text-destructive"
          )}
          animate={isCritical ? {
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ duration: 0.3, repeat: isCritical ? Infinity : 0 }}
        >
          {timeRemaining}
        </motion.span>
      </ProgressRing>
    </motion.div>
  );
}
