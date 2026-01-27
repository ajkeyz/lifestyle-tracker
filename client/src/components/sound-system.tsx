import { createContext, useContext, useState, useCallback, useEffect } from "react";

type SoundType = 
  | "click"
  | "correct"
  | "incorrect"
  | "tick"
  | "timeWarning"
  | "complete"
  | "levelUp"
  | "streak"
  | "achievement"
  | "notification";

interface SoundSystemContextType {
  isMuted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  playSound: (sound: SoundType) => void;
}

const SoundSystemContext = createContext<SoundSystemContextType | null>(null);

const soundFrequencies: Record<SoundType, { freq: number; duration: number; type: OscillatorType }[]> = {
  click: [{ freq: 800, duration: 50, type: "sine" }],
  correct: [
    { freq: 523, duration: 100, type: "sine" },
    { freq: 659, duration: 100, type: "sine" },
    { freq: 784, duration: 150, type: "sine" }
  ],
  incorrect: [
    { freq: 200, duration: 100, type: "square" },
    { freq: 150, duration: 200, type: "square" }
  ],
  tick: [{ freq: 1000, duration: 30, type: "sine" }],
  timeWarning: [
    { freq: 440, duration: 100, type: "square" },
    { freq: 0, duration: 100, type: "sine" },
    { freq: 440, duration: 100, type: "square" }
  ],
  complete: [
    { freq: 523, duration: 100, type: "sine" },
    { freq: 659, duration: 100, type: "sine" },
    { freq: 784, duration: 100, type: "sine" },
    { freq: 1047, duration: 200, type: "sine" }
  ],
  levelUp: [
    { freq: 392, duration: 80, type: "sine" },
    { freq: 523, duration: 80, type: "sine" },
    { freq: 659, duration: 80, type: "sine" },
    { freq: 784, duration: 80, type: "sine" },
    { freq: 1047, duration: 200, type: "sine" }
  ],
  streak: [
    { freq: 659, duration: 100, type: "triangle" },
    { freq: 784, duration: 100, type: "triangle" },
    { freq: 880, duration: 150, type: "triangle" }
  ],
  achievement: [
    { freq: 523, duration: 150, type: "sine" },
    { freq: 0, duration: 50, type: "sine" },
    { freq: 659, duration: 150, type: "sine" },
    { freq: 0, duration: 50, type: "sine" },
    { freq: 784, duration: 300, type: "sine" }
  ],
  notification: [
    { freq: 880, duration: 80, type: "sine" },
    { freq: 1174, duration: 120, type: "sine" }
  ]
};

export function SoundSystemProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sound-muted");
      return saved === "true";
    }
    return false;
  });
  
  const [volume, setVolumeState] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sound-volume");
      return saved ? parseFloat(saved) : 0.3;
    }
    return 0.3;
  });

  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    const initAudio = () => {
      if (!audioContext) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
      }
    };

    document.addEventListener("click", initAudio, { once: true });
    document.addEventListener("touchstart", initAudio, { once: true });

    return () => {
      document.removeEventListener("click", initAudio);
      document.removeEventListener("touchstart", initAudio);
    };
  }, [audioContext]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      localStorage.setItem("sound-muted", String(!prev));
      return !prev;
    });
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolumeState(clampedVolume);
    localStorage.setItem("sound-volume", String(clampedVolume));
  }, []);

  const playSound = useCallback((sound: SoundType) => {
    if (isMuted || !audioContext) return;

    const notes = soundFrequencies[sound];
    let time = audioContext.currentTime;

    notes.forEach(({ freq, duration, type }) => {
      if (freq === 0) {
        time += duration / 1000;
        return;
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(freq, time);

      gainNode.gain.setValueAtTime(volume * 0.3, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration / 1000);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(time);
      oscillator.stop(time + duration / 1000);

      time += duration / 1000;
    });
  }, [isMuted, volume, audioContext]);

  return (
    <SoundSystemContext.Provider value={{ isMuted, volume, toggleMute, setVolume, playSound }}>
      {children}
    </SoundSystemContext.Provider>
  );
}

export function useSoundSystem() {
  const context = useContext(SoundSystemContext);
  if (!context) {
    return {
      isMuted: false,
      volume: 0.3,
      toggleMute: () => {},
      setVolume: () => {},
      playSound: () => {}
    };
  }
  return context;
}

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface SoundControlsProps {
  className?: string;
  showSlider?: boolean;
}

export function SoundControls({ className, showSlider = false }: SoundControlsProps) {
  const { isMuted, volume, toggleMute, setVolume, playSound } = useSoundSystem();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => {
          toggleMute();
          if (isMuted) {
            playSound("click");
          }
        }}
        data-testid="button-sound-toggle"
      >
        {isMuted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
      
      {showSlider && !isMuted && (
        <Slider
          value={[volume * 100]}
          onValueChange={([val]) => setVolume(val / 100)}
          max={100}
          step={1}
          className="w-24"
          data-testid="slider-volume"
        />
      )}
    </div>
  );
}
