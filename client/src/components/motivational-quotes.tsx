/**
 * Motivational Quotes Component
 *
 * Rotating inspirational quotes with smooth transitions
 * Features: auto-rotation, category filtering, favorite quotes
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, Heart, RefreshCw, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface MotivationalQuote {
  id: string;
  text: string;
  author: string;
  category: "motivation" | "success" | "perseverance" | "growth" | "wisdom";
}

const QUOTES: MotivationalQuote[] = [
  {
    id: "1",
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
    category: "wisdom",
  },
  {
    id: "2",
    text: "Small daily improvements are the key to staggering long-term results.",
    author: "Unknown",
    category: "growth",
  },
  {
    id: "3",
    text: "Success is the sum of small efforts repeated day in and day out.",
    author: "Robert Collier",
    category: "success",
  },
  {
    id: "4",
    text: "It's not about perfect. It's about effort.",
    author: "Jillian Michaels",
    category: "motivation",
  },
  {
    id: "5",
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    category: "success",
  },
  {
    id: "6",
    text: "Fall seven times, stand up eight.",
    author: "Japanese Proverb",
    category: "perseverance",
  },
  {
    id: "7",
    text: "Your only limit is you.",
    author: "Unknown",
    category: "motivation",
  },
  {
    id: "8",
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
    category: "perseverance",
  },
  {
    id: "9",
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
    category: "motivation",
  },
  {
    id: "10",
    text: "Progress, not perfection.",
    author: "Unknown",
    category: "growth",
  },
  {
    id: "11",
    text: "Every accomplishment starts with the decision to try.",
    author: "John F. Kennedy",
    category: "motivation",
  },
  {
    id: "12",
    text: "You don't have to be great to start, but you have to start to be great.",
    author: "Zig Ziglar",
    category: "growth",
  },
];

const CATEGORY_COLORS: Record<MotivationalQuote["category"], string> = {
  motivation: "from-orange-500 to-red-500",
  success: "from-green-500 to-emerald-500",
  perseverance: "from-blue-500 to-cyan-500",
  growth: "from-purple-500 to-pink-500",
  wisdom: "from-yellow-500 to-amber-500",
};

interface MotivationalQuotesProps {
  quotes?: MotivationalQuote[];
  autoRotate?: boolean;
  rotateInterval?: number;
  showControls?: boolean;
  showCategory?: boolean;
  allowFavorites?: boolean;
  onFavorite?: (quoteId: string) => void;
}

export function MotivationalQuotes({
  quotes = QUOTES,
  autoRotate = true,
  rotateInterval = 10000,
  showControls = true,
  showCategory = true,
  allowFavorites = false,
  onFavorite,
}: MotivationalQuotesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const currentQuote = quotes[currentIndex];

  // Auto-rotation
  useEffect(() => {
    if (!autoRotate || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length);
    }, rotateInterval);

    return () => clearInterval(interval);
  }, [autoRotate, isPaused, quotes.length, rotateInterval]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % quotes.length);
    setIsPaused(true);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + quotes.length) % quotes.length);
    setIsPaused(true);
  };

  const handleRandom = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    setCurrentIndex(randomIndex);
    setIsPaused(true);
  };

  const handleFavorite = () => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(currentQuote.id)) {
      newFavorites.delete(currentQuote.id);
    } else {
      newFavorites.add(currentQuote.id);
    }
    setFavorites(newFavorites);
    onFavorite?.(currentQuote.id);
  };

  const isFavorited = favorites.has(currentQuote.id);

  return (
    <Card className="relative overflow-hidden glass-card">
      {/* Background Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${CATEGORY_COLORS[currentQuote.category]} opacity-5`}
      />

      <div className="relative p-6 space-y-4">
        {/* Quote Icon */}
        <div className="flex justify-center">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${CATEGORY_COLORS[currentQuote.category]} flex items-center justify-center shadow-lg`}>
            <Quote className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Quote Text */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuote.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <blockquote className="text-center">
              <p className="text-lg md:text-xl font-medium italic text-foreground leading-relaxed">
                "{currentQuote.text}"
              </p>
            </blockquote>

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground">— {currentQuote.author}</span>
              {showCategory && (
                <Badge className={`bg-gradient-to-r ${CATEGORY_COLORS[currentQuote.category]} capitalize`}>
                  {currentQuote.category}
                </Badge>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        {showControls && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              aria-label="Previous quote"
              className="h-8 w-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex gap-1">
              {quotes.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsPaused(true);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? `bg-primary w-6`
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                  aria-label={`Go to quote ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              aria-label="Next quote"
              className="h-8 w-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            <div className="h-6 w-px bg-border mx-1" />

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRandom}
              aria-label="Random quote"
              className="h-8 w-8"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>

            {allowFavorites && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleFavorite}
                aria-label={isFavorited ? "Unfavorite" : "Favorite"}
                className="h-8 w-8"
              >
                <Heart
                  className={`w-4 h-4 ${isFavorited ? "fill-red-500 text-red-500" : ""}`}
                />
              </Button>
            )}
          </div>
        )}

        {/* Progress indicator */}
        {autoRotate && !isPaused && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/30">
            <motion.div
              className={`h-full bg-gradient-to-r ${CATEGORY_COLORS[currentQuote.category]}`}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: rotateInterval / 1000, ease: "linear" }}
              key={currentIndex}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Compact version for sidebars/headers
 */
export function CompactQuote({ quotes = QUOTES }: { quotes?: MotivationalQuote[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length);
    }, 15000);

    return () => clearInterval(interval);
  }, [quotes.length]);

  const currentQuote = quotes[currentIndex];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentQuote.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border"
      >
        <Quote className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <p className="text-sm italic line-clamp-2">{currentQuote.text}</p>
          <p className="text-xs text-muted-foreground mt-1">— {currentQuote.author}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Daily Quote - shows one quote per day
 */
export function DailyQuote({ quotes = QUOTES }: { quotes?: MotivationalQuote[] }) {
  // Get quote based on day of year
  const getDailyQuote = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    return quotes[dayOfYear % quotes.length];
  };

  const quote = getDailyQuote();

  return (
    <Card className="glass-card">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Quote of the Day</h3>
        </div>
        <blockquote className="border-l-4 border-primary pl-4 italic">
          <p className="text-base">{quote.text}</p>
          <footer className="text-sm text-muted-foreground mt-2">— {quote.author}</footer>
        </blockquote>
      </div>
    </Card>
  );
}
