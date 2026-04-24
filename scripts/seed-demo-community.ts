/**
 * Seed script — clears all community posts and inserts demo content.
 *
 * Usage:
 *   npx tsx -r dotenv/config scripts/seed-demo-community.ts
 *
 * Requires DATABASE_URL in .env
 */

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { randomUUID as uuid } from "crypto";

// ── helpers ────────────────────────────────────────────────────────

function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ── demo users ─────────────────────────────────────────────────────

const DEMO_USERS = [
  { id: "demo-user-maya",   username: "maya_saves",      avatar: "cosmic-cat" },
  { id: "demo-user-jordan", username: "jordan_stacks",   avatar: "pixel-dog" },
  { id: "demo-user-priya",  username: "priya_budgets",   avatar: "neon-fox" },
  { id: "demo-user-carlos", username: "carlos_invests",  avatar: "retro-bear" },
  { id: "demo-user-aisha",  username: "aisha_earns",     avatar: "glitch-owl" },
  { id: "demo-user-dev",    username: "dev_finance",     avatar: "cyber-panda" },
];

// ── demo posts ─────────────────────────────────────────────────────

interface DemoPost {
  title: string;
  context: string;
  question: string;
  category: string;
  authorIdx: number;         // index into DEMO_USERS
  upvotes: number;
  downvotes: number;
  daysAgo: number;           // when it was "posted"
  comments: DemoComment[];
}

interface DemoComment {
  authorIdx: number;
  content: string;
  isAdvice: boolean;
  upvotes: number;
  downvotes: number;
  replies?: DemoComment[];
}

