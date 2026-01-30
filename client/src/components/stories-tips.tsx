import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X, ChevronLeft, ChevronRight, Lightbulb, Pause, Play } from "lucide-react";

interface Tip {
  id: string;
  content: string;
  category?: string;
  icon?: string;
  gradient?: string;
}

interface StoriesTipsProps {
  tips: Tip[];
  onClose?: () => void;
  autoAdvance?: boolean;
  advanceInterval?: number;
  className?: string;
}

export function StoriesTips({
  tips,
  onClose,
  autoAdvance = true,
  advanceInterval = 5000,
  className,
}: StoriesTipsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToNext = useCallback(() => {
    if (currentIndex < tips.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose?.();
    }
  }, [currentIndex, tips.length, onClose]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (!autoAdvance || isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + (100 / (advanceInterval / 50));
      });
    }, 50);

    return () => clearInterval(interval);
  }, [autoAdvance, isPaused, advanceInterval, goToNext]);

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width / 3) {
      goToPrev();
    } else if (x > (width * 2) / 3) {
      goToNext();
    } else {
      setIsPaused(!isPaused);
    }
  };

  const currentTip = tips[currentIndex];

  const gradients = [
    "from-emerald-600 to-teal-700",
    "from-blue-600 to-indigo-700",
    "from-purple-600 to-pink-700",
    "from-orange-500 to-red-600",
    "from-cyan-500 to-blue-600",
  ];

  const gradient = currentTip.gradient || gradients[currentIndex % gradients.length];

  return (
    <motion.div
      className={cn(
        "fixed inset-0 z-50 bg-black flex flex-col",
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex gap-1 p-2">
        {tips.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{
                width:
                  index < currentIndex
                    ? "100%"
                    : index === currentIndex
                    ? `${progress}%`
                    : "0%",
              }}
              transition={{ duration: 0.05 }}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-medium text-sm">Daily Tips</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
          >
            {isPaused ? (
              <Play className="w-4 h-4 text-white" />
            ) : (
              <Pause className="w-4 h-4 text-white" />
            )}
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative" onClick={handleTap}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br",
              gradient
            )}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
          >
            {currentTip.category && (
              <span className="text-white/70 text-sm mb-4 uppercase tracking-wider">
                {currentTip.category}
              </span>
            )}
            
            <motion.p
              className="text-white text-2xl md:text-3xl font-bold text-center leading-relaxed max-w-md"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {currentTip.content}
            </motion.p>

            <motion.div
              className="absolute bottom-8 flex items-center gap-4 text-white/50 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Tap to navigate</span>
              <ChevronRight className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <button
          onClick={(e) => { e.stopPropagation(); goToPrev(); }}
          className="absolute left-0 top-0 bottom-0 w-1/4 z-10"
          aria-label="Previous tip"
        />
        <button
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          className="absolute right-0 top-0 bottom-0 w-1/4 z-10"
          aria-label="Next tip"
        />
      </div>

      <div className="p-4 text-center text-white/50 text-xs">
        {currentIndex + 1} of {tips.length}
      </div>
    </motion.div>
  );
}

interface TipCardCarouselProps {
  tips: Tip[];
  className?: string;
}

export function TipCardCarousel({ tips, className }: TipCardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tips.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [tips.length]);

  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border rounded-xl"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Tip {currentIndex + 1} of {tips.length}
              </p>
              <p className="text-sm">{tips[currentIndex].content}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-center gap-1 mt-2">
        {tips.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              index === currentIndex ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
}
