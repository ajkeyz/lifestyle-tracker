/**
 * Authenticated HTTP client for the production-readiness harness.
 *
 * Wraps the global `fetch` with:
 *  - per-request or per-client `X-Test-User-Id` header injection
 *  - simple cookie-jar (stores Set-Cookie values, sends them back)
 *  - response timing (ms)
 *  - cumulative request/error metrics
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HttpResponse<T = any> {
  status: number;
  data: T;
  headers: Record<string, string>;
  duration: number;
}

export interface RequestOptions {
  /** Override the per-client user ID for this single request. */
  userId?: string;
  /** Extra headers merged on top of defaults. */
  headers?: Record<string, string>;
}

export interface HttpClientMetrics {
  totalRequests: number;
  failedRequests: number;
  avgDuration: number;
  statusCodes: Record<number, number>;
}

// ---------------------------------------------------------------------------
// Cookie jar (simple, single-domain)
// ---------------------------------------------------------------------------

class CookieJar {
  private cookies: Map<string, string> = new Map();

  /** Parse and store cookies from a `Set-Cookie` header value. */
  applySetCookie(header: string): void {
    // Set-Cookie may arrive as comma-separated values in some runtimes.
    // Each cookie is "name=value; <attrs>". We only care about name=value.
    for (const part of header.split(/,(?=\s*\w+=)/)) {
      const nameValue = part.trim().split(";")[0];
      const eqIdx = nameValue.indexOf("=");
      if (eqIdx > 0) {
        const name = nameValue.slice(0, eqIdx).trim();
        const value = nameValue.slice(eqIdx + 1).trim();
        this.cookies.set(name, value);
      }
    }
  }

  /** Build a `Cookie` header string from the current jar contents. */
  toCookieHeader(): string | undefined {
    if (this.cookies.size === 0) return undefined;
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  clear(): void {
    this.cookies.clear();
  }
}

// ---------------------------------------------------------------------------
// HttpClient
// ---------------------------------------------------------------------------

export class HttpClient {
  readonly serverUrl: string;
  private userId: string | undefined;
  private jar = new CookieJar();

  // Metrics accumulators
  private _totalRequests = 0;
  private _failedRequests = 0;
  private _totalDuration = 0;
  private _statusCodes: Record<number, number> = {};

  constructor(serverUrl: string, userId?: string) {
    // Strip trailing slash so callers can use paths like "/api/foo"
    this.serverUrl = serverUrl.replace(/\/+$/, "");
    this.userId = userId;
  }

  /** Change the default test user for subsequent requests. */
  setUserId(id: string): void {
    this.userId = id;
  }

  /** Return the current default user id (or undefined). */
  getUserId(): string | undefined {
    return this.userId;
  }

  /** Clear the cookie jar. */
  clearCookies(): void {
    this.jar.clear();
  }

  // -----------------------------------------------------------------------
  // Public HTTP verbs
  // -----------------------------------------------------------------------

  async get<T = any>(path: string, opts?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("GET", path, undefined, opts);
  }

  async post<T = any>(path: string, body?: unknown, opts?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("POST", path, body, opts);
  }

  async patch<T = any>(path: string, body?: unknown, opts?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("PATCH", path, body, opts);
  }

  async delete<T = any>(path: string, opts?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>("DELETE", path, undefined, opts);
  }

  // -----------------------------------------------------------------------
  // Metrics
  // -----------------------------------------------------------------------

  getMetrics(): HttpClientMetrics {
    return {
      totalRequests: this._totalRequests,
      failedRequests: this._failedRequests,
      avgDuration:
        this._totalRequests > 0
          ? Math.round(this._totalDuration / this._totalRequests)
          : 0,
      statusCodes: { ...this._statusCodes },
    };
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    body: unknown | undefined,
    opts?: RequestOptions,
  ): Promise<HttpResponse<T>> {
    const url = `${this.serverUrl}${path}`;

    // Build headers
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    // Test-user identification
    const effectiveUserId = opts?.userId ?? this.userId;
    if (effectiveUserId) {
      headers["X-Test-User-Id"] = effectiveUserId;
    }

    // Attach cookies from jar
    const cookieHeader = this.jar.toCookieHeader();
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    // Body serialisation
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    // Merge caller-supplied headers (last, so they can override anything)
    if (opts?.headers) {
      Object.assign(headers, opts.headers);
    }

    const start = performance.now();
    let response: Response;

    try {
      response = await fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        // Do not follow redirects automatically -- let test code inspect them
        redirect: "manual",
      });
    } catch (err) {
      const duration = Math.round(performance.now() - start);
      this._totalRequests++;
      this._failedRequests++;
      this._totalDuration += duration;
      throw err;
    }

    const duration = Math.round(performance.now() - start);

    // Metrics bookkeeping
    this._totalRequests++;
    this._totalDuration += duration;
    const status = response.status;
    this._statusCodes[status] = (this._statusCodes[status] ?? 0) + 1;
    if (status >= 400) {
      this._failedRequests++;
    }

    // Store cookies
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      this.jar.applySetCookie(setCookie);
    }

    // Parse response body (best-effort JSON, fall back to text)
    let data: T;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      data = (await response.json()) as T;
    } else {
      data = (await response.text()) as unknown as T;
    }

    // Flatten response headers into a plain object
    const flatHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      flatHeaders[key] = value;
    });

    return { status, data, headers: flatHeaders, duration };
  }
}
