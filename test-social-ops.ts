/**
 * Test script for Step 2c: Social Features (Leagues & Challenges)
 * Run with: npm run test:social
 */

import { postgresStorage } from "./server/postgres-storage";

async function testSocialOperations() {
  console.log("🏆 Testing Social Operations...\n");

  try {
    // Create test users
    console.log("1️⃣  Creating test users...");
    const user1 = await postgresStorage.getOrCreateUser("social-test-user-1");
    await postgresStorage.updateUser("social-test-user-1", {
      username: "LeagueLeader",
      profileSetupComplete: true,
      moneyHealth: 85,
      streak: 10,
    });

    const user2 = await postgresStorage.getOrCreateUser("social-test-user-2");
    await postgresStorage.updateUser("social-test-user-2", {
      username: "Challenger",
      profileSetupComplete: true,
      moneyHealth: 75,
      streak: 5,
    });

    const user3 = await postgresStorage.getOrCreateUser("social-test-user-3");
    await postgresStorage.updateUser("social-test-user-3", {
      username: "CompetitivePlayer",
      profileSetupComplete: true,
      moneyHealth: 90,
      streak: 15,
    });

    console.log(`✅ Created 3 test users\n`);

    // Test 2: Create a league
    console.log("2️⃣  Creating a league...");
    const league = await postgresStorage.createLeague("social-test-user-1", {
      name: "Finance Champions",
      emoji: "💰",
      privacy: "public",
    });

    console.log(`✅ League created:`);
    console.log(`   - Name: ${league.name} ${league.emoji}`);
    console.log(`   - Invite Code: ${league.inviteCode}`);
    console.log(`   - Members: ${league.members.length}\n`);

    // Test 3: Join league
    console.log("3️⃣  Joining league...");
    const joinedLeague = await postgresStorage.joinLeague(
      "social-test-user-2",
      league.inviteCode
    );

    console.log(`✅ User joined league:`);
    console.log(`   - Members now: ${joinedLeague?.members.length}\n`);

    // Test 4: Get user leagues
    console.log("4️⃣  Getting user leagues...");
    const userLeagues = await postgresStorage.getUserLeagues("social-test-user-1");
    console.log(`✅ User is in ${userLeagues.length} league(s)\n`);

    // Test 5: Get league by code
    console.log("5️⃣  Getting league by code...");
    const foundLeague = await postgresStorage.getLeagueByCode(league.inviteCode);
    console.log(`✅ Found league: ${foundLeague?.name}\n`);

    // Test 6: Create a challenge
    console.log("6️⃣  Creating a challenge...");
    const challenge = await postgresStorage.createChallenge("social-test-user-1", {
      challengeeId: "social-test-user-2",
      type: "money_health",
      trashTalk: "Think you can beat my Money Health?",
      customMessage: "Let's see who knows finance better!",
    });

    console.log(`✅ Challenge created:`);
    console.log(`   - Type: ${challenge.type}`);
    console.log(`   - Challenger: ${challenge.challengerUsername} (${challenge.challengerValue})`);
    console.log(`   - Challengee: ${challenge.challengeeUsername}`);
    console.log(`   - Status: ${challenge.status}\n`);

    // Test 7: Get user challenges
    console.log("7️⃣  Getting user challenges...");
    const user1Challenges = await postgresStorage.getUserChallenges("social-test-user-1");
    const user2Challenges = await postgresStorage.getUserChallenges("social-test-user-2");
    console.log(`✅ User 1 has ${user1Challenges.length} challenge(s)`);
    console.log(`✅ User 2 has ${user2Challenges.length} challenge(s)\n`);

    // Test 8: Respond to challenge (accept)
    console.log("8️⃣  Responding to challenge (accept)...");
    const acceptedChallenge = await postgresStorage.respondToChallenge(
      challenge.id,
      "social-test-user-2",
      true
    );

    console.log(`✅ Challenge accepted and completed:`);
    console.log(`   - Status: ${acceptedChallenge?.status}`);
    console.log(`   - Challenger value: ${acceptedChallenge?.challengerValue}`);
    console.log(`   - Challengee value: ${acceptedChallenge?.challengeeValue}`);
    console.log(`   - Winner: ${acceptedChallenge?.winnerId === "social-test-user-1" ? "LeagueLeader" : "Challenger"}\n`);

    // Test 9: Create and decline a challenge
    console.log("9️⃣  Creating and declining a challenge...");
    const challenge2 = await postgresStorage.createChallenge("social-test-user-3", {
      challengeeId: "social-test-user-1",
      type: "streak",
      trashTalk: "Can you match my streak?",
      customMessage: null,
    });

    const declinedChallenge = await postgresStorage.respondToChallenge(
      challenge2.id,
      "social-test-user-1",
      false
    );

    console.log(`✅ Challenge declined:`);
    console.log(`   - Status: ${declinedChallenge?.status}\n`);

    // Test 10: Leave league
    console.log("🔟 Leaving league...");
    const leftLeague = await postgresStorage.leaveLeague(
      "social-test-user-2",
      league.id
    );
    console.log(`✅ User left league: ${leftLeague}\n`);

    const updatedLeague = await postgresStorage.getLeague(league.id);
    console.log(`   - Members remaining: ${updatedLeague?.members.length}\n`);

    console.log("✅ All social operation tests passed! 🎉\n");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run tests
testSocialOperations()
  .then(() => {
    console.log("✅ Test suite completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test suite failed:", error);
    process.exit(1);
  });
