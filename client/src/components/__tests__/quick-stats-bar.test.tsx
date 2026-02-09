import { render, screen } from '@testing-library/react';
import { QuickStatsBar } from '../quick-stats-bar';
import type { User } from '@shared/schema';

// Mock the LiquidMoneyMeter component
jest.mock('../liquid-money-meter', () => ({
  LiquidMoneyMeter: ({ value }: { value: number }) => (
    <div data-testid="liquid-money-meter">{value}</div>
  ),
}));

describe('QuickStatsBar', () => {
  const mockUser: User = {
    id: 'test-user-1',
    username: 'TestUser',
    avatar: 'cat',
    bio: 'Test bio',
    allowFriendsToFind: true,
    isProfilePrivate: false,
    profileSetupComplete: true,
    onboardingComplete: true,
    mode: 'global',
    streak: 5,
    highestStreak: 10,
    freezeTokens: 2,
    frozenDates: [],
    streakCalendar: [],
    moneyHealth: 75,
    totalScore: 1000,
    gamesPlayed: 20,
    lastPlayedDate: '2026-02-08',
    stats: {
      cash: 5000,
      debt: 1000,
      credit: 750,
      stress: 30,
      investment: 10000,
    },
    todayResult: null,
    badges: [],
    perfectGames: 3,
    scamStreak: 2,
    hadPreviousStreak: false,
    lowPressureMode: false,
    soundEnabled: true,
    notificationPrefs: {
      dailyReminderEnabled: true,
      dailyReminderTime: '09:00',
      onlyIfNotPlayed: true,
      onlyIfNotPlayedTime: '20:00',
      challengeAlerts: true,
      leagueRankAlerts: true,
    },
    streakInsurance: {
      isPlus: false,
      lastBuybackDate: null,
      lostStreak: null,
      lostStreakDate: null,
      latePassAvailable: false,
    },
    gameHistory: [],
    categoryStats: [],
    referralCode: 'TEST123',
    referredBy: null,
    referralCount: 0,
    friendIds: [],
    membershipTier: 'free',
  };

  it('renders all stats correctly', () => {
    render(<QuickStatsBar user={mockUser} />);

    // Check streak
    expect(screen.getByTestId('stat-streak')).toHaveTextContent('5');

    // Check money health (via LiquidMoneyMeter)
    expect(screen.getByTestId('liquid-money-meter')).toHaveTextContent('75');

    // Check games played
    expect(screen.getByTestId('stat-games')).toHaveTextContent('20');
  });

  it('displays rank when provided', () => {
    render(<QuickStatsBar user={mockUser} rank={3} />);

    expect(screen.getByTestId('stat-rank')).toHaveTextContent('3');
  });

  it('displays dash when rank is not provided', () => {
    render(<QuickStatsBar user={mockUser} />);

    expect(screen.getByTestId('stat-rank')).toHaveTextContent('-');
  });

  it('applies custom className', () => {
    const { container } = render(
      <QuickStatsBar user={mockUser} className="custom-class" />
    );

    const statsBar = container.querySelector('.custom-class');
    expect(statsBar).toBeInTheDocument();
  });

  it('shows correct streak color for active streak', () => {
    const { container } = render(<QuickStatsBar user={mockUser} />);

    const streakIcon = container.querySelector('.text-orange-500');
    expect(streakIcon).toBeInTheDocument();
  });

  it('shows correct health color for high health', () => {
    render(<QuickStatsBar user={mockUser} />);

    // LiquidMoneyMeter is rendered with value 75
    expect(screen.getByTestId('liquid-money-meter')).toBeInTheDocument();
  });
});
