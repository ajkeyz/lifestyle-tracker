# Lifestyle Creep - Daily Money Game

## Overview

Lifestyle Creep is a daily money decision game inspired by Wordle. Players face 5 real-life financial scenarios each day, make choices within a time limit, and compete with friends on leaderboards. The game teaches financial literacy through engaging gameplay that takes 2-4 minutes daily.

Core gameplay loop:
- Daily drops with 5 financial scenarios (same for all players)
- Multiple choice answers with 20-second timer per question
- Scoring based on financial wisdom (Money Health, IQ)
- Streak tracking and social leaderboards
- Share results in Wordle-style format

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with custom plugins for Replit integration
- **Theme**: Dark/light mode support with CSS custom properties
- **Animations**: Framer Motion for page transitions, staggered animations, and micro-interactions
- **Typography**: Inter (body), Space Grotesk (headings/display)
- **Color Palette**: Emerald/teal primary (#10b981), gold accent (#f59e0b)

### UI Enhancement Components

**Stage 1 - Core Celebrations:**
- `confetti.tsx` - 5 confetti types (fireworks, stars, money rain, side cannons, celebration combo)
- `animated-progress.tsx` - Timer with pulse animation at 5 seconds, glow effects
- `RollingNumber` - Spring-animated score display with scale/glow on completion

**Stage 2 - Visual Polish:**
- `glass-card.tsx` - Glassmorphism cards with blur/glow variants
- `gradient-background.tsx` - Mesh gradient backgrounds with floating orbs
- `enhanced-skeleton.tsx` - Shimmer/pulse skeleton loading states

**Stage 3 - Game Feedback:**
- `scenario-card.tsx` - Enhanced with 19 category icons/colors, animated answer reveals, shake effects for wrong answers
- `streak-fire.tsx` - StreakFire component with intensity levels (7, 30, 100 day milestones), StreakMilestone progress bar

**Stage 4 - Micro-interactions:**
- `animated-icons.tsx` - Animated icons (check, trophy, star, heart, zap, crown, award, target, trending)
- `progress-ring.tsx` - Circular progress indicators (ProgressRing, MultiProgressRing, ScoreRing, TimerRing)

**Stage 5 - Social Features:**
- `live-players.tsx` - LivePlayers count with pulse animation, RecentPlayerActivity feed
- `leaderboard-animations.tsx` - AnimatedLeaderboard with rank changes, LeaderboardPodium
- `notification-toast.tsx` - NotificationToast system, AchievementUnlock overlay

**Stage 6 - Premium Touches:**
- `sound-system.tsx` - SoundSystemProvider with Web Audio API (click, correct, incorrect, tick, timeWarning, complete, levelUp, streak, achievement)
- `theme-customizer.tsx` - ThemeProvider with 6 color themes (emerald, blue, purple, rose, orange, cyan), dark/light toggle
- `daily-rewards.tsx` - DailyRewards calendar with claim animations, RewardClaimAnimation overlay

Key pages:
- Auth (`/`) - Sign-in page with Replit Auth (Apple, Google, Email)
- Profile (`/profile`) - User profile view with username, stats, friend discovery via username sharing
- Profile Setup (`/profile-setup`) - Username, avatar, bio, privacy settings
- Notifications Setup (`/notifications-setup`) - Pre-permission screen for notifications
- Friends Setup (`/friends-setup`) - Friend discovery (username search, invite contacts)
- Mode Selection (`/setup`) - Choose game mode (Tech, Global, Fraud, Student, Boss)
- Home (`/`) - Daily drop info, streak, play button (after auth)
- Deep Dive (`/deep-dive`) - Post-game explanations for each scenario with community stats, tips library links, and keyboard navigation
- Tips Library (`/tips`) - 27+ categorized financial tips with search, filtering, and category deep-linking via ?category= URL param
- Weekly Recap (`/weekly-recap`) - Spotify Wrapped-style weekly summary with best/worst decisions, improvement areas, league rank, funny title
- Settings (`/settings`) - Low Pressure Mode toggle and app settings
- Help (`/help`) - FAQ cards with answers, contact support, and report scenario buttons
- Game (`/play`) - Timed scenario questions
- Results (`/results`) - Score breakdown, sharing
- Leaderboard (`/leaderboard`) - Friend rankings
- Leagues (`/leagues`) - Friend leagues with weekly competitions, create/join/leave leagues
- Challenges (`/challenges`) - Challenge friends to compare Money Health, streak, or accuracy; includes trash talk presets and badge rewards
- Share (`/share`) - Customizable share card for results with theme colors, hide numbers toggle, league name, and social sharing
- Streak Protection - Freeze tokens to protect streaks, visual 28-day calendar, milestone fire animations (7, 14, 30, 60, 100 days)
- Community (`/community`) - User-submitted scenarios for community voting and discussion
- Community Detail (`/community/:id`) - Scenario detail with comments, financial advice, and voting
- Community Submit (`/community/submit`) - Form to submit new real or hypothetical financial scenarios
- Co-op Lobby (`/coop-lobby`) - Create or join a co-op game session with 6-character code, mode selection (Daily Drop vs Arcade)
- Co-op Game (`/coop-game/:sessionId`) - Play with a friend in real-time with synchronized timer and WebSocket updates
- Co-op Results (`/coop-results/:sessionId`) - View shared results showing both players' scores and winner
- Arcade (`/arcade`) - Replayable game mode with different scenarios, tier-based daily play limits (free=1, plus=3, pro=unlimited), free tier can replay game 0 unlimited times
- Arcade Results (`/arcade-results`) - Score breakdown after arcade game with play-again option

### Backend Architecture
- **Framework**: Express 5 on Node.js
- **Session Management**: express-session with MemoryStore (development)
- **API Pattern**: RESTful JSON endpoints under `/api/`
- **Build**: esbuild for production bundling

Key endpoints:
- `GET /api/user` - Get or create session user
- `GET /api/daily-drop` - Fetch today's scenarios
- `POST /api/submit-game` - Submit answers and calculate score
- `GET /api/leaderboard` - Fetch rankings
- `GET /api/check-username/:username` - Check username availability
- `POST /api/profile` - Update user profile (username, avatar, bio, privacy)
- `GET /api/leagues` - Get user's leagues
- `GET /api/leagues/:id` - Get specific league details
- `POST /api/leagues` - Create a new league
- `POST /api/leagues/join` - Join a league by invite code
- `POST /api/leagues/:id/leave` - Leave a league
- `GET /api/friends` - Get user's friends for challenge selection
- `GET /api/challenges` - Get user's challenges (sent and received)
- `POST /api/challenges` - Create a new challenge
- `POST /api/challenges/:id/respond` - Accept or decline a challenge
- `GET /api/streak-calendar` - Get user's streak calendar (last 30 days)
- `POST /api/use-freeze` - Use a freeze token to protect streak
- `POST /api/add-freeze-token` - Add freeze tokens to user account
- `GET /api/badges` - Get user's badge/achievement progress
- `POST /api/low-pressure-mode` - Toggle low pressure mode on/off
- `POST /api/notification-prefs` - Update notification preferences
- `POST /api/streak-buyback` - Restore lost streak (Plus only, once per month)
- `POST /api/late-pass` - Play yesterday's drop (Plus only)
- `POST /api/toggle-plus` - Toggle Plus membership status (demo)
- `GET /api/community/scenarios` - Get community scenarios with optional filters
- `GET /api/community/scenarios/:id` - Get single community scenario
- `POST /api/community/scenarios` - Create a new community scenario
- `POST /api/community/scenarios/:id/vote` - Vote on a community scenario
- `GET /api/community/scenarios/:id/comments` - Get comments for a scenario
- `POST /api/community/comments` - Add a comment to a scenario
- `POST /api/community/comments/:id/vote` - Vote on a comment
- `GET /api/community/realest-of-week` - Get top scenarios of the week
- `POST /api/coop/create` - Create a new co-op session with mode selection (body: {mode: "daily"|"arcade", arcadeGameIndex?: number})
- `GET /api/coop/session/:sessionId` - Get co-op session details
- `POST /api/coop/join` - Join a co-op session by code
- `POST /api/coop/session/:sessionId/start` - Start the co-op game (host only)
- `POST /api/coop/session/:sessionId/answer` - Submit answer in co-op game
- `POST /api/coop/session/:sessionId/next` - Move to next question (both must answer)
- `GET /api/coop/session/:sessionId/result` - Get co-op game results
- WebSocket `/ws` - Real-time co-op game synchronization
- `GET /api/arcade-status` - Get arcade play limits and remaining plays
- `GET /api/arcade-drop` - Fetch arcade scenarios (different from daily drop)
- `POST /api/submit-arcade` - Submit arcade game answers

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Migrations**: `drizzle-kit push` for schema sync
- **Current State**: In-memory storage implementation (database schema ready but storage uses memory)

Data models:
- User (id, username, avatar, bio, allowFriendsToFind, isProfilePrivate, profileSetupComplete, mode, streak, highestStreak, freezeTokens, frozenDates, streakCalendar, moneyHealth, stats, todayResult)
- StreakDay (date, played, frozen, score?)
- DailyDrop (id, dropNumber, date, scenarios)
- Scenario (id, category, context, question, choices with feedback)
- League (id, name, emoji/icon, privacy, inviteCode, createdBy, members, weekStartDate, previousWeekWinner)
- LeagueMember (userId, username, avatar, weeklyScore, weeklyRank, isWeeklyWinner)
- Challenge (id, challengerId, challengeeId, type [money_health/streak/accuracy], trashTalk, customMessage, status [pending/accepted/completed/expired/declined], winnerId, badgeAwarded, createdAt)
- CommunityScenario (id, authorId, authorUsername, authorAvatar, authorBadges, authorMoneyHealth, type, category, title, context, question, upvotes, downvotes, isRealistOfWeek, createdAt)
- CommunityComment (id, scenarioId, authorId, authorUsername, authorAvatar, authorBadges, authorMoneyHealth, content, isFinancialAdvice, upvotes, createdAt)
- CommunityVote (id, scenarioId, commentId, userId, voteType)

### Shared Code
- `shared/schema.ts` - TypeScript interfaces and Zod validation schemas
- Used by both frontend and backend for type safety

## External Dependencies

### Database
- **PostgreSQL** - Primary database (via DATABASE_URL environment variable)
- **Drizzle ORM** - Type-safe database queries
- **connect-pg-simple** - PostgreSQL session store (available but not currently active)

### UI Components
- **shadcn/ui** - Pre-built accessible components (new-york style)
- **Radix UI** - Headless component primitives
- **Lucide React** - Icon library

### Development Tools
- **Vite** - Development server with HMR
- **Replit plugins** - Error overlay, cartographer, dev banner

### PWA & Offline Support
- **Service Worker** - Caches static assets, daily drop data, and provides offline fallback
- **Push Notifications** - Web push via web-push library with VAPID authentication
- **Manifest** - Full PWA manifest with app icons and theme colors

### Scenario System
- **Static Scenarios** - 30 days of pre-generated financial scenarios (150 total) in `server/static-scenarios.ts`
- **Day Cycling** - Uses `getDayNumber() % 30` to cycle through scenario sets (day 758 → day 8 scenarios)
- **Categories** - tech, scam, travel, lifestyle, investing, career, debt, relationships, housing, insurance, tax, credit, emergency, budgeting, health, giving, saving, family, windfall
- **No External Dependencies** - Scenarios load instantly without API calls

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (has fallback for dev)
- `OPENAI_API_KEY` - OpenAI API key (used for other features, not scenarios)
- `VAPID_PUBLIC_KEY` - Public key for push notifications (optional, disables push if missing)
- `VAPID_PRIVATE_KEY` - Private key for push notifications (optional, disables push if missing)