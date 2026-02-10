/**
 * Dark Mode Showcase
 *
 * Demonstrates all dark mode improvements and features
 * Features: color comparison, component previews, gradient showcase
 */

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sun,
  Moon,
  Palette,
  Sparkles,
  Zap,
  Heart,
  Trophy,
  Star,
  TrendingUp,
  Check,
  AlertCircle,
  Info
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTheme } from "@/components/theme-provider";

export function DarkModeShowcase() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("colors");

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6 theme-transition-slow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 gradient-text-animated">
            Dark Mode Showcase
          </h1>
          <p className="text-muted-foreground">
            Experience the enhanced dark mode color system
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="gap-2"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-5 h-5" />
              Switch to Light
            </>
          ) : (
            <>
              <Moon className="w-5 h-5" />
              Switch to Dark
            </>
          )}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="gradients">Gradients</TabsTrigger>
          <TabsTrigger value="glows">Glows</TabsTrigger>
          <TabsTrigger value="glass">Glass</TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          <ColorPalette />
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-6">
          <ComponentShowcase />
        </TabsContent>

        {/* Gradients Tab */}
        <TabsContent value="gradients" className="space-y-6">
          <GradientShowcase />
        </TabsContent>

        {/* Glows Tab */}
        <TabsContent value="glows" className="space-y-6">
          <GlowShowcase />
        </TabsContent>

        {/* Glass Tab */}
        <TabsContent value="glass" className="space-y-6">
          <GlassShowcase />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Color Palette Component
 */
