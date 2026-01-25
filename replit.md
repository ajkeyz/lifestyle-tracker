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
- Home (`/`) - Daily drop info, streak, play button
- Game (`/play`) - Timed scenario questions
- Results (`/results`) - Score breakdown, sharing
- Leaderboard (`/leaderboard`) - Friend rankings

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

### Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts`
- **Migrations**: `drizzle-kit push` for schema sync
- **Current State**: In-memory storage implementation (database schema ready but storage uses memory)

Data models:
- User (id, username, streak, moneyHealth, stats, todayResult)
- DailyDrop (id, dropNumber, date, scenarios)
- Scenario (id, category, context, question, choices with feedback)

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