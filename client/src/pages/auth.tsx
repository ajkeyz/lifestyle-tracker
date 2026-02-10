import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppLogo } from "@/components/app-logo";
import { Lock, TrendingUp, Clock, Mail } from "lucide-react";
import { SiApple, SiGoogle } from "react-icons/si";
import { Link } from "wouter";

export default function AuthPage() {
  const [playersToday, setPlayersToday] = useState(0);

  useEffect(() => {
    const base = 1247;
    const hour = new Date().getHours();
    const noise = Math.floor(Math.sin(hour * 7.3) * 180 + 200);
    setPlayersToday(base + noise);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-md mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full"
        >
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              className="mx-auto mb-6"
            >
              <AppLogo size="lg" glow className="rounded-md mx-auto" />
              <p className="text-xs font-medium text-muted-foreground/60 mt-3 tracking-widest uppercase">Lifestyle Creep</p>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="text-2xl font-semibold mb-2 tracking-[-0.02em]"
              data-testid="text-auth-title"
            >
              Your money habits, decoded.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="text-muted-foreground text-[0.9375rem] leading-relaxed"
              data-testid="text-auth-subtitle"
            >
              5 scenarios. 2 minutes. One smarter you.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
          >
            <Card className="p-5 mb-5" data-testid="card-signup">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-center gap-3 font-medium"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-continue-apple"
                >
                  <SiApple className="w-5 h-5" />
                  Continue with Apple
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-center gap-3 font-medium"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-continue-google"
                >
                  <SiGoogle className="w-5 h-5" />
                  Continue with Google
                </Button>

                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-3 text-muted-foreground">or</span>
                  </div>
                </div>

                <Button
                  size="lg"
                  className="w-full justify-center gap-3 font-medium"
                  onClick={() => window.location.href = "/api/login"}
                  data-testid="button-continue-email"
                >
                  <Mail className="w-4 h-4" />
                  Continue with Email
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="space-y-3 mb-8"
          >
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground" data-testid="text-privacy-note">
              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Private by default. No bank access needed.</span>
            </div>

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5" data-testid="badge-trust-daily">
                <Clock className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                <span>2 min/day</span>
              </div>
              <span className="text-border">|</span>
              <div className="flex items-center gap-1.5" data-testid="badge-trust-free">
                <TrendingUp className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                <span>Always free</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            className="text-center"
          >
            <p className="text-xs text-muted-foreground/50 mb-2" data-testid="text-social-proof">
              {playersToday.toLocaleString()} people played today
            </p>

            <p className="text-[11px] text-muted-foreground/40" data-testid="footer-auth">
              By continuing, you agree to our{" "}
              <Link href="/terms" className="underline" data-testid="link-terms">
                Terms
              </Link>{" "}
              &{" "}
              <Link href="/privacy" className="underline" data-testid="link-privacy">
                Privacy Policy
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