function ColorPalette() {
  const colors = [
    { name: "Primary", var: "--primary", fg: "--primary-foreground" },
    { name: "Secondary", var: "--secondary", fg: "--secondary-foreground" },
    { name: "Accent", var: "--accent", fg: "--accent-foreground" },
    { name: "Muted", var: "--muted", fg: "--muted-foreground" },
    { name: "Background", var: "--background", fg: "--foreground" },
    { name: "Card", var: "--card", fg: "--card-foreground" },
    { name: "Success", var: "--success", fg: "--foreground" },
    { name: "Warning", var: "--warning", fg: "--foreground" },
    { name: "Danger", var: "--danger", fg: "--foreground" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Enhanced Color Palette</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {colors.map((color, index) => (
          <motion.div
            key={color.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="theme-transition">
              <CardContent className="p-0">
                <div
                  className="h-32 rounded-t-lg flex items-center justify-center"
                  style={{
                    backgroundColor: `hsl(var(${color.var}))`,
                    color: `hsl(var(${color.fg}))`,
                  }}
                >
                  <span className="font-bold text-lg">{color.name}</span>
                </div>
                <div className="p-4 space-y-2">
                  <div className="text-xs font-mono">
                    <span className="text-muted-foreground">var:</span>{" "}
                    <span className="font-semibold">{color.var}</span>
                  </div>
                  <div className="text-xs">
                    Improved contrast and saturation in dark mode
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * Component Showcase
 */
function ComponentShowcase() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Component Previews</h2>

      {/* Buttons */}
      <Card className="theme-transition">
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button className="button-primary-enhanced">Enhanced</Button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      <Card className="theme-transition">
        <CardHeader>
          <CardTitle>Badges</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge className="badge-enhanced">Enhanced</Badge>
            <Badge className="bg-gradient-to-r from-primary to-accent">Gradient</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bars */}
      <Card className="theme-transition">
        <CardHeader>
          <CardTitle>Progress Bars</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm mb-2">Standard Progress</div>
            <Progress value={65} className="h-2" />
          </div>
          <div>
            <div className="text-sm mb-2">Gradient Progress</div>
            <Progress value={75} gradient className="h-2" />
          </div>
          <div>
            <div className="text-sm mb-2">Shimmer Progress</div>
            <Progress value={85} gradient shimmer className="h-2" />
          </div>
          <div>
            <div className="text-sm mb-2">Glow Progress (Dark Mode)</div>
            <Progress value={90} gradient className="h-3 progress-glow" />
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Trophy, label: "Score", value: "450", color: "from-yellow-500 to-amber-500" },
          { icon: Zap, label: "Streak", value: "7", color: "from-orange-500 to-red-500" },
          { icon: Heart, label: "Health", value: "85%", color: "from-pink-500 to-rose-500" },
        ].map((stat, i) => (
          <Card key={i} className="hover-lift theme-transition">
            <CardContent className="p-6 text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg glow-dark-primary`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-3xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      <Card className="theme-transition">
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-start gap-3">
            <Check className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <div className="font-semibold text-green-500">Success</div>
              <div className="text-sm text-muted-foreground">
                Your changes have been saved successfully
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <div className="font-semibold text-yellow-500">Warning</div>
              <div className="text-sm text-muted-foreground">
                This action cannot be undone
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <div className="font-semibold text-blue-500">Info</div>
              <div className="text-sm text-muted-foreground">
                Check out the new features we just added
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Gradient Showcase
 */
function GradientShowcase() {
  const gradients = [
    { name: "Primary", class: "gradient-dark-primary" },
    { name: "Subtle", class: "gradient-dark-subtle" },
    { name: "Primary to Accent", class: "bg-gradient-to-r from-primary to-accent" },
    { name: "Green to Emerald", class: "bg-gradient-to-br from-green-500 to-emerald-500" },
    { name: "Blue to Cyan", class: "bg-gradient-to-br from-blue-500 to-cyan-500" },
    { name: "Purple to Pink", class: "bg-gradient-to-br from-purple-500 to-pink-500" },
    { name: "Orange to Red", class: "bg-gradient-to-br from-orange-500 to-red-500" },
    { name: "Yellow to Amber", class: "bg-gradient-to-br from-yellow-500 to-amber-500" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dark Mode Gradients</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {gradients.map((gradient, index) => (
          <motion.div
            key={gradient.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="overflow-hidden theme-transition">
              <div className={`h-32 ${gradient.class}`} />
              <CardContent className="p-4">
                <div className="font-semibold text-sm">{gradient.name}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {gradient.class}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * Glow Showcase
 */
function GlowShowcase() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Glow Effects (Dark Mode Only)</h2>

      <Card className="theme-transition">
        <CardHeader>
          <CardTitle>Box Shadows with Colored Glow</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 rounded-xl bg-card border border-primary glow-dark-primary text-center">
            <Star className="w-12 h-12 mx-auto mb-3 text-primary" />
            <div className="font-semibold">Primary Glow</div>
            <div className="text-xs text-muted-foreground mt-1">glow-dark-primary</div>
          </div>
          <div className="p-8 rounded-xl bg-card border border-accent glow-dark-accent text-center">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-accent" />
            <div className="font-semibold">Accent Glow</div>
            <div className="text-xs text-muted-foreground mt-1">glow-dark-accent</div>
          </div>
        </CardContent>
      </Card>

      <Card className="theme-transition">
        <CardHeader>
          <CardTitle>Text Glow Effects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-4xl font-bold text-primary text-glow-primary text-center">
            Primary Glow Text
          </div>
          <div className="text-4xl font-bold text-accent text-glow-accent text-center">
            Accent Glow Text
          </div>
        </CardContent>
      </Card>

      <Card className="theme-transition">
        <CardHeader>
          <CardTitle>Hover Glow (Hover to see effect)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="hover-lift cursor-pointer">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <div className="font-semibold">Hover Me</div>
                  <div className="text-xs text-muted-foreground">
                    Enhanced shadow
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Glass Showcase
 */
function GlassShowcase() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Glass Morphism Effects</h2>

      <div
        className="relative p-8 rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary) / 0.3) 0%, hsl(var(--accent) / 0.2) 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.4\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')",
          }}
        />

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Standard Glass</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Enhanced backdrop blur with better contrast in dark mode
              </p>
            </CardContent>
          </Card>

          <Card className="glass-premium">
            <CardHeader>
              <CardTitle>Premium Glass</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gradient tint with colored border and enhanced glow
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="card-dark-enhanced">
        <CardHeader>
          <CardTitle>Enhanced Dark Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Subtle gradient background with improved border contrast
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
