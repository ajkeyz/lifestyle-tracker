import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Save, Send, Eye, DollarSign, CreditCard, TrendingDown, Heart, Briefcase, AlertTriangle, Trash2, Check } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { COMMUNITY_CATEGORIES, type AdminScenario, type AdminScenarioChoice } from "@shared/schema";

const scenarioFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  question: z.string().min(10, "Question must be at least 10 characters").max(500),
  context: z.object({
    cash: z.number().min(-100).max(100),
    debt: z.number().min(-100).max(100),
    credit: z.number().min(-100).max(100),
    stress: z.number().min(-100).max(100),
    portfolio: z.number().min(-100).max(100),
  }),
  choices: z.array(z.object({
    label: z.enum(["A", "B", "C", "D"]),
    text: z.string().min(1, "Answer text required").max(200),
    isCorrect: z.boolean(),
    points: z.number().min(-100).max(100),
    feedback: z.string().min(1, "Feedback required").max(300),
  })).length(4),
  category: z.enum(["tech", "travel", "lifestyle", "scam", "investing", "debt", "career", "relationships"]),
  difficulty: z.number().min(1).max(5),
  publishDate: z.string().nullable(),
});

type ScenarioFormData = z.infer<typeof scenarioFormSchema>;

interface AdminCheck {
  isAdmin: boolean;
  isModerator: boolean;
  hasAccess: boolean;
}

const defaultChoices: AdminScenarioChoice[] = [
  { label: "A", text: "", isCorrect: false, points: 0, feedback: "" },
  { label: "B", text: "", isCorrect: true, points: 100, feedback: "" },
  { label: "C", text: "", isCorrect: false, points: 0, feedback: "" },
  { label: "D", text: "", isCorrect: false, points: 0, feedback: "" },
];

