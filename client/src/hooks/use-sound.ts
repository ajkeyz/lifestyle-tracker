import { useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

type SoundType = 
  | "correct" 
  | "incorrect" 
  | "timerWarning" 
  | "timerCritical" 
  | "timeUp" 
  | "achievement" 
  | "perfectScore" 
  | "streakMilestone"
  | "click"
  | "whoosh";

const audioContext = typeof window !== "undefined" ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

function createOscillatorSound(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume: number = 0.3
): () => void {
  return () => {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  };
}

function createMultiToneSound(
  frequencies: number[],
  durations: number[],
  type: OscillatorType = "sine",
  volume: number = 0.3
): () => void {
  return () => {
    if (!audioContext) return;
    
    let currentTime = audioContext.currentTime;
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(freq, currentTime);
      oscillator.type = type;
      
      const duration = durations[index] || durations[0];
      gainNode.gain.setValueAtTime(volume, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
      
      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);
      
      currentTime += duration * 0.8;
    });
  };
}

const SOUNDS: Record<SoundType, () => void> = {
  correct: createMultiToneSound([523, 659, 784], [0.1, 0.1, 0.15], "sine", 0.25),
  incorrect: createMultiToneSound([311, 233], [0.15, 0.25], "sawtooth", 0.15),
  timerWarning: createOscillatorSound(440, 0.1, "square", 0.15),
  timerCritical: createMultiToneSound([523, 392], [0.08, 0.08], "square", 0.2),
  timeUp: createMultiToneSound([392, 330, 262], [0.15, 0.15, 0.3], "sawtooth", 0.2),
  achievement: createMultiToneSound([523, 659, 784, 1047], [0.1, 0.1, 0.1, 0.2], "sine", 0.25),
  perfectScore: createMultiToneSound([523, 659, 784, 1047, 1319], [0.1, 0.1, 0.1, 0.15, 0.25], "sine", 0.3),
  streakMilestone: createMultiToneSound([392, 523, 659, 784], [0.12, 0.12, 0.12, 0.2], "triangle", 0.25),
  click: createOscillatorSound(800, 0.05, "sine", 0.1),
  whoosh: createOscillatorSound(200, 0.15, "sine", 0.1),
};

export function useSound() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const soundEnabled = user?.soundEnabled ?? true;

  const play = useCallback((sound: SoundType) => {
    if (!soundEnabled) return;
    
    if (audioContext?.state === "suspended") {
      audioContext.resume();
    }
    
    const soundFn = SOUNDS[sound];
    if (soundFn) {
      soundFn();
    }
  }, [soundEnabled]);

  const toggleSound = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/toggle-sound");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });

  return {
    play,
    soundEnabled,
    toggleSound: toggleSound.mutate,
    isToggling: toggleSound.isPending,
  };
}

export function useSoundEffect(sound: SoundType, trigger: boolean) {
  const { play } = useSound();
  const lastTrigger = useRef(trigger);

  useEffect(() => {
    if (trigger && !lastTrigger.current) {
      play(sound);
    }
    lastTrigger.current = trigger;
  }, [trigger, sound, play]);
}
