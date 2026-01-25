import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hoverEffect?: boolean;
  onClick?: () => void;
  "data-testid"?: string;
}

export function AnimatedCard({ 
  children, 
  className, 
  delay = 0, 
  hoverEffect = false,
  onClick,
  "data-testid": dataTestId
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={hoverEffect ? { y: -2, transition: { duration: 0.2 } } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={onClick ? "cursor-pointer" : undefined}
    >
      <Card className={cn(hoverEffect && "hover-elevate", className)} data-testid={dataTestId}>
        {children}
      </Card>
    </motion.div>
  );
}

export function AnimatedCardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <CardHeader className={className}>{children}</CardHeader>;
}

export function AnimatedCardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <CardContent className={className}>{children}</CardContent>;
}

export function AnimatedCardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <CardTitle className={className}>{children}</CardTitle>;
}

export function AnimatedCardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <CardDescription className={className}>{children}</CardDescription>;
}

export function AnimatedCardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <CardFooter className={className}>{children}</CardFooter>;
}

export { CardContent, CardHeader, CardTitle, CardDescription, CardFooter };