const DEMO_POSTS: DemoPost[] = [
  // ── Housing / Renting ──
  {
    title: "Should I stretch my budget to buy a house or keep renting?",
    context: "I'm 28, earning $72k/year. Rent is $1,400/month. I've saved $30k. Houses in my area start at $320k. A mortgage would be ~$2,100/month. I'd be house-poor but building equity.",
    question: "Is it smarter to stretch for a mortgage now while rates are high, or keep renting and investing the difference?",
    category: "lifestyle",
    authorIdx: 0,
    upvotes: 34,
    downvotes: 3,
    daysAgo: 2,
    comments: [
      {
        authorIdx: 1,
        content: "I was in this exact spot 2 years ago. Kept renting, put the difference into index funds. No regrets — my investments are up 18% and I have way more flexibility. Housing isn't always the flex people make it out to be.",
        isAdvice: true,
        upvotes: 22,
        downvotes: 1,
        replies: [
          {
            authorIdx: 0,
            content: "This is reassuring. I keep getting pressure from family saying \"you're throwing money away renting\" but the math doesn't always work out.",
            isAdvice: false,
            upvotes: 8,
            downvotes: 0,
          },
          {
            authorIdx: 3,
            content: "The 'throwing money away' line drives me crazy. You're also 'throwing money away' on mortgage interest, property tax, maintenance, and insurance. Run the numbers both ways.",
            isAdvice: true,
            upvotes: 15,
            downvotes: 0,
          },
        ],
      },
      {
        authorIdx: 4,
        content: "One thing people forget: being house-poor means you can't invest, can't handle emergencies, and your quality of life tanks. A $2,100 mortgage on $72k is about 35% of gross — that's tight.",
        isAdvice: true,
        upvotes: 19,
        downvotes: 2,
      },
      {
        authorIdx: 5,
        content: "Have you looked into first-time buyer programs? Some states offer down payment assistance that could make the math work without stretching so thin.",
        isAdvice: true,
        upvotes: 11,
        downvotes: 0,
      },
    ],
  },

  // ── Relocating to save ──
  {
    title: "Moving from NYC to Charlotte to save $1,800/month — am I crazy?",
    context: "I work fully remote earning $95k. My NYC rent is $2,600 for a studio. I found a 1BR in Charlotte for $1,100. I'd save ~$1,800/month but I'd leave my entire social circle behind.",
    question: "Has anyone made the big-city-to-low-COL move? Was the savings worth the lifestyle trade-off?",
    category: "career",
    authorIdx: 1,
    upvotes: 47,
    downvotes: 5,
    daysAgo: 1,
    comments: [
      {
        authorIdx: 2,
        content: "I moved from SF to Austin 3 years ago. The first 6 months were lonely but I used the savings to pay off $28k in student loans. Financially it was life-changing. Socially, it took about a year to rebuild. Worth it? For me, 100%.",
        isAdvice: false,
        upvotes: 31,
        downvotes: 1,
        replies: [
          {
            authorIdx: 1,
            content: "The loan payoff angle is huge. I have $22k in student debt — that $1,800/month could wipe it in a year.",
            isAdvice: false,
            upvotes: 12,
            downvotes: 0,
          },
        ],
      },
      {
        authorIdx: 4,
        content: "Pro tip: do a 6-month trial. Most leases are flexible in lower-COL cities. Keep your NYC stuff in storage. If you hate it, you go back. If you love it, you're already saving $10k+.",
        isAdvice: true,
        upvotes: 28,
        downvotes: 0,
      },
      {
        authorIdx: 3,
        content: "Watch out for the salary adjustment trap. Some companies will try to cut your pay when you move. Make sure your offer/contract doesn't have location-based adjustments.",
        isAdvice: true,
        upvotes: 16,
        downvotes: 1,
      },
    ],
  },

  // ── Investing as a beginner ──
  {
    title: "I have $5k to invest for the first time. Everyone has different advice.",
    context: "I'm 24, no debt, $10k emergency fund. I have $5k sitting in savings earning 4.5% APY. My coworker says crypto, my dad says real estate, Reddit says index funds. I'm paralyzed.",
    question: "What did you actually do with your first real investment? Looking for real experiences, not textbook answers.",
    category: "investing",
    authorIdx: 2,
    upvotes: 52,
    downvotes: 2,
    daysAgo: 3,
    comments: [
      {
        authorIdx: 3,
        content: "Put my first $5k into VTI (total stock market ETF) when I was 23. Boring? Yes. But 4 years later it's grown to ~$7,800 and I barely think about it. The best investment strategy is one you won't panic-sell during a dip.",
        isAdvice: true,
        upvotes: 38,
        downvotes: 1,
        replies: [
          {
            authorIdx: 2,
            content: "The 'won't panic-sell' part is key. I know myself — if I put $5k in crypto and it drops 40% I'd lose sleep.",
            isAdvice: false,
            upvotes: 14,
            downvotes: 0,
          },
          {
            authorIdx: 5,
            content: "VTI or VOO are basically the 'learn to walk before you run' of investing. Nothing wrong with boring when you're starting out.",
            isAdvice: true,
            upvotes: 10,
            downvotes: 0,
          },
        ],
      },
      {
        authorIdx: 0,
        content: "Hot take: before investing the $5k, max out your Roth IRA contribution first. You're 24 — that money compounding tax-free for 40 years is insane. The 2024 limit is $7,000 so your $5k fits perfectly.",
        isAdvice: true,
        upvotes: 41,
        downvotes: 0,
      },
      {
        authorIdx: 4,
        content: "Your dad is wrong about real estate with $5k (not enough), your coworker is wrong about crypto for a first investment (too volatile). Index funds are boring because they work.",
        isAdvice: true,
        upvotes: 25,
        downvotes: 3,
      },
    ],
  },

  // ── Lifestyle creep ──
  {
    title: "Got a $15k raise and somehow I'm saving LESS than before",
    context: "Went from $60k to $75k six months ago. I was saving $500/month before. Now I'm barely saving $200. I upgraded my apartment, got a new car payment, and my 'treat yourself' spending is out of control.",
    question: "How do you fight lifestyle creep when you finally start making decent money?",
    category: "lifestyle",
    authorIdx: 4,
    upvotes: 61,
    downvotes: 1,
    daysAgo: 1,
    comments: [
      {
        authorIdx: 0,
        content: "The rule that saved me: when you get a raise, immediately automate 50% of the increase into savings/investments before you ever see it. You can't spend what you never had. I did this with a $12k raise and barely noticed the difference in lifestyle.",
        isAdvice: true,
        upvotes: 44,
        downvotes: 0,
        replies: [
          {
            authorIdx: 4,
            content: "This is genius. I think if I had set up auto-transfer on day one I wouldn't be in this spot. Setting this up tonight.",
            isAdvice: false,
            upvotes: 9,
            downvotes: 0,
          },
        ],
      },
      {
        authorIdx: 5,
        content: "Track every dollar for one month. I did this and found I was spending $380/month on food delivery alone. Seeing the number in black and white was the wake-up call I needed.",
        isAdvice: true,
        upvotes: 27,
        downvotes: 0,
      },
      {
        authorIdx: 1,
        content: "The car payment is the killer here. That's probably $300-500/month you didn't have before. New car smell fades, but that payment doesn't.",
        isAdvice: true,
        upvotes: 33,
        downvotes: 2,
      },
      {
        authorIdx: 3,
        content: "I like the 'one upgrade' rule: with each raise, pick ONE thing to upgrade (apartment OR car OR lifestyle). Not all three. You chose all three simultaneously.",
        isAdvice: true,
        upvotes: 21,
        downvotes: 0,
      },
    ],
  },

  // ── Side hustle vs. career focus ──
  {
    title: "Side hustle is making $2k/month but it's killing my 9-5 performance",
    context: "I freelance as a graphic designer nights and weekends, making $2k/month on top of my $65k salary. But I'm exhausted, my main job performance is slipping, and my manager noticed. My day job has better long-term upside (promotion track).",
    question: "When does a side hustle become a liability? Should I scale back or go all-in on one path?",
    category: "career",
    authorIdx: 3,
    upvotes: 39,
    downvotes: 4,
    daysAgo: 4,
    comments: [
      {
        authorIdx: 1,
        content: "Had this exact dilemma. I was doing Shopify consulting on the side while working in tech. When my day job performance dropped, I got put on a PIP. Killed the side hustle, focused on work, got promoted 8 months later with a $20k raise. That's $20k EVERY year vs $24k side hustle money while burning out.",
        isAdvice: false,
        upvotes: 35,
        downvotes: 2,
        replies: [
          {
            authorIdx: 3,
            content: "The PIP fear is real. My manager hasn't gone there yet but the 'I've noticed your energy is different' talk was basically a warning shot.",
            isAdvice: false,
            upvotes: 11,
            downvotes: 0,
          },
        ],
      },
      {
        authorIdx: 2,
        content: "Counter-perspective: I left my 9-5 for my side hustle 2 years ago and now make $120k freelancing. But I had 6 months of savings and clients lined up. The key is timing, not just picking one.",
        isAdvice: false,
        upvotes: 18,
        downvotes: 1,
      },
      {
        authorIdx: 4,
        content: "Math check: a promotion from $65k to $85k is a $20k annual raise with benefits, PTO, and stability. That beats grinding $2k/month with no safety net. Protect the golden goose.",
        isAdvice: true,
        upvotes: 29,
        downvotes: 0,
      },
    ],
  },

  // ── Emergency fund dilemma ──
  {
    title: "Using my emergency fund for a once-in-a-lifetime travel opportunity?",
    context: "My best friend is getting married in Bali. Flights + accommodation + time off = ~$4,500. I have $8k in my emergency fund (3 months expenses). Using more than half feels wrong but I'll never get this chance again.",
    question: "Is dipping into your emergency fund for experiences ever justified, or is that a slippery slope?",
    category: "travel",
    authorIdx: 5,
    upvotes: 28,
    downvotes: 8,
    daysAgo: 3,
    comments: [
      {
        authorIdx: 0,
        content: "Unpopular opinion: yes, go. BUT set up an automatic plan to rebuild it. $375/month gets you back to $8k in 12 months. Life isn't a spreadsheet — some experiences have compound returns too.",
        isAdvice: true,
        upvotes: 22,
        downvotes: 4,
        replies: [
          {
            authorIdx: 5,
            content: "I love the framing of 'compound returns on experiences'. This friendship is 15 years deep. Missing this would cost more than $4,500.",
            isAdvice: false,
            upvotes: 13,
            downvotes: 0,
          },
        ],
      },
      {
        authorIdx: 3,
        content: "Hard disagree. An emergency fund exists for EMERGENCIES. What if your car breaks down next month? Start a separate 'Bali fund' and find ways to cut the $4,500 — cheaper flights, budget accommodation, fewer activities.",
        isAdvice: true,
        upvotes: 19,
        downvotes: 3,
      },
      {
        authorIdx: 1,
        content: "Middle ground: go but be scrappy. I went to a destination wedding for $2,800 instead of $5,000 by booking 3 months early, sharing an Airbnb, and skipping the optional excursions. You can celebrate your friend without draining your safety net.",
        isAdvice: true,
        upvotes: 31,
        downvotes: 0,
      },
    ],
  },

  // ── Splitting finances with partner ──
  {
    title: "My partner makes 3x what I do — how do we split rent fairly?",
    context: "I make $48k, my partner makes $140k. We're moving in together. They want to split rent 50/50 ($1,200 each for a $2,400 apartment). That's 30% of my take-home but only 10% of theirs. I love them but this feels unfair.",
    question: "How do couples with big income gaps handle shared expenses without resentment?",
    category: "relationships",
    authorIdx: 2,
    upvotes: 73,
    downvotes: 4,
    daysAgo: 0,
    comments: [
      {
        authorIdx: 4,
        content: "Proportional split is the way. You each pay the same PERCENTAGE of income toward shared expenses. On your combined $188k, you earn ~25% and they earn ~75%. So you'd pay $600 and they'd pay $1,800. Both contributing the same relative sacrifice.",
        isAdvice: true,
        upvotes: 55,
        downvotes: 2,
        replies: [
          {
            authorIdx: 2,
            content: "We just had the conversation using this framework and they immediately said 'that makes total sense, why didn't I think of it that way?' Sometimes it's just about reframing.",
            isAdvice: false,
            upvotes: 28,
            downvotes: 0,
          },
          {
            authorIdx: 0,
            content: "This is exactly what my fiancé and I do. We have a joint account where we each deposit our proportional share for bills/rent/groceries. Everything else stays separate. Zero fights about money in 3 years.",
            isAdvice: false,
            upvotes: 19,
            downvotes: 0,
          },
        ],
      },
      {
        authorIdx: 5,
        content: "Important: have this conversation BEFORE you sign the lease, not after. Moving in with unspoken financial tension is a relationship killer. The fact that you're asking this question means you already feel the imbalance.",
        isAdvice: true,
        upvotes: 34,
        downvotes: 0,
      },
      {
        authorIdx: 1,
        content: "Also consider: if your partner wants a $2,400 apartment but you'd be fine with $1,800, they should cover the difference in lifestyle choice. Don't let someone else's taste set your budget.",
        isAdvice: true,
        upvotes: 23,
        downvotes: 1,
      },
    ],
  },

  // ── Subscription creep ──
  {
    title: "I just counted my subscriptions: $347/month. How did this happen?",
    context: "Netflix, Spotify, iCloud, gym, NYT, Adobe CC, ChatGPT Plus, YouTube Premium, Hulu, DoorDash+, Amazon Prime, parking app, meditation app, two newsletters... Each one felt small at sign-up. Together they're a car payment.",
    question: "What's your system for auditing subscriptions? Which ones are actually worth keeping?",
    category: "debt",
    authorIdx: 0,
    upvotes: 44,
    downvotes: 2,
    daysAgo: 5,
    comments: [
      {
        authorIdx: 5,
        content: "I do a quarterly 'subscription purge' — cancel everything, then only re-subscribe to what I actually miss after 2 weeks. Last time I went from $290 to $89/month. Turns out I don't miss YouTube Premium or the meditation app at all.",
        isAdvice: true,
        upvotes: 37,
        downvotes: 1,
      },
      {
        authorIdx: 3,
        content: "DoorDash+ is the silent killer. You think you're saving on delivery fees but you're ordering 3x more because 'free delivery.' Cancel it and watch your food spending drop by $200+/month.",
        isAdvice: true,
        upvotes: 29,
        downvotes: 2,
        replies: [
          {
            authorIdx: 0,
            content: "You're calling me out and I hate that you're right. My DoorDash spending last month was $480 on top of the $10 subscription. Pain.",
            isAdvice: false,
            upvotes: 15,
            downvotes: 0,
          },
        ],
      },
      {
        authorIdx: 2,
        content: "Pro tip: most premium apps have free tiers that are 90% as good. I switched from Spotify Premium to the free tier and honestly... I just hear a few ads. That's $13/month × 12 = $156/year for skipping ads.",
        isAdvice: true,
        upvotes: 14,
        downvotes: 5,
      },
    ],
  },
];

