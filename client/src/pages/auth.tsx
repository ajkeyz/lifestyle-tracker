import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppLogo } from "@/components/app-logo";
import { Shield, Users, Zap, Mail } from "lucide-react";
import { SiApple, SiGoogle } from "react-icons/si";

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center justify-between gap-2 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <AppLogo size="sm" />
          <span className="font-display font-bold text-lg tracking-tight" data-testid="text-app-title">Lifestyle Creep</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="container max-w-md mx-auto p-4 py-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-6">
            <AppLogo size="lg" glow className="rounded-full mx-auto" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-3 tracking-tight" data-testid="text-auth-title">
            Build Wealth, Not Habits
          </h1>
          <p className="text-muted-foreground text-lg" data-testid="text-auth-subtitle">
            2 minutes a day to master your money decisions
          </p>
        </div>

        <Card className="p-6 mb-6" data-testid="card-signup">
          <div className="space-y-3">
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-start gap-3"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-continue-apple"
            >
              <SiApple className="w-5 h-5" />
              Continue with Apple
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="w-full justify-start gap-3"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-continue-google"
            >
              <SiGoogle className="w-5 h-5" />
              Continue with Google
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
            
            <Button
              size="lg"
              className="w-full justify-start gap-3"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-continue-email"
            >
              <Mail className="w-5 h-5" />
              Sign up with Email
            </Button>
          </div>
        </Card>

        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-sm text-muted-foreground" data-testid="text-privacy-note">
            <Shield className="w-4 h-4 flex-shrink-0 text-primary" />
            <span>No spam. No judgment. Just better decisions.</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground" data-testid="text-social-note">
            <Users className="w-4 h-4 flex-shrink-0 text-primary" />
            <span>Your friends only see your Money Health score if you choose.</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-3 rounded-md bg-muted/50" data-testid="badge-trust-daily">
            <Zap className="w-5 h-5 mx-auto mb-2 text-accent" />
            <div className="text-xs text-muted-foreground" data-testid="text-trust-daily">2 min daily</div>
          </div>
          <div className="text-center p-3 rounded-md bg-muted/50" data-testid="badge-trust-free">
            <Shield className="w-5 h-5 mx-auto mb-2 text-primary" />
            <div className="text-xs text-muted-foreground" data-testid="text-trust-free">100% free</div>
          </div>
          <div className="text-center p-3 rounded-md bg-muted/50" data-testid="badge-trust-community">
            <Users className="w-5 h-5 mx-auto mb-2 text-chart-4" />
            <div className="text-xs text-muted-foreground" data-testid="text-trust-community">Join 10k+</div>
          </div>
        </div>

        <footer className="text-center text-xs text-muted-foreground pt-4 border-t" data-testid="footer-auth">
          <p className="mb-2">
            By continuing, you agree to our{" "}
            <a href="/terms" className="underline" data-testid="link-terms">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline" data-testid="link-privacy">
              Privacy Policy
            </a>
          </p>
          <p className="text-muted-foreground/60">
            Lifestyle Creep {new Date().getFullYear()}
          </p>
        </footer>
      </main>
    </div>
  );
}
