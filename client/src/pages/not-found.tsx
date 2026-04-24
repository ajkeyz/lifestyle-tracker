import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Compass, Home as HomeIcon, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, navigate] = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-background via-background to-muted/30 px-4">
      <Card className="w-full max-w-md mx-auto border-border/60">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Compass className="h-7 w-7 text-primary" />
          </div>

          <h1 className="text-2xl font-bold mb-2" data-testid="text-not-found-title">
            Lost in the noise
          </h1>
          <p className="text-sm text-muted-foreground mb-6" data-testid="text-not-found-message">
            We couldn't find that page. Let's get you back to something useful.
          </p>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => navigate("/")}
              className="w-full"
              data-testid="button-go-home"
            >
              <HomeIcon className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <Button
              onClick={handleBack}
              variant="ghost"
              className="w-full"
              data-testid="button-go-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