// ── main seed function ──────────────────────────────────────────────

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);
  const week = getWeekNumber();

  console.log("🗑️  Clearing existing community data...");
  await db.execute(sql`DELETE FROM community_votes`);
  await db.execute(sql`DELETE FROM community_comments`);
  await db.execute(sql`DELETE FROM community_scenarios`);
  console.log("   Done.\n");

  // Upsert demo users (insert or update on conflict)
  console.log("👤 Upserting demo users...");
  for (const u of DEMO_USERS) {
    const refCode = `demo-${u.id.slice(-6)}-${Math.random().toString(36).slice(2, 6)}`;
    const streak = Math.floor(Math.random() * 15) + 3;
    const mh = Math.floor(Math.random() * 30) + 60;
    const gp = Math.floor(Math.random() * 50) + 10;
    const score = Math.floor(Math.random() * 5000) + 1000;
    await db.execute(sql`
      INSERT INTO lifestyle_users (
        id, username, avatar, mode, streak, highest_streak, freeze_tokens,
        frozen_dates, streak_calendar, games_played, total_score, money_health,
        stats, badges, notification_prefs, streak_insurance,
        claimed_missions, category_stats, referral_code, friend_ids,
        created_at, updated_at
      ) VALUES (
        ${u.id}, ${u.username}, ${u.avatar}, 'global', ${streak}, ${streak + 5}, 1,
        '[]'::jsonb, '[]'::jsonb, ${gp}, ${score}, ${mh},
        '{"totalCorrect":0,"totalAnswered":0,"avgTimePerQuestion":0,"fastestCorrect":0,"categoryBreakdown":{}}'::jsonb,
        '[]'::jsonb,
        '{"pushEnabled":false,"streakReminder":true,"dailyDropReminder":true,"friendActivity":true,"weeklyDigest":true,"marketingEmails":false}'::jsonb,
        '{"active":false,"expiresAt":null,"autoRenew":false}'::jsonb,
        '[]'::jsonb, '[]'::jsonb, ${refCode}, '[]'::jsonb,
        NOW(), NOW()
      )
      ON CONFLICT (id) DO UPDATE SET username = ${u.username}, avatar = ${u.avatar}
    `);
  }
  console.log(`   Created ${DEMO_USERS.length} demo users.\n`);

  // Insert demo posts, comments, and votes
  console.log("📝 Inserting demo posts...");

  for (const post of DEMO_POSTS) {
    const author = DEMO_USERS[post.authorIdx];
    const scenarioId = uuid();

    await db.execute(sql`
      INSERT INTO community_scenarios (id, author_id, title, context, question, type, category, week_number, upvotes, downvotes, comment_count, created_at)
      VALUES (${scenarioId}, ${author.id}, ${post.title}, ${post.context}, ${post.question},
              'demo', ${post.category}, ${week}, ${post.upvotes}, ${post.downvotes},
              ${countComments(post.comments)}, ${daysAgo(post.daysAgo)})
    `);

    // Insert comments recursively
    for (const comment of post.comments) {
      await insertComment(db, scenarioId, null, comment);
    }

    console.log(`   ✅ "${post.title.slice(0, 50)}..." (${post.comments.length} top-level comments)`);
  }

  console.log(`\n🎉 Seeded ${DEMO_POSTS.length} demo posts with comments and votes.`);
  await pool.end();
  process.exit(0);
}

function countComments(comments: DemoComment[]): number {
  let count = 0;
  for (const c of comments) {
    count += 1;
    if (c.replies) count += countComments(c.replies);
  }
  return count;
}

async function insertComment(
  db: ReturnType<typeof drizzle>,
  scenarioId: string,
  parentId: string | null,
  comment: DemoComment,
) {
  const author = DEMO_USERS[comment.authorIdx];
  const commentId = uuid();

  await db.execute(sql`
    INSERT INTO community_comments (id, scenario_id, parent_id, author_id, content, is_advice, upvotes, downvotes, created_at)
    VALUES (${commentId}, ${scenarioId}, ${parentId}, ${author.id}, ${comment.content},
            ${comment.isAdvice}, ${comment.upvotes}, ${comment.downvotes}, NOW())
  `);

  if (comment.replies) {
    for (const reply of comment.replies) {
      await insertComment(db, scenarioId, commentId, reply);
    }
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
