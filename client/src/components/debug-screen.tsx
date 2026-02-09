import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Settings,
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
} from "lucide-react";
import {
  getAllFeatureFlags,
  toggleFeature,
  resetAllFlags,
  getFlagStats,
  type FeatureFlag,
} from "@/lib/feature-flags";

interface DebugScreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DebugScreen({ open, onOpenChange }: DebugScreenProps) {
  const [flags, setFlags] = useState(getAllFeatureFlags());
  const [needsReload, setNeedsReload] = useState(false);

  const handleToggle = (flag: FeatureFlag) => {
    const newState = toggleFeature(flag);
    setFlags(getAllFeatureFlags());

    // Check if this flag requires reload
    const flagConfig = flags.find((f) => f.key === flag);
    if (flagConfig?.requiresReload) {
      setNeedsReload(true);
    }
  };

  const handleReset = () => {
    if (confirm("Reset all feature flags to default values?")) {
      resetAllFlags();
      setFlags(getAllFeatureFlags());
      setNeedsReload(true);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  const stats = getFlagStats();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Feature Flags
          </DialogTitle>
          <DialogDescription>
            Toggle experimental features and debug settings. Changes are saved to localStorage.
          </DialogDescription>
        </DialogHeader>

        {/* Stats Overview */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="font-medium">{stats.enabled} Enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{stats.disabled} Disabled</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">{stats.total} Total</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reload Warning */}
        {needsReload && (
          <Card className="bg-orange-500/10 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                    Page reload required
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400/80 mt-1">
                    Some flags require a page reload to take effect
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReload}
                  className="flex-shrink-0"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Reload Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Feature Flags List */}
        <div className="space-y-3">
          {flags.map((flag) => (
            <Card key={flag.key} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-sm font-medium">{flag.name}</CardTitle>
                      {flag.enabled && (
                        <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400">
                          Active
                        </Badge>
                      )}
                      {flag.requiresReload && (
                        <Badge variant="secondary" className="text-xs bg-orange-500/10 text-orange-700 dark:text-orange-400">
                          Reload
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">{flag.description}</CardDescription>
                    {flag.defaultEnabled && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Default: enabled
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={() => handleToggle(flag.key)}
                    aria-label={`Toggle ${flag.name}`}
                  />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RefreshCw className="w-3 h-3 mr-1" />
            Reset All
          </Button>
          <div className="flex gap-2">
            {needsReload && (
              <Button size="sm" onClick={handleReload}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Reload Page
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>

        {/* Dev Info */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          <code className="bg-muted px-2 py-1 rounded">localStorage: lifestyle_tracker_flags</code>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to enable debug screen with hidden gesture
 * Usage: Add to a component (e.g., logo) to trigger debug screen with 5 rapid taps
 */
export function useDebugGesture(onTrigger: () => void) {
  const [tapCount, setTapCount] = useState(0);
  const [tapTimeout, setTapTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleTap = () => {
    // Clear existing timeout
    if (tapTimeout) {
      clearTimeout(tapTimeout);
    }

    const newCount = tapCount + 1;
    setTapCount(newCount);

    // Trigger debug screen after 5 taps
    if (newCount >= 5) {
      onTrigger();
      setTapCount(0);
      setTapTimeout(null);
      return;
    }

    // Reset counter after 2 seconds of inactivity
    const timeout = setTimeout(() => {
      setTapCount(0);
    }, 2000);

    setTapTimeout(timeout);
  };

  return { handleTap, tapCount };
}
