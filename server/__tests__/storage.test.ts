/**
 * @jest-environment node
 */
import { MemStorage } from '../storage';

describe('MemStorage', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  describe('User Operations', () => {
    it('creates a new user with default values', async () => {
      const user = await storage.getOrCreateUser('test-session-1');

      expect(user).toBeDefined();
      expect(user.id).toBe('test-session-1');
      expect(user.username).toMatch(/^Player\d{1,4}$/);
      expect(user.membershipTier).toBe('free');
      expect(user.moneyHealth).toBe(50);
      expect(user.streak).toBe(0);
      expect(user.gamesPlayed).toBe(0);
    });

    it('returns existing user on subsequent calls', async () => {
      const user1 = await storage.getOrCreateUser('test-session-2');
      const user2 = await storage.getOrCreateUser('test-session-2');

      expect(user1.id).toBe(user2.id);
      expect(user1.username).toBe(user2.username);
    });

    it('updates user successfully', async () => {
      await storage.getOrCreateUser('test-session-3');

      const updatedUser = await storage.updateUser('test-session-3', {
        username: 'NewUsername',
        moneyHealth: 80,
      });

      expect(updatedUser).toBeDefined();
      expect(updatedUser!.username).toBe('NewUsername');
      expect(updatedUser!.moneyHealth).toBe(80);
    });

    it('checks username availability correctly', async () => {
      await storage.getOrCreateUser('test-session-4');
      await storage.updateUser('test-session-4', { username: 'TakenUsername' });

      const isAvailable = await storage.checkUsernameAvailable('TakenUsername');
      const isAvailableNew = await storage.checkUsernameAvailable('NewUsername');

      expect(isAvailable).toBe(false);
      expect(isAvailableNew).toBe(true);
    });
  });

  describe('Leaderboard', () => {
    it('returns leaderboard sorted by money health', async () => {
      // Create users with different money health
      await storage.getOrCreateUser('user-1');
      await storage.updateUser('user-1', { moneyHealth: 90, username: 'TopPlayer' });

      await storage.getOrCreateUser('user-2');
      await storage.updateUser('user-2', { moneyHealth: 70, username: 'MidPlayer' });

      const leaderboard = await storage.getLeaderboard(10);

      expect(leaderboard.length).toBeGreaterThan(0);
      expect(leaderboard[0].moneyHealth).toBeGreaterThanOrEqual(leaderboard[1]?.moneyHealth || 0);
    });

    it('respects the limit parameter', async () => {
      const leaderboard = await storage.getLeaderboard(3);

      expect(leaderboard.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Friends', () => {
    it('adds friend successfully', async () => {
      await storage.getOrCreateUser('user-a');
      await storage.getOrCreateUser('user-b');

      const result = await storage.addFriend('user-a', 'user-b');

      expect(result.success).toBe(true);

      const userA = await storage.getUser('user-a');
      expect(userA!.friendIds).toContain('user-b');
    });

    it('prevents adding yourself as friend', async () => {
      await storage.getOrCreateUser('user-c');

      const result = await storage.addFriend('user-c', 'user-c');

      expect(result.success).toBe(false);
      expect(result.message).toContain('yourself');
    });

    it('prevents duplicate friendships', async () => {
      await storage.getOrCreateUser('user-d');
      await storage.getOrCreateUser('user-e');

      await storage.addFriend('user-d', 'user-e');
      const result = await storage.addFriend('user-d', 'user-e');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Already friends');
    });
  });
});
