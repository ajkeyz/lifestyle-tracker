import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { THEME_BY_ID, type ThemeId, isValidThemeId, type ThemeDef } from "@shared/lib/themes";

interface ThemeState {
  current: ThemeId | null;
  weekStart: string | null;
  canChange: boolean;
  nextChangeAt: string;
}

/**
 * Hook for reading and changing the user's weekly theme.
 * Surfaces the resolved ThemeDef for convenient UI rendering.
 */
export function useTheme() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<ThemeState>({
    queryKey: ["/api/theme"],
    queryFn: async () => {
      const res = await fetch("/api/theme");
      if (!res.ok) throw new Error("Failed to fetch theme");
      return res.json();
    },
  });

  const currentDef: ThemeDef | null =
    data?.current && isValidThemeId(data.current) ? THEME_BY_ID[data.current] : null;

  const setThemeMutation = useMutation({
    mutationFn: async (theme: ThemeId) => {
      const res = await apiRequest("POST", "/api/theme", { theme });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate everything that depends on the active theme
      qc.invalidateQueries({ queryKey: ["/api/theme"] });
      qc.invalidateQueries({ queryKey: ["/api/user"] });
      qc.invalidateQueries({ queryKey: ["/api/daily-drop"] });
      qc.invalidateQueries({ queryKey: ["/api/arcade-status"] });
    },
  });

  return {
    current: data?.current ?? null,
    currentDef,
    weekStart: data?.weekStart ?? null,
    canChange: data?.canChange ?? false,
    nextChangeAt: data?.nextChangeAt ?? null,
    isLoading,
    setTheme: setThemeMutation.mutateAsync,
    isPending: setThemeMutation.isPending,
  };
}
