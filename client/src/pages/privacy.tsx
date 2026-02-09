import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Privacy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-3 p-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("/")}
            data-testid="button-back-privacy"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-lg" data-testid="text-privacy-title">Privacy Policy</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <p className="text-xs text-muted-foreground mb-8" data-testid="text-privacy-updated">Last updated: February 9, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          <section id="overview">
            <h2 className="font-display font-semibold text-base mb-2">Our Approach</h2>
            <p className="text-muted-foreground">
              Lifestyle Creep is private by default. We collect the minimum data needed to run the app and never access your bank accounts, credit cards, or financial institutions. Your money stays your business.
            </p>
          </section>

          <section id="what-we-collect">
            <h2 className="font-display font-semibold text-base mb-2">What We Collect</h2>
            <p className="text-muted-foreground mb-2">When you use Lifestyle Creep, we collect:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>Email address and authentication provider ID (for login)</li>
              <li>Username, avatar, and bio (if you set them up)</li>
              <li>Game data: answers, scores, streaks, and Money Health</li>
              <li>Basic usage analytics: session frequency, features used</li>
              <li>Device information: browser type, screen size, OS</li>
            </ul>
          </section>

          <section id="what-we-dont-collect">
            <h2 className="font-display font-semibold text-base mb-2">What We Do Not Collect</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>Bank account credentials or access</li>
              <li>Credit card or payment card numbers</li>
              <li>Financial account balances or transaction history</li>
              <li>Location data beyond basic timezone</li>
            </ul>
          </section>

          <section id="how-we-use-data">
            <h2 className="font-display font-semibold text-base mb-2">How We Use Your Data</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>Operate the app and deliver your daily scenarios</li>
              <li>Personalize your experience (streaks, scores, leaderboards)</li>
              <li>Improve the app based on aggregate usage patterns</li>
              <li>Prevent fraud and abuse</li>
              <li>Send notifications you opted into (daily reminders, streak alerts)</li>
            </ul>
          </section>

          <section id="sharing">
            <h2 className="font-display font-semibold text-base mb-2">Sharing</h2>
            <p className="text-muted-foreground mb-2">
              We do not sell your personal data. We share data only with:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>Hosting and infrastructure providers (to run the app)</li>
              <li>Authentication providers (to manage login)</li>
              <li>Analytics tools (aggregate, anonymized data only)</li>
            </ul>
          </section>

          <section id="cookies">
            <h2 className="font-display font-semibold text-base mb-2">Cookies & Local Storage</h2>
            <p className="text-muted-foreground">
              We use cookies and local storage for session management, authentication, and remembering your preferences (like theme and sound settings). We do not use advertising or tracking cookies.
            </p>
          </section>

          <section id="retention">
            <h2 className="font-display font-semibold text-base mb-2">Data Retention & Deletion</h2>
            <p className="text-muted-foreground">
              We retain your data as long as your account is active. You can request full deletion of your account and data at any time by contacting us. We will process deletion requests within 30 days.
            </p>
          </section>

          <section id="children">
            <h2 className="font-display font-semibold text-base mb-2">Children</h2>
            <p className="text-muted-foreground">
              Lifestyle Creep is not intended for children under 13. If we become aware that a user is under 13, we will delete their account and data.
            </p>
          </section>

          <section id="security">
            <h2 className="font-display font-semibold text-base mb-2">Security</h2>
            <p className="text-muted-foreground">
              We use reasonable technical and organizational measures to protect your data, including encrypted connections and secure authentication. No system is perfectly secure, but we take data protection seriously.
            </p>
          </section>

          <section id="changes">
            <h2 className="font-display font-semibold text-base mb-2">Changes to This Policy</h2>
            <p className="text-muted-foreground">
              If we make meaningful changes to this policy, we will notify you through the app before the changes take effect.
            </p>
          </section>

          <section id="contact">
            <h2 className="font-display font-semibold text-base mb-2">Contact</h2>
            <p className="text-muted-foreground">
              Questions about your data? Reach us at{" "}
              <a href="mailto:privacy@lifestylecreep.app" className="text-primary underline" data-testid="link-privacy-email">
                privacy@lifestylecreep.app
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
