import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  ArrowLeft,
  Send,
  Smartphone,
  Plane,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Briefcase,
  Users,
  HelpCircle,
  Lightbulb,
} from "lucide-react";

const CATEGORIES = [
  { id: "tech", label: "Tech & Gadgets", icon: Smartphone, description: "Phones, laptops, subscriptions" },
  { id: "travel", label: "Travel", icon: Plane, description: "Flights, hotels, vacation costs" },
  { id: "lifestyle", label: "Lifestyle", icon: Sparkles, description: "Upgrades, splurges, FOMO" },
  { id: "scam", label: "Scams & Fraud", icon: AlertTriangle, description: "Suspicious offers, phishing" },
  { id: "investing", label: "Investing", icon: TrendingUp, description: "Stocks, crypto, 401k" },
  { id: "debt", label: "Debt & Loans", icon: CreditCard, description: "Credit cards, student loans" },
  { id: "career", label: "Career & Salary", icon: Briefcase, description: "Job offers, negotiations" },
  { id: "relationships", label: "Friends & Family", icon: Users, description: "Splitting costs, lending money" },
] as const;

const submitScenarioSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(100, "Title must be less than 100 characters"),
  context: z.string().min(20, "Context must be at least 20 characters").max(500, "Context must be less than 500 characters"),
  question: z.string().min(10, "Question must be at least 10 characters").max(200, "Question must be less than 200 characters"),
  type: z.enum(["real", "hypothetical"]),
  category: z.enum(["tech", "travel", "lifestyle", "scam", "investing", "debt", "career", "relationships"]),
});

type SubmitScenarioForm = z.infer<typeof submitScenarioSchema>;

export default function CommunitySubmit() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const form = useForm<SubmitScenarioForm>({
    resolver: zodResolver(submitScenarioSchema),
    defaultValues: {
      title: "",
      context: "",
      question: "",
      type: "real",
      category: undefined,
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: SubmitScenarioForm) => {
      const res = await apiRequest("POST", "/api/community/scenarios", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/scenarios"] });
      toast({
        title: "Scenario submitted!",
        description: "Your scenario is now live for the community to see.",
      });
      navigate(`/community/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Failed to submit",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SubmitScenarioForm) => {
    submitMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center gap-3 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/community")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-bold text-lg" data-testid="text-page-title">Submit Scenario</h1>
          <p className="text-xs text-muted-foreground">Share your money dilemma</p>
        </div>
      </header>

      <main className="container max-w-2xl mx-auto p-4 space-y-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Tips for a great scenario:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>Be specific about amounts and context</li>
                  <li>Share the dilemma clearly - what's the tough choice?</li>
                  <li>Real scenarios get more engagement</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Scenario Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="real" id="real" data-testid="radio-real" />
                        <Label htmlFor="real" className="cursor-pointer">
                          Real - This actually happened to me
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hypothetical" id="hypothetical" data-testid="radio-hypothetical" />
                        <Label htmlFor="hypothetical" className="cursor-pointer flex items-center gap-1">
                          <HelpCircle className="w-4 h-4" />
                          Hypothetical
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = field.value === cat.id;
                        return (
                          <Card
                            key={cat.id}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "border-primary bg-primary/5" : ""
                            }`}
                            onClick={() => field.onChange(cat.id)}
                            data-testid={`card-category-${cat.id}`}
                          >
                            <CardContent className="p-3 flex items-center gap-3">
                              <Icon className={`w-5 h-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                              <div>
                                <p className="font-medium text-sm">{cat.label}</p>
                                <p className="text-xs text-muted-foreground">{cat.description}</p>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormDescription>A catchy summary of your scenario</FormDescription>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Friend asked me to split Airbnb but wants the master bedroom" 
                      {...field} 
                      data-testid="input-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="context"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Context</FormLabel>
                  <FormDescription>Explain the situation in detail</FormDescription>
                  <FormControl>
                    <Textarea 
                      placeholder="Going on a trip with 4 friends. One friend found a $2000/night Airbnb and wants to split evenly but also wants the master bedroom with private bathroom..." 
                      className="min-h-32"
                      {...field} 
                      data-testid="input-context"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Question</FormLabel>
                  <FormDescription>What do you want the community to weigh in on?</FormDescription>
                  <FormControl>
                    <Textarea 
                      placeholder="Should I push back on the uneven split or just go with it to keep the peace?" 
                      className="min-h-20"
                      {...field} 
                      data-testid="input-question"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitMutation.isPending}
              data-testid="button-submit"
            >
              <Send className="w-4 h-4 mr-2" />
              {submitMutation.isPending ? "Submitting..." : "Submit Scenario"}
            </Button>
          </form>
        </Form>
      </main>
    </div>
  );
}
