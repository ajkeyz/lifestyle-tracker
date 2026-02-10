import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Terms() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto flex items-center gap-3 p-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate("/")}
            data-testid="button-back-terms"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-lg" data-testid="text-terms-title">Terms of Service</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <p className="text-xs text-muted-foreground mb-8" data-testid="text-terms-updated">Last updated: February 9, 2026</p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          <section id="welcome">
            <h2 className="font-semibold text-base mb-2">Welcome to Lifestyle Creep</h2>
            <p className="text-muted-foreground">
              Lifestyle Creep is a daily financial decision-making game designed to help you build better money instincts. It is an educational tool, not financial advice. Nothing in this app should be taken as a recommendation to buy, sell, invest, or make any specific financial decision.
            </p>
          </section>

          <section id="eligibility">
            <h2 className="font-semibold text-base mb-2">Eligibility</h2>
            <p className="text-muted-foreground">
              You must be at least 13 years old to use Lifestyle Creep. By creating an account, you confirm that you meet this requirement.
            </p>
          </section>

          <section id="account">
            <h2 className="font-semibold text-base mb-2">Your Account</h2>
            <p className="text-muted-foreground">
              You are responsible for keeping your login credentials secure. If you believe your account has been compromised, contact us immediately. We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section id="acceptable-use">
            <h2 className="font-semibold text-base mb-2">Acceptable Use</h2>
            <p className="text-muted-foreground mb-2">
              You agree not to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 pl-2">
              <li>Use the app for any unlawful purpose</li>
              <li>Attempt to manipulate leaderboards or game results</li>
              <li>Harass, threaten, or abuse other users</li>
              <li>Upload harmful, offensive, or misleading content</li>
              <li>Reverse-engineer or scrape the app</li>
            </ul>
          </section>

          <section id="user-content">
            <h2 className="font-semibold text-base mb-2">User Content</h2>
            <p className="text-muted-foreground">
              When you submit scenarios, comments, or other content, you retain ownership but grant us a license to display and use that content within the app. We may remove content that violates these terms or community guidelines.
            </p>
          </section>

          <section id="pricing">
            <h2 className="font-semibold text-base mb-2">Pricing</h2>
            <p className="text-muted-foreground">
              Lifestyle Creep is free to use. We may introduce optional paid features in the future. If we do, pricing and terms will be clearly communicated before any purchase.
            </p>
          </section>

          <section id="disclaimers">
            <h2 className="font-semibold text-base mb-2">Disclaimers</h2>
            <p className="text-muted-foreground">
              The app is provided "as is" without warranties of any kind. We do not guarantee that the app will be uninterrupted, error-free, or that game scenarios reflect real-world outcomes. Lifestyle Creep is for educational and entertainment purposes only.
            </p>
          </section>

          <section id="liability">
            <h2 className="font-semibold text-base mb-2">Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the fullest extent permitted by law, Lifestyle Creep and its team are not liable for any indirect, incidental, or consequential damages arising from your use of the app, including any financial decisions you make.
            </p>
          </section>

          <section id="termination">
            <h2 className="font-semibold text-base mb-2">Termination</h2>
            <p className="text-muted-foreground">
              We may suspend or terminate your access at any time for violations of these terms. You can delete your account at any time by contacting us.
            </p>
          </section>

          <section id="changes">
            <h2 className="font-semibold text-base mb-2">Changes to These Terms</h2>
            <p className="text-muted-foreground">
              We may update these terms from time to time. Continued use of the app after changes constitutes acceptance. We will notify you of significant changes through the app.
            </p>
          </section>

          <section id="governing-law">
            <h2 className="font-semibold text-base mb-2">Governing Law</h2>
            <p className="text-muted-foreground">
              These terms are governed by the laws of the jurisdiction in which Lifestyle Creep operates.
            </p>
          </section>

          <section id="contact">
            <h2 className="font-semibold text-base mb-2">Contact</h2>
            <p className="text-muted-foreground">
              Questions? Reach us at{" "}
              <a href="mailto:support@lifestylecreep.app" className="text-primary underline" data-testid="link-contact-email">
                support@lifestylecreep.app
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
