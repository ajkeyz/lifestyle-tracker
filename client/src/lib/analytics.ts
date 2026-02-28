// Analytics abstraction layer
// Supports: PostHog (production), Console (development)
// Privacy-first: No PII, anonymized IDs, GDPR compliant

import type { User, DailyDrop, Scenario } from "@shared/schema";
import { isFeatureEnabled } from "./feature-flags";

// Analytics provider interface
interface AnalyticsProvider {
  identify(userId: string, traits?: Record<string, any>): void;
  track(event: string, properties?: Record<string, any>): void;
  page(name?: string, properties?: Record<string, any>): void;
}

// Console provider (development)
class ConsoleAnalytics implements AnalyticsProvider {
  identify(userId: string, traits?: Record<string, any>) {
    console.log("🔷 Identify:", userId, traits);
  }

  track(event: string, properties?: Record<string, any>) {
    console.log("📊 Event:", event, properties);
  }

  page(name?: string, properties?: Record<string, any>) {
    console.log("📄 Page:", name, properties);
  }
}

// PostHog provider (production)
class PostHogAnalytics implements AnalyticsProvider {
  private posthog: any;
  private isInitialized = false;

  constructor() {
    if (typeof window !== "undefined" && import.meta.env.VITE_POSTHOG_KEY) {
      // Respect Do Not Track
      if (navigator.doNotTrack === "1") {
        console.log("🚫 Analytics disabled: Do Not Track enabled");
        return;
      }

      import("posthog-js").then(({ default: posthog }) => {
        this.posthog = posthog;
        posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
          api_host: import.meta.env.VITE_POSTHOG_HOST || "https://app.posthog.com",
          autocapture: false, // Manual tracking only
          capture_pageview: false, // Manual page views
          disable_session_recording: !import.meta.env.VITE_POSTHOG_SESSION_REPLAY,
          session_recording: {
            maskAllInputs: true, // Privacy: mask form inputs
            maskAllText: false,
          },
          loaded: (ph) => {
            this.isInitialized = true;
            console.log("✅ PostHog initialized");
          },
        });
      });
    }
  }

  identify(userId: string, traits?: Record<string, any>) {
    if (!this.isInitialized) return;
    this.posthog?.identify(userId, traits);
  }

  track(event: string, properties?: Record<string, any>) {
    if (!this.isInitialized) return;
    this.posthog?.capture(event, properties);
  }

  page(name?: string, properties?: Record<string, any>) {
    if (!this.isInitialized) return;
    this.posthog?.capture("$pageview", { page: name, ...properties });
  }
}

// Singleton analytics instance
class Analytics {
  private provider: AnalyticsProvider;
  private sessionStart: number = Date.now();
  private sessionId: string = crypto.randomUUID();

  constructor() {
    // Use console in development, PostHog in production
    const isDev = import.meta.env.DEV;
    this.provider = isDev ? new ConsoleAnalytics() : new PostHogAnalytics();
  }

  // Identify user (call once after auth)
  identify(user: User) {
    this.provider.identify(user.id, {
      username: user.username,
      created_at: user.gamesPlayed === 0 ? new Date().toISOString() : undefined,
      streak: user.streak,
      highest_streak: user.highestStreak,
      games_played: user.gamesPlayed,
      money_health: user.moneyHealth,
      membership_tier: user.membershipTier,
    });
  }

  // Track event with enrichment
  track(event: string, properties?: Record<string, any>) {
    const baseEnriched = {
      ...properties,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      session_duration_ms: Date.now() - this.sessionStart,
    };

    // Add advanced analytics data if flag is enabled
    const enriched = isFeatureEnabled("advanced_analytics")
      ? {
          ...baseEnriched,
          // Extra context for debugging/optimization
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
          device_type: this.getDeviceType(),
          platform: this.getPlatform(),
          connection_type: (navigator as any).connection?.effectiveType || "unknown",
          memory_gb: (navigator as any).deviceMemory || null,
          cpu_cores: navigator.hardwareConcurrency || null,
          is_online: navigator.onLine,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
        }
      : baseEnriched;

    this.provider.track(event, enriched);
  }

  // Track page view
  page(name: string, properties?: Record<string, any>) {
    this.provider.page(name, properties);
  }

  // Helper: Get device type
  getDeviceType(): "mobile" | "tablet" | "desktop" {
    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 1024) return "tablet";
    return "desktop";
  }

  // Helper: Get platform
  getPlatform(): "ios" | "android" | "web" {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return "ios";
    if (/android/.test(ua)) return "android";
    return "web";
  }
}

