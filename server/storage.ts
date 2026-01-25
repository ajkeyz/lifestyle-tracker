import type {
  User,
  UserStats,
  UserGameResult,
  DailyDrop,
  Scenario,
  LeaderboardEntry,
  SubmitGame,
  GameMode,
} from "@shared/schema";
import { randomUUID } from "crypto";

const sampleScenarios: Scenario[] = [
  {
    id: "tech-1",
    category: "tech",
    context: "Cash $3,800 | Debt $200 | Credit 690 | Stress 44 | Portfolio: 70% in company stock",
    question: "$10k RSUs vest. Your portfolio is already 70% company stock. What do you do?",
    choices: [
      {
        label: "A",
        text: "Hold all RSUs — belief = wealth",
        isCorrect: false,
        points: -20,
        feedback: "Concentration risk is real. Many tech workers lost everything when their company stock crashed.",
      },
      {
        label: "B",
        text: "Sell 70% and diversify into index funds",
        isCorrect: true,
        points: 100,
        feedback: "Smart move! Diversification protects your wealth while keeping some company upside.",
      },
      {
        label: "C",
        text: "Sell 100% and go cash",
        isCorrect: false,
        points: 40,
        feedback: "Too conservative if you have job stability, but reasonable if layoff risk is high.",
      },
      {
        label: "D",
        text: "Upgrade your apartment (fixed costs up)",
        isCorrect: false,
        points: -40,
        feedback: "Classic lifestyle creep! Increasing fixed expenses with volatile income is risky.",
      },
    ],
  },
  {
    id: "scam-1",
    category: "scam",
    context: "Cash $1,500 | Debt $0 | Credit 700 | Stress 40",
    question: "Caller ID shows your bank. They know your name + last transaction. They ask for OTP to \"verify\" your account.",
    choices: [
      {
        label: "A",
        text: "Give OTP to verify your identity",
        isCorrect: false,
        points: -100,
        feedback: "Never give OTP over the phone! This is a spoofing scam. Banks never ask for OTP.",
      },
      {
        label: "B",
        text: "Hang up and call number on back of card",
        isCorrect: true,
        points: 100,
        feedback: "Perfect! Always verify by calling official numbers you trust, not numbers given to you.",
      },
      {
        label: "C",
        text: "Ask them to email proof first",
        isCorrect: false,
        points: 10,
        feedback: "Still risky. Scammers can fake emails too. Call your bank directly instead.",
      },
      {
        label: "D",
        text: "Ask for employee ID then proceed",
        isCorrect: false,
        points: -30,
        feedback: "Employee IDs can be faked. Hang up and call your bank directly.",
      },
    ],
  },
  {
    id: "travel-1",
    category: "travel",
    context: "Cash $1,900 | Debt $600 | Credit 675 | Stress 47 | No travel fund",
    question: "Flight deal: $310 today. If you wait 30 days it might be $450 (60% chance). You have no travel fund.",
    choices: [
      {
        label: "A",
        text: "Book now on credit card",
        isCorrect: false,
        points: -20,
        feedback: "Adding to debt for travel isn't ideal when you already have $600 in debt.",
      },
      {
        label: "B",
        text: "Wait + start $10/day sinking fund",
        isCorrect: true,
        points: 100,
        feedback: "Great discipline! Building a travel fund prevents debt and teaches delayed gratification.",
      },
      {
        label: "C",
        text: "Skip travel this season",
        isCorrect: false,
        points: 50,
        feedback: "Reasonable if money is tight, but you're missing the chance to build good habits.",
      },
      {
        label: "D",
        text: "Book now but cut spending to pay card in full",
        isCorrect: true,
        points: 80,
        feedback: "Good if you can truly commit to paying it off. Make sure you follow through!",
      },
    ],
  },
  {
    id: "lifestyle-1",
    category: "lifestyle",
    context: "Cash $4,500 | Debt $0 | Credit 720 | Stress 35 | Just got a 15% raise",
    question: "Your friends are upgrading to nicer apartments after promotions. Your lease is up. What do you do?",
    choices: [
      {
        label: "A",
        text: "Upgrade to a place that's 30% more expensive",
        isCorrect: false,
        points: -50,
        feedback: "Classic lifestyle creep! Your housing should stay around 25-30% of income, not grow with raises.",
      },
      {
        label: "B",
        text: "Stay where you are and invest the raise difference",
        isCorrect: true,
        points: 100,
        feedback: "Wealth building 101! Living below your means and investing the difference compounds massively.",
      },
      {
        label: "C",
        text: "Get a slightly nicer place, invest half the raise",
        isCorrect: true,
        points: 70,
        feedback: "Balanced approach. Small lifestyle improvements are fine if you're still saving more.",
      },
      {
        label: "D",
        text: "Move to a luxury building to match your success",
        isCorrect: false,
        points: -70,
        feedback: "This is pure lifestyle inflation. Your apartment doesn't define your success.",
      },
    ],
  },
  {
    id: "investing-1",
    category: "investing",
    context: "Cash $8,000 | Emergency Fund: 3 months | No debt | Credit 750 | Age 28",
    question: "A friend's crypto pick is up 400% this year. They're \"sure\" it'll keep going. You have $5k to invest.",
    choices: [
      {
        label: "A",
        text: "Put all $5k into the crypto",
        isCorrect: false,
        points: -80,
        feedback: "FOMO investing rarely works. Past performance doesn't predict future returns, especially in crypto.",
      },
      {
        label: "B",
        text: "Put $500 in crypto, $4,500 in index funds",
        isCorrect: true,
        points: 100,
        feedback: "Smart allocation! Small speculative bets are fine, but the bulk should be in diversified investments.",
      },
      {
        label: "C",
        text: "Put all $5k in a total market index fund",
        isCorrect: true,
        points: 90,
        feedback: "Conservative but wise. Consistent index investing beats most active strategies over time.",
      },
      {
        label: "D",
        text: "Keep it in savings, crypto is too risky",
        isCorrect: false,
        points: 20,
        feedback: "Holding cash long-term loses to inflation. At 28, you can afford market risk for higher returns.",
      },
    ],
  },
];

