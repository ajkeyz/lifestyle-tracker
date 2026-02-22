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
      className={`${sizeClasses[size]} rounded-xl overflow-hidden flex items-center justify-center ${glow ? "glow-primary" : ""} ${className}`}
      style={{ background: "linear-gradient(135deg, #7c5cbf 0%, #6d28d9 100%)" }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-[85%] h-[85%]"
        aria-label="Lifestyle Creep"
      >
        {/* Monster body */}
        <ellipse cx={50} cy={56} rx={24} ry={26} fill="#9b7ed8" />
        <ellipse cx={50} cy={56} rx={24} ry={26} fill="url(#logo-body-grad)" />

        {/* Belly highlight */}
        <ellipse cx={50} cy={60} rx={14} ry={13} fill="#b8a0e8" opacity={0.35} />

        {/* Spots */}
        <ellipse cx={33} cy={50} rx={2.5} ry={2} fill="#b8a0e8" opacity={0.5} />
        <ellipse cx={65} cy={48} rx={2} ry={1.8} fill="#b8a0e8" opacity={0.4} />

        {/* Tail */}
        <path
          d="M 74 62 Q 82 58 86 50 Q 88 46 86 44"
          stroke="#9b7ed8"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx={86} cy={44} r={3} fill="#b8a0e8" />

        {/* Feet */}
        <ellipse cx={38} cy={80} rx={8} ry={4.5} fill="#8b6ec0" />
        <ellipse cx={62} cy={80} rx={8} ry={4.5} fill="#8b6ec0" />
        {/* Toe bumps */}
        <circle cx={33} cy={79} r={2} fill="#7c5cbf" />
        <circle cx={38} cy={80} r={2} fill="#7c5cbf" />
        <circle cx={57} cy={80} r={2} fill="#7c5cbf" />
        <circle cx={62} cy={79} r={2} fill="#7c5cbf" />

        {/* Monster horns */}
        <path d="M 36 34 C 34 30 30 22 28 16" stroke="#c4b0e0" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M 64 34 C 66 30 70 22 72 16" stroke="#c4b0e0" strokeWidth="5" strokeLinecap="round" fill="none" />
        <circle cx={28} cy={16} r={3.5} fill="#d8c8f0" />
        <circle cx={72} cy={16} r={3.5} fill="#d8c8f0" />

        {/* Eyes */}
        <circle cx={40} cy={50} r={6} fill="white" />
        <circle cx={60} cy={50} r={6} fill="white" />
        <circle cx={41} cy={50} r={3.5} fill="#1a1a2e" />
        <circle cx={61} cy={50} r={3.5} fill="#1a1a2e" />
        {/* Eye shine */}
        <circle cx={43} cy={48} r={1.5} fill="white" />
        <circle cx={63} cy={48} r={1.5} fill="white" />

        {/* Smile with fangs */}
        <path d="M 38 62 Q 50 70 62 62" stroke="#1a1a2e" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Fangs */}
        <path d="M 40 62 L 42 66 L 44 62" fill="white" />
        <path d="M 56 62 L 58 66 L 60 62" fill="white" />

        <defs>
          <linearGradient id="logo-body-grad" x1="50" y1="30" x2="50" y2="82" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#b8a0e8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
