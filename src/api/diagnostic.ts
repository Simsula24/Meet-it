import { pb } from './pocketbaseSetup';
import { fixAuthentication } from './pocketbaseSetup';

/**
 * Utility function to directly check friendships in the database
 */
export const checkFriendships = async (userId: string) => {
  try {
    console.log("DIAGNOSTIC: Checking friendships for user:", userId);
    
    // Ensure we're authenticated
    await fixAuthentication();
    console.log("DIAGNOSTIC: Authentication state:", pb.authStore.isValid ? "Valid" : "Invalid");
    
    // Check all friendships where the user is user1
    const asUser1 = await pb.collection('friendships').getList(1, 100, {
      filter: `user1="${userId}"`,
    });
    
    console.log("DIAGNOSTIC: Friendships as user1:", asUser1.totalItems);
    if (asUser1.totalItems > 0) {
      asUser1.items.forEach((item, index) => {
        console.log(`DIAGNOSTIC: [${index}] user1=${item.user1}, user2=${item.user2}, status=${item.status}`);
      });
    }
    
    // Check all friendships where the user is user2
    const asUser2 = await pb.collection('friendships').getList(1, 100, {
      filter: `user2="${userId}"`,
    });
    
    console.log("DIAGNOSTIC: Friendships as user2:", asUser2.totalItems);
    if (asUser2.totalItems > 0) {
      asUser2.items.forEach((item, index) => {
        console.log(`DIAGNOSTIC: [${index}] user1=${item.user1}, user2=${item.user2}, status=${item.status}`);
      });
    }
    
    // Check specifically pending friend requests
    const pendingRequests = await pb.collection('friendships').getList(1, 100, {
      filter: `user2="${userId}" && status="pending"`,
    });
    
    console.log("DIAGNOSTIC: Pending friend requests as receiver:", pendingRequests.totalItems);
    if (pendingRequests.totalItems > 0) {
      pendingRequests.items.forEach((item, index) => {
        console.log(`DIAGNOSTIC: [${index}] user1=${item.user1}, user2=${item.user2}, status=${item.status}`);
      });
    }
    
    return {
      asUser1: asUser1.items,
      asUser2: asUser2.items,
      pendingRequests: pendingRequests.items
    };
  } catch (error) {
    console.error("DIAGNOSTIC ERROR:", error);
    return null;
  }
};

/**
 * Utility function to check user details
 */
export const checkUserDetails = async (userId: string) => {
  try {
    console.log("DIAGNOSTIC: Checking user details for:", userId);
    
    const user = await pb.collection('users').getOne(userId);
    console.log("DIAGNOSTIC: User found:", user.id, user.name);
    
    return user;
  } catch (error) {
    console.error("DIAGNOSTIC ERROR:", error);
    return null;
  }
};

/**
 * Utility function to create a test friend request
 */
export const createTestFriendRequest = async (senderId: string, receiverId: string) => {
  try {
    console.log(`DIAGNOSTIC: Creating test friend request from ${senderId} to ${receiverId}`);
    
    const result = await pb.collection('friendships').create({
      user1: senderId,
      user2: receiverId,
      status: 'pending',
    });
    
    console.log("DIAGNOSTIC: Test friend request created:", result.id);
    return result;
  } catch (error) {
    console.error("DIAGNOSTIC ERROR:", error);
    return null;
  }
};

/**
 * Utility function to force display of pending friend requests by direct mapping
 */
export const forceShowPendingRequests = async (userId: string) => {
  try {
    console.log("DIAGNOSTIC: Force showing pending requests for user:", userId);
    
    // Ensure we're authenticated
    await fixAuthentication();
    console.log("DIAGNOSTIC: Authentication state:", pb.authStore.isValid ? "Valid" : "Invalid");
    
    // Get all friendships in the database
    const allFriendships = await pb.collection('friendships').getList(1, 100, {});
    console.log("DIAGNOSTIC: Total friendships found:", allFriendships.totalItems);
    
    // Filter for pending requests where this user is the receiver
    const pendingRequests = allFriendships.items.filter(
      item => item.user2 === userId && item.status === 'pending'
    );
    
    console.log("DIAGNOSTIC: Filtered pending requests:", pendingRequests.length);
    
    // For each request, get the sender details
    const mappedRequests = [];
    
    for (const item of pendingRequests) {
      let senderDetails = null;
      
      try {
        senderDetails = await pb.collection('users').getOne(item.user1);
        console.log("DIAGNOSTIC: Got sender details for", item.user1, "->", senderDetails.name);
      } catch (err) {
        console.error("DIAGNOSTIC: Failed to get sender details", err);
      }
      
      mappedRequests.push({
        id: item.id,
        sender: item.user1,
        receiver: item.user2,
        status: item.status,
        created: item.created,
        expand: {
          sender: senderDetails
        }
      });
    }
    
    console.log("DIAGNOSTIC: Final mapped requests:", mappedRequests.length);
    return mappedRequests;
  } catch (error) {
    console.error("DIAGNOSTIC ERROR:", error);
    return [];
  }
}; 