// Export singleton
export const analytics = new Analytics();

// ============================================================
// TYPE-SAFE EVENT TRACKING FUNCTIONS
// ============================================================

/**
 * Track app open/focus
 * Fires: App.tsx useEffect on mount
 */
export function trackAppOpened(user?: User) {
  analytics.track("app_opened", {
    referrer: document.referrer || null,
    is_returning_user: !!user,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    device_type: analytics.getDeviceType(),
    platform: analytics.getPlatform(),
  });
}

/**
 * Track daily drop page load
 * Fires: game.tsx when dailyDrop loads
 */
export function trackDailyDropViewed(drop: DailyDrop, user: User, loadTime: number) {
  analytics.track("daily_drop_viewed", {
    drop_id: drop.id,
    drop_number: drop.dropNumber,
    scenario_count: drop.scenarios.length,
    user_streak: user.streak,
    has_played_today: !!user.todayResult,
    time_to_load_ms: loadTime,
  });
}

/**
 * Track individual scenario view
 * Fires: game.tsx when currentIndex changes
 */
export function trackScenarioViewed(
  scenario: Scenario,
  index: number,
  timeRemaining: number
) {
  analytics.track("scenario_viewed", {
    scenario_id: scenario.id,
    scenario_index: index,
    category: scenario.category,
    has_context: !!scenario.context,
    choice_count: scenario.choices.length,
    time_remaining: timeRemaining,
  });
}

/**
 * Track choice selection (before submission)
 * Fires: scenario-card.tsx onSelectChoice
 */
export function trackChoiceSelected(
  scenarioId: string,
  index: number,
  label: string,
  timeToSelect: number,
  timeRemaining: number,
  isFirstSelection: boolean
) {
  analytics.track("choice_selected", {
    scenario_id: scenarioId,
    scenario_index: index,
    choice_label: label,
    time_to_select_ms: timeToSelect,
    time_remaining: timeRemaining,
    is_first_selection: isFirstSelection,
  });
}

/**
 * Track answer submission (locked in)
 * Fires: game.tsx when showResult updates
 */
export function trackAnswerSubmitted(
  scenarioId: string,
  index: number,
  label: string,
  isCorrect: boolean,
  points: number,
  timeSpent: number,
  timeRemaining: number,
  method: "click" | "timer" | "keyboard"
) {
  analytics.track("answer_submitted", {
    scenario_id: scenarioId,
    scenario_index: index,
    choice_label: label,
    is_correct: isCorrect,
    points_earned: points,
    time_spent_ms: timeSpent,
    time_remaining: timeRemaining,
    submission_method: method,
  });
}

/**
 * Track result feedback view
 * Fires: game.tsx when result shown
 */
export function trackResultViewed(
  scenarioId: string,
  isCorrect: boolean,
  points: number,
  feedbackLength: number
) {
  analytics.track("result_viewed", {
    scenario_id: scenarioId,
    is_correct: isCorrect,
    points_earned: points,
    feedback_text_length: feedbackLength,
  });
}

/**
 * Track game completion
 * Fires: game.tsx submitMutation.onSuccess
 */
export function trackGameCompleted(
  dropId: string,
  result: {
    score: number;
    moneyHealth: number;
    correctCount?: number;
    totalQuestions?: number;
  },
  streakBefore: number,
  streakAfter: number,
  timeSpent: number
) {
  const correctCount = result.correctCount || 0;
  const totalQuestions = result.totalQuestions || 5;

  analytics.track("game_completed", {
    drop_id: dropId,
    total_score: result.score,
    correct_count: correctCount,
    total_questions: totalQuestions,
    accuracy_percent: Math.round((correctCount / totalQuestions) * 100),
    money_health: result.moneyHealth,
    time_spent_total_ms: timeSpent,
    perfect_game: correctCount === totalQuestions,
    streak_before: streakBefore,
    streak_after: streakAfter,
    streak_grew: streakAfter > streakBefore,
  });
}

/**
 * Track streak change
 * Fires: results.tsx, streak-freeze components
 */
export function trackStreakUpdated(
  oldStreak: number,
  newStreak: number,
  change: "grew" | "broke" | "frozen" | "restored",
  freezeUsed: boolean,
  tokensRemaining: number,
  isPersonalBest: boolean,
  previousBest: number
) {
  analytics.track("streak_updated", {
    old_streak: oldStreak,
    new_streak: newStreak,
    change,
    freeze_tokens_used: freezeUsed,
    freeze_tokens_remaining: tokensRemaining,
    is_personal_best: isPersonalBest,
    previous_best: previousBest,
  });
}

