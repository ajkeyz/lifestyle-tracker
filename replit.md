# Lifestyle Creep - Daily Money Game

## Overview

Lifestyle Creep is a daily money decision game, inspired by Wordle, designed to enhance financial literacy through engaging gameplay. Players tackle 5 real-life financial scenarios daily, making timed choices and competing on social leaderboards. The project aims to provide a quick, educational, and competitive experience in financial decision-making.

Key capabilities include:
- Daily financial scenarios (5 per day, same for all players).
- Timed multiple-choice answers for each scenario.
- Scoring system based on correct answers, streak tracking, and social leaderboards.
- Shareable results in a Wordle-like format.
- A business vision to make financial education accessible and engaging, with market potential among casual gamers and individuals seeking to improve financial literacy.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript.
- **Routing**: Wouter.
- **State Management**: TanStack React Query.
- **Styling**: Tailwind CSS with shadcn/ui.
- **Build Tool**: Vite.
- **Theme**: Dark/light mode support.
- **Animations**: Framer Motion for transitions and micro-interactions.
- **Typography**: Plus Jakarta Sans, Inter, Fira Code with specific stylistic enhancements.
- **Color Palette**: Emerald/teal primary, gold accent.

**UI Enhancements & Features**:
- **Celebrations**: Confetti, animated progress bars, and rolling number animations for scores.
- **Visual Polish**: Glassmorphism cards, gradient backgrounds, and shimmering skeleton loaders.
- **Game Feedback**: Enhanced scenario cards with category icons, animated answer reveals, and shake effects. Streak fire animations for milestones.
- **Micro-interactions**: Animated icons and various circular progress indicators.
- **Character Mascot**: "Cleo" an animated SVG mascot with 10 emotional states, contextual dialogue, and mood-reactive animations.
- **Social Features**: Live player counts, animated leaderboards, notification toasts, activity feed with reactions, and friend nudges.
- **Premium Touches**: Integrated sound system, theme customizer with multiple color themes, and daily rewards calendar.
- **User Experience (UX) Polish**: Streamlined onboarding, persistent status bar, detailed results page with percentile stats and deep-dive CTAs, dynamic mascot reactions, image sharing, and lifeline animations.

**Key Pages**:
- Authentication, Profile management, Onboarding flows (Notifications, Friends setup).
- Home for daily drops, Game screen with timed questions and feedback.
- Deep Dive for scenario explanations, Tips Library, Weekly Recap.
- Results, Leaderboard, Leagues (create/join/manage), Challenges.
- Shareable results card, Streak protection features.
- Community features for scenario submission, voting, and discussion.
- Co-op game mode (lobby, real-time play, results) with WebSocket synchronization.
- Arcade mode for re-playable scenarios with tiered access.

### Backend
- **Framework**: Express 5 on Node.js.
- **API Pattern**: RESTful JSON endpoints.
- **Build**: esbuild.
- **Data Storage**: Drizzle ORM with PostgreSQL dialect.
- **Data Models**: User, DailyDrop, Scenario, League, Challenge, CommunityScenario, CommunityComment, CommunityVote, Co-op Session details.

### Shared Code
- `shared/schema.ts` provides TypeScript interfaces and Zod validation schemas for type safety across frontend and backend.

## External Dependencies

### Database
- **PostgreSQL**: Primary database.
- **Drizzle ORM**: For type-safe database interactions.

### UI Components
- **shadcn/ui**: Pre-built accessible components.
- **Radix UI**: Headless component primitives.
- **Lucide React**: Icon library.

### Development Tools
- **Vite**: Development server.

### PWA & Offline Support
- **Service Worker**: For caching and offline capabilities.
- **Web Push API**: For push notifications (via `web-push` library).
- **Manifest**: PWA manifest for app installation.

### Scenario System
- **Static Scenarios**: Pre-generated financial scenarios stored locally, cycled daily.
- **Categories**: Wide range of financial topics including tech, investing, debt, budgeting, etc.

### Environment Variables
- `DATABASE_URL`
- `SESSION_SECRET`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`