import appIcon from "../assets/app-icon.png";

interface AppLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  glow?: boolean;
}

export function AppLogo({ size = "sm", className = "", glow = false }: AppLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-20 h-20",
  };

  return (
    <div 
      className={`${sizeClasses[size]} rounded-md overflow-hidden flex items-center justify-center ${glow ? "glow-primary" : ""} ${className}`}
    >
      <img 
        src={appIcon} 
        alt="Lifestyle Creep" 
        className="w-full h-full object-cover"
      />
    </div>
  );
}
