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

Key pages:
- Auth (`/`) - Sign-in page with Replit Auth (Apple, Google, Email)
- Profile Setup (`/profile-setup`) - Username, avatar, bio, privacy settings
- Notifications Setup (`/notifications-setup`) - Pre-permission screen for notifications
- Friends Setup (`/friends-setup`) - Friend discovery (username search, invite contacts)
- Mode Selection (`/setup`) - Choose game mode (Tech, Global, Fraud, Student, Boss)
- Home (`/`) - Daily drop info, streak, play button (after auth)
- Deep Dive (`/deep-dive`) - Post-game explanations for each scenario
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

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key (has fallback for dev)