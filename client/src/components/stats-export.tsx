/**
 * Stats Export Component
 *
 * Export user statistics in multiple formats
 * Features: JSON, CSV, PDF, Image exports with beautiful formatting
 */

import { useState } from "react";
import { motion, AnimatePresence } from "antml:motion";
import {
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  Loader2,
  Share2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export interface ExportData {
  user: {
    username: string;
    email: string;
    membershipTier: string;
  };
  stats: {
    gamesPlayed: number;
    averageScore: number;
    bestScore: number;
    streak: number;
    highestStreak: number;
    accuracyRate: number;
  };
  gameHistory: Array<{
    date: string;
    score: number;
    category: string;
    scenarios: number;
  }>;
  achievements: Array<{
    name: string;
    unlockedAt: string;
    tier: string;
  }>;
  categoryPerformance: Record<string, number>;
}

type ExportFormat = "json" | "csv" | "pdf" | "image";

interface StatsExportProps {
  data: ExportData;
  onExport?: (format: ExportFormat) => void;
}

export function StatsExport({ data, onExport }: StatsExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportedFormat, setExportedFormat] = useState<ExportFormat | null>(null);
  const { toast } = useToast();

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setExportedFormat(format);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate export

      switch (format) {
        case "json":
          exportAsJSON(data);
          break;
        case "csv":
          exportAsCSV(data);
          break;
        case "pdf":
          exportAsPDF(data);
          break;
        case "image":
          exportAsImage(data);
          break;
      }

      onExport?.(format);

      toast({
        title: "Export Successful!",
        description: `Your stats have been exported as ${format.toUpperCase()}`,
      });

      setTimeout(() => setExportedFormat(null), 2000);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportFormats: Array<{
    type: ExportFormat;
    label: string;
    icon: typeof FileJson;
    description: string;
    color: string;
  }> = [
    {
      type: "json",
      label: "JSON",
      icon: FileJson,
      description: "Complete data export for developers",
      color: "from-blue-500 to-cyan-500",
    },
    {
      type: "csv",
      label: "CSV",
      icon: FileSpreadsheet,
      description: "Spreadsheet format for Excel/Sheets",
      color: "from-green-500 to-emerald-500",
    },
    {
      type: "pdf",
      label: "PDF",
      icon: FileText,
      description: "Formatted report document",
      color: "from-red-500 to-orange-500",
    },
    {
      type: "image",
      label: "Image",
      icon: ImageIcon,
      description: "Shareable stats card",
      color: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Stats
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Export Your Statistics
          </DialogTitle>
          <DialogDescription>
            Download your progress data in various formats
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          {exportFormats.map((format) => {
            const Icon = format.icon;
            const isExported = exportedFormat === format.type;

            return (
              <motion.div
                key={format.type}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    isExported ? "ring-2 ring-green-500" : ""
                  }`}
                  onClick={() => !isExporting && handleExport(format.type)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${format.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{format.label}</h3>
                          {isExported && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", bounce: 0.5 }}
                            >
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </motion.div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format.description}
                        </p>

                        {/* Loading state */}
                        {isExporting && exportedFormat === format.type && (
                          <div className="flex items-center gap-2 mt-3 text-sm text-primary">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Exporting...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Preview Data Summary */}
        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <h4 className="font-semibold text-sm mb-3">Export Preview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-muted-foreground">Games Played</div>
              <div className="font-bold">{data.stats.gamesPlayed}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Avg Score</div>
              <div className="font-bold">{data.stats.averageScore}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Current Streak</div>
              <div className="font-bold">{data.stats.streak} days</div>
            </div>
            <div>
              <div className="text-muted-foreground">Achievements</div>
              <div className="font-bold">{data.achievements.length}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Export Functions
 */

function exportAsJSON(data: ExportData) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lifestyle-tracker-stats-${new Date().toISOString().split("T")[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportAsCSV(data: ExportData) {
  // Create CSV for game history
  const headers = ["Date", "Score", "Category", "Scenarios"];
  const rows = data.gameHistory.map((game) => [
    game.date,
    game.score,
    game.category,
    game.scenarios,
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `lifestyle-tracker-history-${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportAsPDF(data: ExportData) {
  // Generate a simple HTML report and print it
  const reportHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Lifestyle Tracker Stats Report</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        h1 { color: #7c3aed; border-bottom: 3px solid #7c3aed; padding-bottom: 10px; }
        .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
        .stat-card { background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 32px; font-weight: bold; color: #7c3aed; }
        .stat-label { color: #6b7280; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; text-align: center; }
      </style>
    </head>
    <body>
      <h1>📊 Lifestyle Tracker Statistics Report</h1>
      <p><strong>User:</strong> ${data.user.username} | <strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-value">${data.stats.gamesPlayed}</div>
          <div class="stat-label">Games Played</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.stats.averageScore}</div>
          <div class="stat-label">Average Score</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.stats.streak}</div>
          <div class="stat-label">Current Streak</div>
        </div>
      </div>

      <h2>🏆 Recent Achievements</h2>
      <table>
        <thead>
          <tr><th>Achievement</th><th>Tier</th><th>Unlocked</th></tr>
        </thead>
        <tbody>
          ${data.achievements
            .map(
              (a) => `
            <tr>
              <td>${a.name}</td>
              <td>${a.tier}</td>
              <td>${new Date(a.unlockedAt).toLocaleDateString()}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <h2>📈 Category Performance</h2>
      <table>
        <thead>
          <tr><th>Category</th><th>Average Score</th></tr>
        </thead>
        <tbody>
          ${Object.entries(data.categoryPerformance)
            .map(
              ([category, score]) => `
            <tr>
              <td>${category}</td>
              <td>${score}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <div class="footer">
        Generated by Lifestyle Tracker | Keep building better habits! 🚀
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(reportHTML);
    printWindow.document.close();
    printWindow.print();
  }
}

function exportAsImage(data: ExportData) {
  // Create a shareable stats card image
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630; // Social media optimal size
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, "#7c3aed");
  gradient.addColorStop(1, "#6d28d9");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 60px system-ui";
  ctx.fillText("My Lifestyle Tracker Stats", 80, 100);

  // Stats
  ctx.font = "bold 80px system-ui";
  ctx.fillText(`${data.stats.gamesPlayed}`, 80, 250);
  ctx.font = "30px system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText("Games Played", 80, 290);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 80px system-ui";
  ctx.fillText(`${data.stats.averageScore}`, 80, 400);
  ctx.font = "30px system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText("Average Score", 80, 440);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 80px system-ui";
  ctx.fillText(`${data.stats.streak}🔥`, 80, 550);
  ctx.font = "30px system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText("Day Streak", 80, 590);

  // Download
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lifestyle-tracker-stats-${new Date().toISOString().split("T")[0]}.png`;
    link.click();
    URL.revokeObjectURL(url);
  });
}