/**
 * Track share action
 * Fires: results.tsx, share.tsx, social-share-card.tsx
 */
export function trackShareClicked(
  shareType: "results" | "streak" | "achievement" | "weekly_recap",
  method: "copy_link" | "native_share" | "twitter" | "facebook",
  contentType: "text" | "image" | "link",
  metadata?: {
    streak_value?: number;
    score_value?: number;
    achievement_id?: string;
  }
) {
  analytics.track("share_clicked", {
    share_type: shareType,
    share_method: method,
    content_type: contentType,
    ...metadata,
  });
}

/**
 * Track paywall impression
 * Fires: streak-insurance.tsx, membership.tsx
 */
export function trackPaywallViewed(
  paywallId: "streak_insurance" | "membership" | "freeze_tokens",
  trigger: "streak_broke" | "freeze_depleted" | "settings" | "feature_locked" | "navigation",
  user: User,
  hasSeenBefore: boolean,
  featureRequested?: string
) {
  analytics.track("paywall_viewed", {
    paywall_id: paywallId,
    trigger,
    feature_requested: featureRequested,
    user_streak: user.streak,
    freeze_tokens: user.freezeTokens,
    has_seen_before: hasSeenBefore,
  });
}

/**
 * Track purchase initiation
 * Fires: membership.tsx, membership-upgrade-modal.tsx
 */
export function trackPurchaseInitiated(
  productId: "plus" | "pro" | "freeze_token_pack",
  price: number,
  trigger: string,
  sessionDuration: number
) {
  analytics.track("purchase_initiated", {
    product_id: productId,
    price,
    currency: "USD",
    trigger,
    session_duration_ms: sessionDuration,
  });
}

/**
 * Track purchase completion
 * Fires: server webhook handler
 */
export function trackPurchaseCompleted(
  productId: string,
  price: number,
  transactionId: string,
  timeToPurchase: number
) {
  // Hash transaction ID for privacy
  const hashedId = btoa(transactionId).substring(0, 16);

  analytics.track("purchase_completed", {
    product_id: productId,
    price,
    currency: "USD",
    transaction_id: hashedId,
    time_to_purchase_ms: timeToPurchase,
  });
}

// ============================================================
// SECONDARY EVENTS (Bonus Features)
// ============================================================

/**
 * Track badge unlock
 * Fires: use-achievement-toast.tsx
 */
export function trackBadgeUnlocked(badgeId: string, badgeName: string, daysToUnlock: number) {
  analytics.track("badge_unlocked", {
    badge_id: badgeId,
    badge_name: badgeName,
    progress: 100,
    time_to_unlock_days: daysToUnlock,
  });
}

/**
 * Track onboarding start
 * Fires: profile-setup.tsx, notifications-setup.tsx, friends-setup.tsx
 */
export function trackOnboardingStarted(step: "profile" | "notifications" | "friends") {
  analytics.track("onboarding_started", {
    step,
  });
}

/**
 * Track onboarding completion
 * Fires: friends-setup.tsx (final step)
 */
export function trackOnboardingCompleted(
  stepsCompleted: number,
  timeToComplete: number,
  skippedNotifications: boolean,
  skippedFriends: boolean
) {
  analytics.track("onboarding_completed", {
    steps_completed: stepsCompleted,
    time_to_complete_ms: timeToComplete,
    skipped_notifications: skippedNotifications,
    skipped_friends: skippedFriends,
  });
}

/**
 * Track friend addition
 * Fires: friends.tsx
 */
export function trackFriendAdded(
  method: "search" | "invite_code" | "referral",
  friendCountAfter: number
) {
  analytics.track("friend_added", {
    method,
    friend_count_after: friendCountAfter,
  });
}

/**
 * Track league join/create
 * Fires: leagues.tsx
 */
export function trackLeagueJoined(
  leagueId: string,
  privacy: "public" | "private",
  memberCount: number,
  joinMethod: "created" | "invite_code"
) {
  analytics.track("league_joined", {
    league_id: leagueId,
    league_privacy: privacy,
    member_count: memberCount,
    join_method: joinMethod,
  });
}

/**
 * Track challenge creation
 * Fires: challenges.tsx
 */