function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function getDayNumber(): number {
  const start = new Date("2024-01-01");
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

const defaultStats: UserStats = {
  cash: 3000,
  debt: 500,
  credit: 680,
  stress: 50,
  investment: 2000,
};

export interface IStorage {
  getUser(sessionId: string): Promise<User | undefined>;
  getOrCreateUser(sessionId: string): Promise<User>;
  updateUser(sessionId: string, updates: Partial<User>): Promise<User | undefined>;
  getDailyDrop(): Promise<DailyDrop>;
  submitGame(sessionId: string, submission: SubmitGame): Promise<UserGameResult>;
  getLeaderboard(): Promise<LeaderboardEntry[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private dailyDrop: DailyDrop;

  constructor() {
    this.dailyDrop = {
      id: randomUUID(),
      dropNumber: getDayNumber(),
      date: getTodayDateString(),
      scenarios: sampleScenarios,
    };

    this.seedLeaderboard();
  }

  private seedLeaderboard() {
    const names = ["Jade", "Sipho", "Max", "Luna", "Kai"];
    const modes: GameMode[] = ["tech", "global", "scam", "student", "boss"];
    names.forEach((name, i) => {
      const id = `seed-${i}`;
      this.users.set(id, {
        id,
        username: name,
        mode: modes[i % modes.length],
        streak: Math.floor(Math.random() * 15) + 1,
        moneyHealth: 90 - i * 8,
        totalScore: 1000 - i * 100,
        gamesPlayed: Math.floor(Math.random() * 20) + 5,
        lastPlayedDate: getTodayDateString(),
        stats: {
          cash: 5000 + Math.random() * 3000,
          debt: Math.random() * 1000,
          credit: 700 + Math.random() * 50,
          stress: 30 + Math.random() * 30,
          investment: 10000 + Math.random() * 20000,
        },
        todayResult: null,
      });
    });
  }

  async getUser(sessionId: string): Promise<User | undefined> {
    return this.users.get(sessionId);
  }

  async getOrCreateUser(sessionId: string): Promise<User> {
    let user = this.users.get(sessionId);
    if (!user) {
      user = {
        id: sessionId,
        username: `Player${Math.floor(Math.random() * 9999)}`,
        mode: null,
        streak: 0,
        moneyHealth: 50,
        totalScore: 0,
        gamesPlayed: 0,
        lastPlayedDate: null,
        stats: { ...defaultStats },
        todayResult: null,
      };
      this.users.set(sessionId, user);
    }
    return user;
  }

  async updateUser(sessionId: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(sessionId);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(sessionId, updated);
    return updated;
  }

  async getDailyDrop(): Promise<DailyDrop> {
    const today = getTodayDateString();
    if (this.dailyDrop.date !== today) {
      this.dailyDrop = {
        id: randomUUID(),
        dropNumber: getDayNumber(),
        date: today,
        scenarios: sampleScenarios,
      };
      this.users.forEach((user, id) => {
        this.users.set(id, { ...user, todayResult: null });
      });
    }
    return this.dailyDrop;
  }

  async submitGame(sessionId: string, submission: SubmitGame): Promise<UserGameResult> {
    const user = await this.getOrCreateUser(sessionId);
    const drop = await this.getDailyDrop();

    let totalScore = 0;
    let correctCount = 0;
    const answerLabels: string[] = [];

    submission.answers.forEach((answer) => {
      const scenario = drop.scenarios.find((s) => s.id === answer.scenarioId);
      if (scenario) {
        const choice = scenario.choices.find((c) => c.label === answer.choiceLabel);
        if (choice) {
          totalScore += choice.points;
          if (choice.isCorrect) correctCount++;
        }
        answerLabels.push(answer.choiceLabel);
      }
    });

    const maxScore = drop.scenarios.length * 100;
    const iq = Math.max(0, Math.min(500, Math.round((totalScore / maxScore) * 500 + 250)));
    const accuracy = correctCount / drop.scenarios.length;
    const moneyHealth = Math.max(0, Math.min(100, Math.round(50 + accuracy * 50)));

    const newStats: UserStats = {
      cash: Math.max(0, user.stats.cash + totalScore * 2),
      debt: Math.max(0, user.stats.debt - correctCount * 50),
      credit: Math.min(850, Math.max(300, user.stats.credit + correctCount * 5)),
      stress: Math.max(0, Math.min(100, user.stats.stress - correctCount * 5)),
      investment: Math.max(0, user.stats.investment + correctCount * 200),
    };

    const result: UserGameResult = {
      answers: answerLabels,
      score: totalScore,
      moneyHealth,
      iq,
      stats: newStats,
    };

    const today = getTodayDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const newStreak = user.lastPlayedDate === yesterdayStr ? user.streak + 1 : 1;

    await this.updateUser(sessionId, {
      streak: newStreak,
      moneyHealth,
      totalScore: user.totalScore + totalScore,
      gamesPlayed: user.gamesPlayed + 1,
      lastPlayedDate: today,
      stats: newStats,
      todayResult: result,
    });

    return result;
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const users = Array.from(this.users.values());
    return users
      .sort((a, b) => b.moneyHealth - a.moneyHealth)
      .slice(0, 10)
      .map((user, index) => ({
        id: user.id,
        username: user.username,
        moneyHealth: user.moneyHealth,
        streak: user.streak,
        rank: index + 1,
      }));
  }
}

export const storage = new MemStorage();
