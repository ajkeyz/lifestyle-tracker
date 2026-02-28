import { QueryClient, QueryFunction, QueryCache, MutationCache } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Global error handler for authentication failures.
// IMPORTANT: Only redirect on true session expiry, not on individual endpoint 401s.
// Individual endpoints may return 401 for authorization reasons even when the
// session is valid (e.g., missing permissions). Calling queryClient.clear() here
// would trigger all queries to refetch, causing an infinite 401 → clear → refetch loop.
const handleGlobalError = (_error: unknown) => {
  // Intentionally a no-op. Authentication state is managed by the useAuth hook
  // which uses its own queryFn that returns null on 401 instead of throwing.
  // Individual query 401 errors are expected and handled by React Query's
  // built-in retry/error state. No global redirect is needed.
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleGlobalError,
  }),
  mutationCache: new MutationCache({
    onError: handleGlobalError,
  }),
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      // P1-5: Allow data to go stale after 5 minutes so midnight daily drop refreshes
      staleTime: 5 * 60 * 1000,
      retry: (failureCount, error) => {
        // Don't retry 401 Unauthorized — retrying won't help and causes loops
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("401") || message.toLowerCase().includes("unauthorized")) {
          return false;
        }
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    },
    mutations: {
      retry: false,
    },
  },
});
