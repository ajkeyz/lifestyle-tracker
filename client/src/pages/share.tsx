import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Brain, 
  Heart, 
  Flame, 
  Share2,
  Palette,
  Eye,
  EyeOff,
  Users,
  Smartphone,
} from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { SiInstagram } from "react-icons/si";
import type { User, DailyDrop, League } from "@shared/schema";

const THEME_COLORS = [
  { id: "default", label: "Default", gradient: "from-primary to-accent", bg: "bg-card" },
  { id: "green", label: "Money Green", gradient: "from-emerald-500 to-green-600", bg: "bg-emerald-950/30" },
  { id: "blue", label: "Cool Blue", gradient: "from-blue-500 to-indigo-600", bg: "bg-blue-950/30" },
  { id: "purple", label: "Royal Purple", gradient: "from-purple-500 to-pink-600", bg: "bg-purple-950/30" },
  { id: "gold", label: "Gold Rush", gradient: "from-yellow-500 to-orange-600", bg: "bg-yellow-950/30" },
  { id: "dark", label: "Stealth", gradient: "from-zinc-600 to-zinc-800", bg: "bg-zinc-950/50" },
];

export default function SharePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("default");
  const [hideNumbers, setHideNumbers] = useState(false);
  const [leagueName, setLeagueName] = useState("");

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: dailyDrop } = useQuery<DailyDrop>({
    queryKey: ["/api/daily-drop"],
  });

  const { data: leagues } = useQuery<League[]>({
    queryKey: ["/api/leagues"],
  });

  if (!user?.todayResult) {
    navigate("/");
    return null;
  }

  const result = user.todayResult;
  const scenarios = dailyDrop?.scenarios || [];
  const answers = result.answers.map((answer, index) => {
    const scenario = scenarios[index];
    if (!scenario) return "neutral";
    const choice = scenario.choices.find((c) => c.label === answer);
    if (choice?.isCorrect) return "correct";
    return "wrong";
  });

  const theme = THEME_COLORS.find(t => t.id === selectedTheme) || THEME_COLORS[0];

  const generateShareText = () => {
    const squares = answers
      .map((status) => {
        if (status === "correct") return "[+]";
        return "[X]";
      })
      .join(" ");
    
    const iqText = hideNumbers ? "***" : result.iq.toString();
    const healthText = hideNumbers ? "***" : result.moneyHealth.toString();
    const streakText = hideNumbers ? "***" : user.streak.toString();
    
    let text = `Lifestyle Creep #${dailyDrop?.dropNumber || 0}\n`;
    text += `IQ: ${iqText}/500 | Health: ${healthText}/100 | Streak: ${streakText}\n`;
    text += `${squares}\n`;
    
    if (leagueName) {
      text += `League: ${leagueName}\n`;
    }
    
    text += `\nPlay at: lifestyle-creep.replit.app`;
    return text;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateShareText());
    setCopied(true);
    toast({ title: "Copied to clipboard!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareInstagram = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Lifestyle Creep Results",
          text: generateShareText(),
        });
      } catch {
        toast({ 
          title: "Share to Instagram", 
          description: "Take a screenshot of your results card and share to Instagram Stories."
        });
      }
    } else {
      toast({
        title: "Share to Instagram",
        description: "Take a screenshot of your results card and share to Instagram Stories."
      });
    }
  };

  const handleShareiMessage = async () => {
    const text = encodeURIComponent(generateShareText());
    const smsUrl = `sms:?&body=${text}`;
    window.open(smsUrl, "_blank");
  };

  const getSquareColor = (status: string) => {
    if (status === "correct") return "bg-emerald-500";
    return "bg-red-500";
  };

  const getSquareSymbol = (status: string) => {
    if (status === "correct") return "+";
    return "-";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 dark:from-background dark:via-background dark:to-card/50">
      <header className="flex items-center justify-between gap-2 flex-wrap p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/results")}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Share2 className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-bold">Share Results</h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="container max-w-md mx-auto p-4 space-y-6">
        <div 
          className={`rounded-xl border-2 p-6 ${theme.bg}`}
          data-testid="share-card-preview"
        >
          <div className="text-center mb-4">
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${theme.gradient} text-white mb-2`}>
              Daily Drop #{dailyDrop?.dropNumber || 0}
            </div>
            <h2 className="text-xl font-bold" data-testid="text-title">Lifestyle Creep</h2>
            {leagueName && (
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Users className="w-3 h-3" />
                {leagueName}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className={`rounded-lg p-3 text-center bg-gradient-to-br ${theme.gradient}/10`}>
              <Brain className="w-5 h-5 mx-auto mb-1 text-primary" />
              <div className="text-2xl font-bold" data-testid="text-iq">
                {hideNumbers ? "***" : result.iq}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">IQ Score</div>
            </div>
            <div className={`rounded-lg p-3 text-center bg-gradient-to-br ${theme.gradient}/10`}>
              <Heart className="w-5 h-5 mx-auto mb-1 text-accent" />
              <div className="text-2xl font-bold" data-testid="text-health">
                {hideNumbers ? "***" : result.moneyHealth}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Health</div>
            </div>
            <div className={`rounded-lg p-3 text-center bg-gradient-to-br ${theme.gradient}/10`}>
              <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
              <div className="text-2xl font-bold" data-testid="text-streak">
                {hideNumbers ? "***" : user.streak}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Streak</div>
            </div>
          </div>

          <div className="flex justify-center gap-2 mb-5" data-testid="answers-grid">
            {answers.map((status, i) => (
              <div
                key={i}
                className={`w-11 h-11 rounded-lg flex items-center justify-center text-lg font-bold text-white ${getSquareColor(status)}`}
                data-testid={`square-${i}`}
              >
                {getSquareSymbol(status)}
              </div>
            ))}
          </div>

          <div className="space-y-1.5" data-testid="mini-stats">
            {[
              { label: "Cash", value: result.stats.cash, max: 10000, color: "bg-emerald-500" },
              { label: "Debt", value: result.stats.debt, max: 5000, color: "bg-red-500" },
              { label: "Credit", value: result.stats.credit, max: 850, color: "bg-blue-500" },
              { label: "Stress", value: result.stats.stress, max: 100, color: "bg-yellow-500" },
              { label: "Invest", value: result.stats.investment, max: 50000, color: "bg-purple-500" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="w-12 text-[10px] text-muted-foreground">{stat.label}</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${stat.color}`}
                    style={{ width: `${Math.min((stat.value / stat.max) * 100, 100)}%` }}
                  />
                </div>
                {!hideNumbers && (
                  <span className="w-10 text-[10px] text-right text-muted-foreground">
                    {stat.label === "Stress" ? `${Math.round(stat.value)}%` : 
                     stat.label === "Credit" ? Math.round(stat.value) : 
                     `$${Math.round(stat.value)}`}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Customize
          </h3>

          <div className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">Theme Color</Label>
              <div className="flex flex-wrap gap-2">
                {THEME_COLORS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTheme(t.id)}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.gradient} border-2 transition-all ${
                      selectedTheme === t.id ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    title={t.label}
                    data-testid={`theme-${t.id}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {hideNumbers ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                <Label htmlFor="hide-numbers" className="text-sm">Hide exact numbers</Label>
              </div>
              <Switch
                id="hide-numbers"
                checked={hideNumbers}
                onCheckedChange={setHideNumbers}
                data-testid="toggle-hide-numbers"
              />
            </div>

            <div>
              <Label htmlFor="league-name" className="text-sm text-muted-foreground mb-2 block flex items-center gap-1">
                <Users className="w-3 h-3" />
                Add league name
              </Label>
              {leagues && leagues.length > 0 ? (
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  data-testid="select-league"
                >
                  <option value="">None</option>
                  {leagues.map((league) => (
                    <option key={league.id} value={league.name}>{league.name}</option>
                  ))}
                </select>
              ) : (
                <Input
                  id="league-name"
                  placeholder="Enter league name (optional)"
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  data-testid="input-league-name"
                />
              )}
            </div>
          </div>
        </Card>

        <div className="space-y-3">
          <Button
            onClick={handleCopy}
            variant="outline"
            className="w-full"
            data-testid="button-copy"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </>
            )}
          </Button>

          <Button
            onClick={handleShareInstagram}
            className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90"
            data-testid="button-instagram"
          >
            <SiInstagram className="w-4 h-4 mr-2" />
            Share to Instagram Story
          </Button>

          <Button
            onClick={handleShareiMessage}
            variant="outline"
            className="w-full"
            data-testid="button-imessage"
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Share to iMessage
          </Button>
        </div>
      </main>
    </div>
  );
}
