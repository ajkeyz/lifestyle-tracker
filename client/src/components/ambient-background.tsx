/**
 * Ambient Background Component
 *
 * Adds floating orbs with subtle animations for visual depth
 * Works in both light and dark modes
 * Lazy-loads after 100ms for better FCP (First Contentful Paint)
 */

import { useState, useEffect } from "react";

interface AmbientBackgroundProps {
  variant?: "default" | "premium" | "minimal";
}

export function AmbientBackground({ variant = "default" }: AmbientBackgroundProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Lazy-load after initial render for better FCP
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return null;
  }
  if (variant === "minimal") {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      </div>
    );
  }

  if (variant === "premium") {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Primary orb - top left */}
        <div
          className="absolute -top-48 -left-48 w-96 h-96 rounded-full blur-3xl ambient-orb"
          style={{
            background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
            animationDelay: "0s",
          }}
        />

        {/* Accent orb - top right */}
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-3xl ambient-orb"
          style={{
            background: "radial-gradient(circle, hsl(var(--accent) / 0.2) 0%, transparent 70%)",
            animationDelay: "5s",
          }}
        />

        {/* Secondary orb - bottom center */}
        <div
          className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl ambient-orb"
          style={{
            background: "radial-gradient(circle, hsl(270 67% 58% / 0.12) 0%, transparent 70%)",
            animationDelay: "10s",
          }}
        />
      </div>
    );
  }

  // Default variant
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Primary orb - top left */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)",
          animationDuration: "4s",
        }}
      />

      {/* Accent orb - bottom right */}
      <div
        className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
        style={{
          background: "radial-gradient(circle, hsl(var(--accent) / 0.12) 0%, transparent 70%)",
          animationDuration: "5s",
          animationDelay: "1s",
        }}
      />

      {/* Secondary orb - center */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
          animationDuration: "6s",
          animationDelay: "2s",
        }}
      />
    </div>
  );
}
