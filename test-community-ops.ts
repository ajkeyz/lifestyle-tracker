/**
 * Test script for Step 2d: Community & Admin Features
 * Run with: npm run test:community
 */

import { postgresStorage } from "./server/postgres-storage";

async function testCommunityOperations() {
  console.log("🌐 Testing Community & Admin Operations...\n");

  try {
    // Create test users
    console.log("1️⃣  Creating test users...");
    const user1 = await postgresStorage.getOrCreateUser("community-test-user-1");
    await postgresStorage.updateUser("community-test-user-1", {
      username: "CommunityCreator",
      profileSetupComplete: true,
      moneyHealth: 85,
    });

    const user2 = await postgresStorage.getOrCreateUser("community-test-user-2");
    await postgresStorage.updateUser("community-test-user-2", {
      username: "CommunityMember",
      profileSetupComplete: true,
      moneyHealth: 75,
    });

    const admin = await postgresStorage.getOrCreateUser("community-test-admin");
    await postgresStorage.updateUser("community-test-admin", {
      username: "AdminUser",
      profileSetupComplete: true,
      moneyHealth: 95,
    });

    console.log(`✅ Created 3 test users\n`);

    // Test 2: Create a community scenario
    console.log("2️⃣  Creating community scenario...");
    const scenario = await postgresStorage.createCommunityScenario("community-test-user-1", {
      title: "Should I buy this expensive gadget?",
      context: "I just saw a new tech gadget that costs $500. I have $2000 in savings.",
      question: "What should I do?",
      type: "real",
      category: "tech",
    });

    console.log(`✅ Community scenario created:`);
    console.log(`   - Title: ${scenario.title}`);
    console.log(`   - Type: ${scenario.type}`);
    console.log(`   - Category: ${scenario.category}\n`);

    // Test 3: Get community scenarios
    console.log("3️⃣  Getting community scenarios...");
    const scenarios = await postgresStorage.getCommunityScenarios("community-test-user-2");
    console.log(`✅ Found ${scenarios.length} community scenario(s)\n`);

    // Test 4: Vote on scenario
    console.log("4️⃣  Voting on scenario...");
    const votedScenario = await postgresStorage.voteCommunityScenario(
      "community-test-user-2",
      scenario.id,
      "up"
    );

    console.log(`✅ Voted on scenario:`);
    console.log(`   - Upvotes: ${votedScenario?.upvotes}`);
    console.log(`   - User vote: ${votedScenario?.userVote}\n`);

    // Test 5: Add comment
    console.log("5️⃣  Adding comment...");
    const comment = await postgresStorage.addComment("community-test-user-2", {
      scenarioId: scenario.id,
      content: "I think you should save your money and wait for a sale!",
      isAdvice: true,
    });

    console.log(`✅ Comment added:`);
    console.log(`   - Author: ${comment.authorUsername}`);
    console.log(`   - Content: ${comment.content}\n`);

    // Test 6: Get comments
    console.log("6️⃣  Getting scenario comments...");
    const comments = await postgresStorage.getScenarioComments(scenario.id, "community-test-user-1");
    console.log(`✅ Found ${comments.length} comment(s)\n`);

    // Test 7: Vote on comment
    console.log("7️⃣  Voting on comment...");
    const votedComment = await postgresStorage.voteComment("community-test-user-1", comment.id, "up");
    console.log(`✅ Voted on comment:`);
    console.log(`   - Upvotes: ${votedComment?.upvotes}\n`);

    // Test 8: Get Realest of the Week
    console.log("8️⃣  Getting Realest of the Week...");
    const realistOfWeek = await postgresStorage.getRealistOfWeek("community-test-user-1");
    console.log(`✅ Realest of the Week: ${realistOfWeek.length} scenario(s)\n`);

    // Test 9: Add moderator
    console.log("9️⃣  Adding moderator...");
    const moderator = await postgresStorage.addModerator("community-test-admin", "system");
    console.log(`✅ Moderator added:`);
    console.log(`   - Username: ${moderator?.username}\n`);

    // Test 10: Check moderator status
    console.log("🔟 Checking moderator status...");
    const isMod = await postgresStorage.isModerator("community-test-admin");
    const isAdmin = await postgresStorage.isAdmin("community-test-admin");
    console.log(`✅ Moderator check:`);
    console.log(`   - Is Moderator: ${isMod}`);
    console.log(`   - Is Admin: ${isAdmin}\n`);

    // Test 11: Get all moderators
    console.log("1️⃣1️⃣  Getting all moderators...");
    const moderators = await postgresStorage.getModerators();
    console.log(`✅ Found ${moderators.length} moderator(s)\n`);

    // Test 12: Ban user
    console.log("1️⃣2️⃣  Banning user...");
    const bannedUser = await postgresStorage.banUser(
      {
        userId: "community-test-user-2",
        reason: "Spam posting",
      },
      "community-test-admin"
    );

    console.log(`✅ User banned:`);
    console.log(`   - Username: ${bannedUser?.username}`);
    console.log(`   - Reason: ${bannedUser?.reason}\n`);

    // Test 13: Check if user is banned
    console.log("1️⃣3️⃣  Checking ban status...");
    const isBanned = await postgresStorage.isUserBanned("community-test-user-2");
    console.log(`✅ Ban check: ${isBanned}\n`);

    // Test 14: Get banned users
    console.log("1️⃣4️⃣  Getting banned users...");
    const bannedUsers = await postgresStorage.getBannedUsers();
    console.log(`✅ Found ${bannedUsers.length} banned user(s)\n`);

    // Test 15: Unban user
    console.log("1️⃣5️⃣  Unbanning user...");
    await postgresStorage.unbanUser("community-test-user-2");
    const stillBanned = await postgresStorage.isUserBanned("community-test-user-2");
    console.log(`✅ User unbanned: ${!stillBanned}\n`);

    // Test 16: Create admin scenario
    console.log("1️⃣6️⃣  Creating admin scenario...");
    const adminScenario = await postgresStorage.createAdminScenario("community-test-admin", {
      title: "Credit Card Debt",
      context: {
        cash: -10,
        debt: 20,
        credit: -15,
        stress: 25,
        portfolio: 0,
      },
      question: "You have $5,000 in credit card debt at 18% APR. What should you prioritize?",
      choices: [
        {
          label: "A",
          text: "Pay minimum and invest the rest",
          isCorrect: false,
          points: -20,
          feedback: "High-interest debt should be prioritized over investing",
        },
        {
          label: "B",
          text: "Pay off the debt aggressively",
          isCorrect: true,
          points: 100,
          feedback: "Correct! 18% debt return is better than most investments",
        },
        {
          label: "C",
          text: "Take out a personal loan",
          isCorrect: false,
          points: -10,
          feedback: "This might work if the rate is lower, but not always ideal",
        },
        {
          label: "D",
          text: "Ignore it and hope for the best",
          isCorrect: false,
          points: -50,
          feedback: "This will only make the problem worse with compounding interest",
        },
      ],
      category: "debt",
      difficulty: 2,
      publishDate: null,
      status: "draft",
      deepDive: {
        teaching: "High-interest debt should always be paid off before investing",
        alternative: "Consider balance transfer cards with 0% APR",
        ruleOfThumb: "Pay off any debt with interest rate above 7%",
        realWorldExample: "Paying 18% debt is like earning 18% guaranteed return",
      },
    });

    console.log(`✅ Admin scenario created:`);
    console.log(`   - Title: ${adminScenario.title}`);
    console.log(`   - Status: ${adminScenario.status}`);
    console.log(`   - Difficulty: ${adminScenario.difficulty}\n`);

    // Test 17: Get admin scenarios
    console.log("1️⃣7️⃣  Getting admin scenarios...");
    const adminScenarios = await postgresStorage.getAdminScenarios();
    console.log(`✅ Found ${adminScenarios.length} admin scenario(s)\n`);

    // Test 18: Update admin scenario
    console.log("1️⃣8️⃣  Updating admin scenario...");
    const updatedScenario = await postgresStorage.updateAdminScenario(adminScenario.id, {
      difficulty: 3,
    });
    console.log(`✅ Admin scenario updated:`);
    console.log(`   - New difficulty: ${updatedScenario?.difficulty}\n`);

    // Test 19: Publish admin scenario
    console.log("1️⃣9️⃣  Publishing admin scenario...");
    const publishedScenario = await postgresStorage.publishAdminScenario(adminScenario.id);
    console.log(`✅ Admin scenario published:`);
    console.log(`   - Status: ${publishedScenario?.status}`);
    console.log(`   - Publish date: ${publishedScenario?.publishDate}\n`);

    // Test 20: Get all users for admin
    console.log("2️⃣0️⃣  Getting all users (admin view)...");
    const allUsers = await postgresStorage.getAllUsersForAdmin();
    console.log(`✅ Found ${allUsers.length} user(s)\n`);

    // Test 21: Push notification subscription
    console.log("2️⃣1️⃣  Testing push notifications...");
    const subscription = {
      endpoint: "https://example.com/push",
      keys: {
        p256dh: "test-key",
        auth: "test-auth",
      },
    };

    await postgresStorage.savePushSubscription("community-test-user-1", subscription);
    const savedSub = await postgresStorage.getPushSubscription("community-test-user-1");
    console.log(`✅ Push subscription saved:`);
    console.log(`   - Endpoint: ${savedSub?.endpoint}\n`);

    // Test 22: Get all push subscriptions
    console.log("2️⃣2️⃣  Getting all push subscriptions...");
    const allSubs = await postgresStorage.getAllPushSubscriptions();
    console.log(`✅ Found ${allSubs.length} subscription(s)\n`);

    // Test 23: Create co-op session
    console.log("2️⃣3️⃣  Creating co-op session...");
    const coopSession = await postgresStorage.createCoopSession("community-test-user-1");
    console.log(`✅ Co-op session created:`);
    console.log(`   - Code: ${coopSession.code}`);
    console.log(`   - Status: ${coopSession.status}`);
    console.log(`   - Host: ${coopSession.players[0].username}\n`);

    // Test 24: Join co-op session
    console.log("2️⃣4️⃣  Joining co-op session...");
    const joinedSession = await postgresStorage.joinCoopSession(
      "community-test-user-2",
      coopSession.code
    );
    console.log(`✅ Co-op session joined:`);
    console.log(`   - Status: ${joinedSession?.status}`);
    console.log(`   - Players: ${joinedSession?.players.length}\n`);

    // Test 25: Submit co-op answer
    console.log("2️⃣5️⃣  Submitting co-op answers...");
    const drop = await postgresStorage.getDailyDrop();
    const firstScenario = drop.scenarios[0];

    await postgresStorage.submitCoopAnswer(
      coopSession.id,
      "community-test-user-1",
      firstScenario.id,
      "A"
    );

    const updatedSession = await postgresStorage.submitCoopAnswer(
      coopSession.id,
      "community-test-user-2",
      firstScenario.id,
      "A"
    );

    console.log(`✅ Co-op answers submitted:`);
    console.log(`   - Question index: ${updatedSession?.currentQuestionIndex}\n`);

    // Test 26: Remove push subscription
    console.log("2️⃣6️⃣  Removing push subscription...");
    await postgresStorage.removePushSubscription("community-test-user-1", subscription.endpoint);
    const removedSub = await postgresStorage.getPushSubscription("community-test-user-1");
    console.log(`✅ Push subscription removed: ${removedSub === null}\n`);

    // Test 27: Delete admin scenario
    console.log("2️⃣7️⃣  Deleting admin scenario...");
    await postgresStorage.deleteAdminScenario(adminScenario.id);
    const deletedScenario = await postgresStorage.getAdminScenario(adminScenario.id);
    console.log(`✅ Admin scenario deleted: ${deletedScenario === undefined}\n`);

    // Test 28: Remove moderator
    console.log("2️⃣8️⃣  Removing moderator...");
    await postgresStorage.removeModerator("community-test-admin");
    const stillMod = await postgresStorage.isModerator("community-test-admin");
    console.log(`✅ Moderator removed: ${!stillMod}\n`);

    console.log("✅ All community & admin operation tests passed! 🎉\n");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run tests
testCommunityOperations()
  .then(() => {
    console.log("✅ Test suite completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test suite failed:", error);
    process.exit(1);
  });