export default function AdminScenarioBuilder() {
  const [, navigate] = useLocation();
  const [, params] = useRoute("/admin/scenario-builder/:id");
  const scenarioId = params?.id;
  const isEditing = !!scenarioId;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const { data: adminCheck, isLoading: checkingAccess } = useQuery<AdminCheck>({
    queryKey: ["/api/admin/check"],
  });

  const { data: existingScenario, isLoading: loadingScenario } = useQuery<AdminScenario>({
    queryKey: ["/api/admin/scenarios", scenarioId],
    enabled: isEditing && adminCheck?.hasAccess,
  });

  const form = useForm<ScenarioFormData>({
    resolver: zodResolver(scenarioFormSchema),
    defaultValues: {
      title: "",
      question: "",
      context: { cash: 0, debt: 0, credit: 0, stress: 0, portfolio: 0 },
      choices: defaultChoices,
      category: "tech",
      difficulty: 3,
      publishDate: null,
    },
  });

  useEffect(() => {
    if (existingScenario) {
      form.reset({
        title: existingScenario.title,
        question: existingScenario.question,
        context: existingScenario.context,
        choices: existingScenario.choices,
        category: existingScenario.category,
        difficulty: existingScenario.difficulty,
        publishDate: existingScenario.publishDate,
      });
    }
  }, [existingScenario, form]);

  const saveDraftMutation = useMutation({
    mutationFn: async (data: ScenarioFormData) => {
      const payload = { ...data, status: "draft" as const };
      if (isEditing) {
        const res = await apiRequest("PATCH", `/api/admin/scenarios/${scenarioId}`, payload);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/admin/scenarios", payload);
        return res.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scenarios"] });
      toast({ title: "Draft saved successfully" });
      if (!isEditing) {
        navigate(`/admin/scenario-builder/${data.id}`);
      }
    },
    onError: () => {
      toast({ title: "Failed to save draft", variant: "destructive" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (data: ScenarioFormData) => {
      if (isEditing) {
        await apiRequest("PATCH", `/api/admin/scenarios/${scenarioId}`, { ...data, status: "draft" });
        const res = await apiRequest("POST", `/api/admin/scenarios/${scenarioId}/publish`);
        return res.json();
      } else {
        const createRes = await apiRequest("POST", "/api/admin/scenarios", { ...data, status: "draft" });
        const created = await createRes.json();
        const res = await apiRequest("POST", `/api/admin/scenarios/${created.id}/publish`);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scenarios"] });
      toast({ title: "Scenario published successfully" });
      navigate("/admin");
    },
    onError: () => {
      toast({ title: "Failed to publish scenario", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/admin/scenarios/${scenarioId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scenarios"] });
      toast({ title: "Scenario deleted" });
      navigate("/admin");
    },
    onError: () => {
      toast({ title: "Failed to delete scenario", variant: "destructive" });
    },
  });

  const onSubmit = (data: ScenarioFormData, publish: boolean = false) => {
    if (publish) {
      publishMutation.mutate(data);
    } else {
      saveDraftMutation.mutate(data);
    }
  };

  if (checkingAccess || (isEditing && loadingScenario)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!adminCheck?.hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">You don't have permission to create scenarios.</p>
            <Button onClick={() => navigate("/")} data-testid="button-go-home">Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formValues = form.watch();
  const getCategoryIcon = (cat: string) => {
    const category = COMMUNITY_CATEGORIES.find(c => c.id === cat);
    return category?.label || cat;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="flex items-center gap-3 p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} data-testid="button-back">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold" data-testid="text-page-title">
            {isEditing ? "Edit Scenario" : "Create Scenario"}
          </h1>
          {existingScenario && (
            <Badge variant={existingScenario.status === "published" ? "default" : "secondary"}>
              {existingScenario.status}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {isEditing && (
            <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate()} data-testid="button-delete">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => form.handleSubmit((data) => onSubmit(data, false))()}
            disabled={saveDraftMutation.isPending}
            data-testid="button-save-draft"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={() => form.handleSubmit((data) => onSubmit(data, true))()}
            disabled={publishMutation.isPending}
            data-testid="button-publish"
          >
            <Send className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </header>

      <main className="p-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
          <TabsList className="mb-4">
            <TabsTrigger value="edit" data-testid="tab-edit">Edit</TabsTrigger>
            <TabsTrigger value="preview" data-testid="tab-preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <Form {...form}>
              <form className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Basic Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scenario Title</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., The RSU Dilemma" {...field} data-testid="input-title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-category">
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COMMUNITY_CATEGORIES.map(cat => (
                                  <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty: {field.value}</FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                value={[field.value]}
                                onValueChange={(v) => field.onChange(v[0])}
                                data-testid="slider-difficulty"
                              />
                            </FormControl>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Easy</span>
                              <span>Medium</span>
                              <span>Hard</span>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="publishDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Publish Date (optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value || null)}
                              data-testid="input-publish-date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Context Inputs</CardTitle>
                    <CardDescription>Financial impact values (-100 to +100)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <FormField
                        control={form.control}
                        name="context.cash"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" /> Cash
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={-100}
                                max={100}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-context-cash"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="context.debt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <TrendingDown className="h-3 w-3" /> Debt
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={-100}
                                max={100}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-context-debt"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="context.credit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <CreditCard className="h-3 w-3" /> Credit
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={-100}
                                max={100}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-context-credit"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="context.stress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <Heart className="h-3 w-3" /> Stress
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={-100}
                                max={100}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-context-stress"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="context.portfolio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" /> Portfolio
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={-100}
                                max={100}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                data-testid="input-context-portfolio"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Question</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="question"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              placeholder="What financial decision does the player need to make?"
                              className="min-h-[100px]"
                              {...field}
                              data-testid="input-question"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Answer Choices</CardTitle>
                    <CardDescription>Configure A/B/C/D answers with points and feedback</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {["A", "B", "C", "D"].map((label, index) => (
                      <Card key={label} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <Badge variant={form.watch(`choices.${index}.isCorrect`) ? "default" : "outline"}>
                              {label}
                            </Badge>
                            <div className="flex items-center gap-4 flex-wrap">
                              <div className="flex items-center gap-2">
                                <Label className="text-sm">Points:</Label>
                                <Input
                                  type="number"
                                  className="w-20"
                                  min={-100}
                                  max={100}
                                  {...form.register(`choices.${index}.points` as const, { valueAsNumber: true })}
                                  data-testid={`input-choice-${label}-points`}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={form.watch(`choices.${index}.isCorrect`)}
                                  onCheckedChange={(checked) => form.setValue(`choices.${index}.isCorrect`, checked)}
                                  data-testid={`switch-choice-${label}-correct`}
                                />
                                <Label className="text-sm flex items-center gap-1">
                                  <Check className="h-3 w-3" /> Correct
                                </Label>
                              </div>
                            </div>
                          </div>
                          <FormField
                            control={form.control}
                            name={`choices.${index}.text` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    placeholder={`Answer ${label} text...`}
                                    {...field}
                                    data-testid={`input-choice-${label}-text`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`choices.${index}.feedback` as const}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    placeholder={`Feedback for choosing ${label}...`}
                                    className="min-h-[60px]"
                                    {...field}
                                    data-testid={`input-choice-${label}-feedback`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="preview">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Badge variant="secondary">{getCategoryIcon(formValues.category)}</Badge>
                  <Badge variant="outline">Difficulty {formValues.difficulty}/5</Badge>
                </div>
                <CardTitle className="text-xl mt-4">{formValues.title || "Scenario Title"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-5 gap-2 text-center text-sm">
                  <div className="bg-muted rounded-md p-2">
                    <DollarSign className="h-4 w-4 mx-auto mb-1" />
                    <span className={formValues.context.cash >= 0 ? "text-green-500" : "text-red-500"}>
                      {formValues.context.cash >= 0 ? "+" : ""}{formValues.context.cash}
                    </span>
                    <p className="text-xs text-muted-foreground">Cash</p>
                  </div>
                  <div className="bg-muted rounded-md p-2">
                    <TrendingDown className="h-4 w-4 mx-auto mb-1" />
                    <span className={formValues.context.debt <= 0 ? "text-green-500" : "text-red-500"}>
                      {formValues.context.debt >= 0 ? "+" : ""}{formValues.context.debt}
                    </span>
                    <p className="text-xs text-muted-foreground">Debt</p>
                  </div>
                  <div className="bg-muted rounded-md p-2">
                    <CreditCard className="h-4 w-4 mx-auto mb-1" />
                    <span className={formValues.context.credit >= 0 ? "text-green-500" : "text-red-500"}>
                      {formValues.context.credit >= 0 ? "+" : ""}{formValues.context.credit}
                    </span>
                    <p className="text-xs text-muted-foreground">Credit</p>
                  </div>
                  <div className="bg-muted rounded-md p-2">
                    <Heart className="h-4 w-4 mx-auto mb-1" />
                    <span className={formValues.context.stress <= 0 ? "text-green-500" : "text-red-500"}>
                      {formValues.context.stress >= 0 ? "+" : ""}{formValues.context.stress}
                    </span>
                    <p className="text-xs text-muted-foreground">Stress</p>
                  </div>
                  <div className="bg-muted rounded-md p-2">
                    <Briefcase className="h-4 w-4 mx-auto mb-1" />
                    <span className={formValues.context.portfolio >= 0 ? "text-green-500" : "text-red-500"}>
                      {formValues.context.portfolio >= 0 ? "+" : ""}{formValues.context.portfolio}
                    </span>
                    <p className="text-xs text-muted-foreground">Portfolio</p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="font-medium">{formValues.question || "Your scenario question will appear here..."}</p>
                </div>

                <div className="space-y-3">
                  {formValues.choices.map((choice, index) => (
                    <Card
                      key={index}
                      className={`p-4 cursor-pointer hover-elevate ${choice.isCorrect ? "border-primary" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <Badge variant={choice.isCorrect ? "default" : "outline"}>
                          {choice.label}
                        </Badge>
                        <div className="flex-1">
                          <p>{choice.text || `Answer ${choice.label}...`}</p>
                          {choice.feedback && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              {choice.feedback}
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {choice.points >= 0 ? "+" : ""}{choice.points} pts
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
