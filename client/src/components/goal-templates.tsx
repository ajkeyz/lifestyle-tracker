/**
 * Goal Templates Library
 *
 * Pre-built goal templates for different lifestyle areas
 * Features: categories, difficulty levels, customization, favorites
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Heart,
  DollarSign,
  Users,
  Briefcase,
  Book,
  Dumbbell,
  Coffee,
  Star,
  TrendingUp,
  Zap,
  Clock,
  CheckCircle,
  Plus,
  Search,
  Filter
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface GoalTemplate {
  id: string;
  title: string;
  description: string;
  category: "health" | "finance" | "relationships" | "career" | "personal" | "social";
  difficulty: "beginner" | "intermediate" | "advanced";
  timeframe: string;
  milestones: string[];
  tips: string[];
  tags: string[];
  icon: typeof Heart;
  color: string;
  estimatedDuration: string;
  popularity: number;
}

const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: "streak-7",
    title: "Build a 7-Day Streak",
    description: "Establish consistency with a week-long daily practice habit",
    category: "personal",
    difficulty: "beginner",
    timeframe: "1 week",
    milestones: [
      "Complete Day 1",
      "Reach Day 3 milestone",
      "Hit Day 5 (almost there!)",
      "Achieve full 7-day streak"
    ],
    tips: [
      "Set a daily reminder at the same time",
      "Start with easier scenarios",
      "Track your progress visually",
      "Celebrate small wins"
    ],
    tags: ["consistency", "habits", "beginner-friendly"],
    icon: Star,
    color: "from-yellow-500 to-amber-500",
    estimatedDuration: "7 days",
    popularity: 95,
  },
  {
    id: "financial-mastery",
    title: "Financial Decision Mastery",
    description: "Improve your financial literacy through daily money scenarios",
    category: "finance",
    difficulty: "intermediate",
    timeframe: "30 days",
    milestones: [
      "Complete 5 finance scenarios",
      "Achieve 80%+ accuracy",
      "Complete 15 scenarios",
      "Master all finance categories"
    ],
    tips: [
      "Review your answers after each scenario",
      "Read financial tips provided",
      "Track spending patterns in real life",
      "Apply learnings to actual decisions"
    ],
    tags: ["money", "budgeting", "investing", "intermediate"],
    icon: DollarSign,
    color: "from-green-500 to-emerald-500",
    estimatedDuration: "30 days",
    popularity: 88,
  },
  {
    id: "relationship-builder",
    title: "Relationship Excellence",
    description: "Navigate complex relationship scenarios with confidence",
    category: "relationships",
    difficulty: "intermediate",
    timeframe: "2 weeks",
    milestones: [
      "Complete 3 relationship scenarios",
      "Identify your communication style",
      "Practice empathy exercises",
      "Achieve 90%+ in relationship category"
    ],
    tips: [
      "Consider multiple perspectives",
      "Think about long-term impact",
      "Practice active listening",
      "Communicate boundaries clearly"
    ],
    tags: ["communication", "empathy", "boundaries"],
    icon: Heart,
    color: "from-pink-500 to-rose-500",
    estimatedDuration: "14 days",
    popularity: 82,
  },
  {
    id: "career-accelerator",
    title: "Career Growth Path",
    description: "Make strategic career decisions with clarity",
    category: "career",
    difficulty: "advanced",
    timeframe: "60 days",
    milestones: [
      "Complete workplace scenario set",
      "Identify career values",
      "Practice negotiation skills",
      "Master all career categories"
    ],
    tips: [
      "Align decisions with long-term goals",
      "Consider work-life balance",
      "Build professional relationships",
      "Invest in skill development"
    ],
    tags: ["career", "leadership", "growth", "advanced"],
    icon: Briefcase,
    color: "from-blue-500 to-indigo-500",
    estimatedDuration: "60 days",
    popularity: 76,
  },
  {
    id: "wellness-journey",
    title: "Holistic Wellness Journey",
    description: "Balance physical, mental, and emotional health",
    category: "health",
    difficulty: "beginner",
    timeframe: "21 days",
    milestones: [
      "Complete health assessment",
      "7-day wellness streak",
      "Establish 1 new healthy habit",
      "Complete wellness challenge"
    ],
    tips: [
      "Start small and build gradually",
      "Listen to your body",
      "Prioritize sleep and nutrition",
      "Practice self-compassion"
    ],
    tags: ["health", "wellness", "habits", "self-care"],
    icon: Dumbbell,
    color: "from-red-500 to-orange-500",
    estimatedDuration: "21 days",
    popularity: 91,
  },
  {
    id: "social-confidence",
    title: "Social Confidence Builder",
    description: "Navigate social situations with ease and authenticity",
    category: "social",
    difficulty: "intermediate",
    timeframe: "3 weeks",
    milestones: [
      "Complete 5 social scenarios",
      "Practice assertiveness",
      "Build connection skills",
      "Achieve social mastery"
    ],
    tips: [
      "Practice in low-stakes situations",
      "Focus on listening first",
      "Be genuinely curious about others",
      "Remember: everyone feels awkward sometimes"
    ],
    tags: ["social-skills", "confidence", "networking"],
    icon: Users,
    color: "from-purple-500 to-pink-500",
    estimatedDuration: "21 days",
    popularity: 79,
  },
];

const CATEGORY_ICONS = {
  health: Dumbbell,
  finance: DollarSign,
  relationships: Heart,
  career: Briefcase,
  personal: Star,
  social: Users,
};

const DIFFICULTY_COLORS = {
  beginner: "from-green-500 to-emerald-500",
  intermediate: "from-yellow-500 to-amber-500",
  advanced: "from-red-500 to-orange-500",
};

interface GoalTemplatesProps {
  templates?: GoalTemplate[];
  onSelectTemplate?: (template: GoalTemplate) => void;
}

export function GoalTemplates({
  templates = GOAL_TEMPLATES,
  onSelectTemplate,
}: GoalTemplatesProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || template.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Sort by popularity
  const sortedTemplates = [...filteredTemplates].sort((a, b) => b.popularity - a.popularity);

  const categories = ["all", ...new Set(templates.map(t => t.category))];
  const difficulties = ["all", "beginner", "intermediate", "advanced"];

  const toggleFavorite = (templateId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(templateId)) {
      newFavorites.delete(templateId);
    } else {
      newFavorites.add(templateId);
    }
    setFavorites(newFavorites);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Target className="w-4 h-4" />
          Browse Goal Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Goal Templates Library
          </DialogTitle>
          <DialogDescription>
            Choose from proven goal templates to jumpstart your progress
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Search & Filters */}
          <div className="space-y-3 sticky top-0 bg-background z-10 pb-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filters:</span>
              </div>

              {/* Category Filter */}
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList>
                  {categories.map((category) => (
                    <TabsTrigger key={category} value={category} className="capitalize text-xs">
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Difficulty Filter */}
              <Tabs value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <TabsList>
                  {difficulties.map((difficulty) => (
                    <TabsTrigger key={difficulty} value={difficulty} className="capitalize text-xs">
                      {difficulty}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Showing {sortedTemplates.length} of {templates.length} templates
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedTemplates.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={index}
                isFavorited={favorites.has(template.id)}
                onToggleFavorite={() => toggleFavorite(template.id)}
                onSelect={() => setSelectedTemplate(template)}
              />
            ))}
          </div>

          {/* Empty State */}
          {sortedTemplates.length === 0 && (
            <div className="text-center py-12">
              <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No templates match your filters</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedDifficulty("all");
                }}
                className="mt-2"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedTemplate && (
            <TemplateDetailModal
              template={selectedTemplate}
              onClose={() => setSelectedTemplate(null)}
              onSelect={() => {
                onSelectTemplate?.(selectedTemplate);
                setSelectedTemplate(null);
              }}
            />
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Template Card Component
 */
function TemplateCard({
  template,
  index,
  isFavorited,
  onToggleFavorite,
  onSelect,
}: {
  template: GoalTemplate;
  index: number;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onSelect: () => void;
}) {
  const Icon = template.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:shadow-lg transition-all cursor-pointer group" onClick={onSelect}>
        <CardContent className="p-5 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className="p-1 rounded-full hover:bg-muted transition-colors"
            >
              <Star
                className={`w-5 h-5 transition-colors ${
                  isFavorited ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                }`}
              />
            </button>
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
              {template.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {template.description}
            </p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="capitalize text-xs">
              {template.category}
            </Badge>
            <Badge className={`bg-gradient-to-r ${DIFFICULTY_COLORS[template.difficulty]} text-xs capitalize`}>
              {template.difficulty}
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {template.timeframe}
            </Badge>
          </div>

          {/* Popularity */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${template.color} transition-all`}
                style={{ width: `${template.popularity}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{template.popularity}%</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Template Detail Modal
 */
function TemplateDetailModal({
  template,
  onClose,
  onSelect,
}: {
  template: GoalTemplate;
  onClose: () => void;
  onSelect: () => void;
}) {
  const Icon = template.icon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <Card className="border-2 border-primary">
            <CardContent className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center shadow-xl`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">{template.title}</h2>
                  <p className="text-muted-foreground">{template.description}</p>
                </div>
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="capitalize">
                  {template.category}
                </Badge>
                <Badge className={`bg-gradient-to-r ${DIFFICULTY_COLORS[template.difficulty]} capitalize`}>
                  {template.difficulty}
                </Badge>
                <Badge variant="outline">
                  <Clock className="w-3 h-3 mr-1" />
                  {template.estimatedDuration}
                </Badge>
                <Badge variant="outline">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {template.popularity}% popularity
                </Badge>
              </div>

              {/* Milestones */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  Milestones
                </h3>
                <div className="space-y-2">
                  {template.milestones.map((milestone, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      <span className="text-sm">{milestone}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tips */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Pro Tips
                </h3>
                <ul className="space-y-2">
                  {template.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tags */}
              <div>
                <h3 className="font-semibold mb-2 text-sm">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={onSelect} className="flex-1 gap-2">
                  <Plus className="w-4 h-4" />
                  Start This Goal
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </>
  );
}