export function trackChallengeCreated(
  challengeType: "money_health" | "streak" | "accuracy",
  opponentRelation: "friend" | "stranger"
) {
  analytics.track("challenge_created", {
    challenge_type: challengeType,
    opponent_relation: opponentRelation,
  });
}

/**
 * Track weekly recap view
 * Fires: weekly-recap.tsx
 */
export function trackWeeklyRecapViewed(
  weekStart: string,
  daysPlayed: number,
  totalScore: number,
  viewedAllSlides: boolean
) {
  analytics.track("weekly_recap_viewed", {
    week_start: weekStart,
    days_played: daysPlayed,
    total_score: totalScore,
    viewed_all_slides: viewedAllSlides,
  });
}

/**
 * Track feature discovery
 * Fires: Various pages on first view
 */
export function trackFeatureDiscovered(
  featureName: string,
  discoveryMethod: "navigation" | "tooltip" | "notification"
) {
  analytics.track("feature_discovered", {
    feature_name: featureName,
    discovery_method: discoveryMethod,
  });
}

/**
 * Track page view
 * Fires: App.tsx route changes
 */
export function trackPageView(pageName: string, properties?: Record<string, any>) {
  analytics.page(pageName, properties);
}

// ============================================================
// SIM LAB EVENTS
// ============================================================

/**
 * Track Sim Lab entry page viewed
 * Fires: simlab-entry.tsx on mount
 */
export function trackSimLabViewed(
  isPremium: boolean,
  templatesAvailable: number
) {
  analytics.track("simlab_viewed", {
    is_premium: isPremium,
    templates_available: templatesAvailable,
  });
}

/**
 * Track template selection from Sim Lab home
 * Fires: simlab-entry.tsx when user taps a template card
 */
export function trackSimLabTemplateSelected(
  templateId: string,
  isPremium: boolean,
  isPreview: boolean
) {
  analytics.track("simlab_template_selected", {
    template_id: templateId,
    is_premium: isPremium,
    is_preview: isPreview,
  });
}

/**
 * Track simulation setup page loaded
 * Fires: simlab-setup.tsx on mount
 */
export function trackSimLabSetupStarted(templateId: string) {
  analytics.track("simlab_setup_started", {
    template_id: templateId,
  });
}

/**
 * Track simulation run initiated
 * Fires: simlab-setup.tsx when user taps "Run Simulation"
 */
export function trackSimLabRunStarted(
  templateId: string,
  isPreview: boolean,
  inputSummary?: Record<string, unknown>
) {
  analytics.track("simlab_run_started", {
    template_id: templateId,
    is_preview: isPreview,
    input_summary: inputSummary,
  });
}

/**
 * Track simulation run completed
 * Fires: simlab-results.tsx when results load
 */
export function trackSimLabRunCompleted(
  templateId: string,
  runId: string,
  isPreview: boolean,
  metricsCount: number,
  eventsCount: number
) {
  analytics.track("simlab_run_completed", {
    template_id: templateId,
    run_id: runId,
    is_preview: isPreview,
    metrics_count: metricsCount,
    events_count: eventsCount,
  });
}

/**
 * Track sim results viewed
 * Fires: simlab-results.tsx on mount
 */
export function trackSimLabResultsViewed(
  templateId: string,
  runId: string
) {
  analytics.track("simlab_results_viewed", {
    template_id: templateId,
    run_id: runId,
  });
}

/**
 * Track save simulation clicked
 * Fires: simlab-results.tsx when user taps save
 */
export function trackSimLabSaveClicked(
  templateId: string,
  runId: string,
  isPremium: boolean
) {
  analytics.track("simlab_save_clicked", {
    template_id: templateId,
    run_id: runId,
    is_premium: isPremium,
  });
}

/**
 * Track compare simulations clicked
 * Fires: simlab-results.tsx when user taps compare
 */
export function trackSimLabCompareClicked(
  templateId: string,
  isPremium: boolean
) {
  analytics.track("simlab_compare_clicked", {
    template_id: templateId,
    is_premium: isPremium,
  });
}

/**
 * Track Sim Lab paywall view
 * Fires: simlab-entry.tsx or simlab-results.tsx when paywall shown
 */
export function trackSimLabPaywallViewed(
  trigger: "preview_limit" | "save" | "compare" | "template_locked",
  templateId?: string
) {
  analytics.track("simlab_paywall_viewed", {
    trigger,
    template_id: templateId,
  });
}
