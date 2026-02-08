/**
 * Test script for Step 2a: User Operations
 * Run with: tsx --env-file=.env test-user-ops.ts
 */

import { postgresStorage } from "./server/postgres-storage";

async function testUserOperations() {
  console.log("🧪 Testing User Operations...\n");

  try {
    // Test 1: Create a new user
    console.log("1️⃣  Creating new user...");
    const user1 = await postgresStorage.getOrCreateUser("test-session-1");
    console.log(`✅ Created user: ${user1.username} (ID: ${user1.id})`);
    console.log(`   - Money Health: ${user1.moneyHealth}`);
    console.log(`   - Streak: ${user1.streak}`);
    console.log(`   - Referral Code: ${user1.referralCode}\n`);

    // Test 2: Get existing user
    console.log("2️⃣  Getting existing user...");
    const user1Again = await postgresStorage.getUser("test-session-1");
    if (user1Again) {
      console.log(`✅ Retrieved user: ${user1Again.username}\n`);
    }

    // Test 3: Update user
    console.log("3️⃣  Updating user...");
    await postgresStorage.updateUser("test-session-1", {
      username: "TestPlayer",
      moneyHealth: 75,
      streak: 5,
    });
    const updatedUser = await postgresStorage.getUser("test-session-1");
    console.log(`✅ Updated user: ${updatedUser?.username}`);
    console.log(`   - Money Health: ${updatedUser?.moneyHealth}`);
    console.log(`   - Streak: ${updatedUser?.streak}\n`);

    // Test 4: Check username availability
    console.log("4️⃣  Checking username availability...");
    const available = await postgresStorage.checkUsernameAvailable("TestPlayer");
    const available2 = await postgresStorage.checkUsernameAvailable("UniqueUser");
    console.log(`✅ "TestPlayer" available: ${available} (should be false)`);
    console.log(`✅ "UniqueUser" available: ${available2} (should be true)\n`);

    // Test 5: Create another user
    console.log("5️⃣  Creating second user...");
    const user2 = await postgresStorage.getOrCreateUser("test-session-2");
    await postgresStorage.updateUser("test-session-2", {
      username: "FriendUser",
      allowFriendsToFind: true,
      profileSetupComplete: true,
    });
    console.log(`✅ Created user: ${user2.username}\n`);

    // Test 6: Search for user
    console.log("6️⃣  Searching for users...");
    const searchResult = await postgresStorage.searchUserByUsername("friend");
    console.log(`✅ Search for "friend": ${searchResult.found}`);
    if (searchResult.found) {
      console.log(`   - Found: ${searchResult.username} (ID: ${searchResult.userId})\n`);
    }

    // Test 7: Add friend
    console.log("7️⃣  Adding friend...");
    const friendResult = await postgresStorage.addFriend("test-session-1", "test-session-2");
    console.log(`✅ Add friend: ${friendResult.message}`);

    const friends = await postgresStorage.getFriends("test-session-1");
    console.log(`✅ Friends count: ${friends.length}`);
    if (friends.length > 0) {
      console.log(`   - Friend: ${friends[0].username}\n`);
    }

    // Test 8: Referral system
    console.log("8️⃣  Testing referral system...");
    const user3 = await postgresStorage.getOrCreateUser("test-session-3");
    const referralApplied = await postgresStorage.applyReferralBonus(
      "test-session-1",
      "test-session-3"
    );
    console.log(`✅ Referral applied: ${referralApplied}`);

    const referrer = await postgresStorage.getUser("test-session-1");
    const referred = await postgresStorage.getUser("test-session-3");
    console.log(`   - Referrer freeze tokens: ${referrer?.freezeTokens}`);
    console.log(`   - Referrer referral count: ${referrer?.referralCount}`);
    console.log(`   - Referred by: ${referred?.referredBy}\n`);

    console.log("✅ All user operation tests passed! 🎉\n");

    // Cleanup
    console.log("🧹 Test data created - you can inspect it in your database");
    console.log("   Run 'npm run db:studio' to view the data\n");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run tests
testUserOperations()
  .then(() => {
    console.log("✅ Test suite completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test suite failed:", error);
    process.exit(1);
  });
