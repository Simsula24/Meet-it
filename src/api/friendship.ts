import { pb, fixAuthentication } from './pocketbaseSetup';

// Types
export interface UserRecord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export interface FriendshipRecord {
  id: string;
  user1: string;      // Always the sender of the request
  user2: string;      // Always the recipient of the request
  status: 'pending' | 'accepted' | 'rejected';
  created: string;
  updated: string;
  expand?: {
    user1?: UserRecord;
    user2?: UserRecord;
  };
}

export interface Friend {
  id: string;         // The friendship record ID
  user: UserRecord;   // The friend's user record
  created: string;    // When the friendship was created
}

export interface FriendRequest {
  id: string;         // The friendship record ID
  sender: UserRecord; // The user who sent the request (user1)
  created: string;    // When the request was created
}

// Type alias for PocketBase responses
type PBFriendshipRecord = {
  id: string;
  user1: string;
  user2: string;
  status: 'pending' | 'accepted' | 'rejected';
  created: string;
  updated: string;
  expand?: {
    user1?: UserRecord;
    user2?: UserRecord;
  };
  [key: string]: any;
};

/**
 * Get all friends for a user (all accepted friendships)
 */
export const getFriends = async (userId: string): Promise<Friend[]> => {
  try {
    // Ensure we're authenticated before making any requests
    const authResult = await fixAuthentication();
    console.log(`[FRIENDSHIP] Authentication status before getFriends: ${authResult ? 'Fixed' : 'Not fixed'}`);
    
    if (!pb.authStore.isValid) {
      console.error(`[FRIENDSHIP] Failed to authenticate before getFriends`);
      return [];
    }
    
    console.log(`[FRIENDSHIP] Getting friends for user ${userId}`);
    
    // Get all accepted friendships where the user is either user1 or user2
    const response = await pb.collection('friendships').getList(1, 100, {
      filter: `(user1="${userId}" || user2="${userId}") && status="accepted"`,
      expand: 'user1,user2',
      sort: '-created'
    });
    
    console.log(`[FRIENDSHIP] Found ${response.totalItems} friendships`);
    
    // Transform the data to return a consistent format
    const friends: Friend[] = response.items.map(item => {
      const friendship = item as unknown as PBFriendshipRecord;
      
      // Figure out which user in the friendship is the friend (not the current user)
      const isUser1 = friendship.user1 === userId;
      const friendId = isUser1 ? friendship.user2 : friendship.user1;
      let friendData = isUser1 ? friendship.expand?.user2 : friendship.expand?.user1;
      
      // If expand didn't work, use minimal data
      if (!friendData) {
        friendData = { id: friendId, name: 'Unknown User' };
      }
      
      return {
        id: friendship.id,
        user: friendData as UserRecord,
        created: friendship.created
      };
    });
    
    return friends;
  } catch (error) {
    console.error('[FRIENDSHIP] Error getting friends:', error);
    return [];
  }
};

/**
 * Get all pending friend requests for a user (where user is the recipient)
 */
export const getPendingFriendRequests = async (userId: string): Promise<FriendRequest[]> => {
  try {
    // Ensure we're authenticated before making any requests
    const authResult = await fixAuthentication();
    console.log(`[FRIENDSHIP] Authentication status before getPendingFriendRequests: ${authResult ? 'Fixed' : 'Not fixed'}`);
    
    if (!pb.authStore.isValid) {
      console.error(`[FRIENDSHIP] Failed to authenticate before getPendingFriendRequests`);
      return [];
    }
    
    console.log(`[FRIENDSHIP] Getting pending friend requests for user ${userId}`);
    
    // Get all pending friendships where the user is the recipient (user2)
    const response = await pb.collection('friendships').getList(1, 50, {
      filter: `user2="${userId}" && status="pending"`,
      expand: 'user1',
      sort: '-created'
    });
    
    console.log(`[FRIENDSHIP] Found ${response.totalItems} pending requests`);
    
    // If no records found, log additional debug info
    if (response.totalItems === 0) {
      console.log(`[FRIENDSHIP] No pending requests found, checking with direct query...`);
      try {
        const directResponse = await pb.collection('friendships').getList(1, 50, {
          filter: `user2="${userId}" && status="pending"`,
        });
        console.log(`[FRIENDSHIP] Direct query found ${directResponse.totalItems} pending requests`);
        
        if (directResponse.totalItems > 0) {
          console.log(`[FRIENDSHIP] Found requests but expand failed. First record: ${JSON.stringify(directResponse.items[0])}`);
        }
      } catch (err) {
        console.error(`[FRIENDSHIP] Error in direct query fallback:`, err);
      }
    }
    
    // Transform the data to return a consistent format
    const requests: FriendRequest[] = await Promise.all(
      response.items.map(async (item) => {
        const friendship = item as unknown as PBFriendshipRecord;
        
        // The sender is always user1 in a pending request
        let senderData = friendship.expand?.user1;
        
        // If expand didn't work, fetch the sender data
        if (!senderData) {
          try {
            console.log(`[FRIENDSHIP] Expand failed for user1=${friendship.user1}, fetching directly...`);
            senderData = await pb.collection('users').getOne(friendship.user1);
          } catch (err) {
            console.error(`[FRIENDSHIP] Error fetching sender ${friendship.user1}:`, err);
            senderData = { id: friendship.user1, name: 'Unknown User' };
          }
        }
        
        return {
          id: friendship.id,
          sender: senderData as UserRecord,
          created: friendship.created
        };
      })
    );
    
    return requests;
  } catch (error) {
    console.error('[FRIENDSHIP] Error getting friend requests:', error);
    return [];
  }
};

/**
 * Send a friend request to another user
 */
export const sendFriendRequest = async (senderId: string, receiverId: string): Promise<FriendshipRecord> => {
  try {
    await fixAuthentication();
    console.log(`[FRIENDSHIP] Sending friend request from ${senderId} to ${receiverId}`);
    
    // Validate input
    if (!senderId || !receiverId) {
      throw new Error('Both sender and receiver IDs are required');
    }
    
    if (senderId === receiverId) {
      throw new Error('Cannot send a friend request to yourself');
    }
    
    // Check if a friendship already exists
    const existingResponse = await pb.collection('friendships').getList(1, 1, {
      filter: `(user1="${senderId}" && user2="${receiverId}") || (user1="${receiverId}" && user2="${senderId}")`
    });
    
    if (existingResponse.totalItems > 0) {
      const existing = existingResponse.items[0] as unknown as PBFriendshipRecord;
      
      if (existing.status === 'accepted') {
        throw new Error('You are already friends with this user');
      }
      
      if (existing.status === 'pending') {
        // If the receiver already sent a request to the sender, accept it
        if (existing.user1 === receiverId && existing.user2 === senderId) {
          return await acceptFriendRequest(existing.id);
        }
        throw new Error('A friend request is already pending');
      }
      
      if (existing.status === 'rejected') {
        // Update the rejected request to pending
        const updated = await pb.collection('friendships').update(existing.id, {
          user1: senderId,
          user2: receiverId,
          status: 'pending'
        });
        return updated as unknown as FriendshipRecord;
      }
    }
    
    // Create a new friendship request
    const data = {
      user1: senderId,     // Sender
      user2: receiverId,   // Receiver
      status: 'pending'
    };
    
    const result = await pb.collection('friendships').create(data);
    console.log(`[FRIENDSHIP] Friend request created with ID: ${result.id}`);
    
    return result as unknown as FriendshipRecord;
  } catch (error) {
    console.error('[FRIENDSHIP] Error sending friend request:', error);
    throw error;
  }
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (requestId: string): Promise<FriendshipRecord> => {
  try {
    await fixAuthentication();
    console.log(`[FRIENDSHIP] Accepting friend request ${requestId}`);
    
    const result = await pb.collection('friendships').update(requestId, {
      status: 'accepted'
    });
    
    console.log(`[FRIENDSHIP] Friend request ${requestId} accepted`);
    return result as unknown as FriendshipRecord;
  } catch (error) {
    console.error('[FRIENDSHIP] Error accepting friend request:', error);
    throw error;
  }
};

/**
 * Reject a friend request
 */
export const rejectFriendRequest = async (requestId: string): Promise<FriendshipRecord> => {
  try {
    await fixAuthentication();
    console.log(`[FRIENDSHIP] Rejecting friend request ${requestId}`);
    
    const result = await pb.collection('friendships').update(requestId, {
      status: 'rejected'
    });
    
    console.log(`[FRIENDSHIP] Friend request ${requestId} rejected`);
    return result as unknown as FriendshipRecord;
  } catch (error) {
    console.error('[FRIENDSHIP] Error rejecting friend request:', error);
    throw error;
  }
};

/**
 * Remove a friendship (update status to rejected)
 */
export const removeFriend = async (friendshipId: string): Promise<boolean> => {
  try {
    await fixAuthentication();
    console.log(`[FRIENDSHIP] Removing friendship ${friendshipId}`);
    
    await pb.collection('friendships').update(friendshipId, {
      status: 'rejected'
    });
    
    console.log(`[FRIENDSHIP] Friendship ${friendshipId} removed`);
    return true;
  } catch (error) {
    console.error('[FRIENDSHIP] Error removing friend:', error);
    return false;
  }
};

/**
 * Search for users to add as friends
 */
export const searchUsers = async (query: string, currentUserId: string): Promise<UserRecord[]> => {
  try {
    await fixAuthentication();
    console.log(`[FRIENDSHIP] Searching users with query: ${query}`);
    
    if (!query || query.length < 1) {
      return [];
    }
    
    // Use standard filter syntax that works reliably in PocketBase
    // The '~' operator performs case-insensitive search
    const filterString = `(name ~ "${query}" || email ~ "${query}") && id != "${currentUserId}"`;
    console.log(`[FRIENDSHIP] Using filter: ${filterString}`);
    
    const response = await pb.collection('users').getList(1, 10, {
      filter: filterString,
    });
    
    console.log(`[FRIENDSHIP] Found ${response.totalItems} users matching query`);
    
    if (response.totalItems === 0) {
      // If no results, try to get some users to check if the collection has data
      try {
        const anyUsers = await pb.collection('users').getList(1, 3, {});
        console.log(`[FRIENDSHIP] Database check: Found ${anyUsers.totalItems} total users in database`);
      } catch (err) {
        console.error('[FRIENDSHIP] Error checking for any users:', err);
      }
    }
    
    // Transform to UserRecord format
    return response.items.map(item => ({
      id: item.id,
      name: item.name,
      email: item.email,
      phone: item.phone,
      avatar: item.avatar
    }));
  } catch (error) {
    console.error('[FRIENDSHIP] Error searching users:', error);
    console.error('[FRIENDSHIP] Error details:', JSON.stringify(error));
    return [];
  }
};

/**
 * Check friendship status between two users
 */
export const checkFriendshipStatus = async (user1Id: string, user2Id: string): Promise<'none' | 'pending_sent' | 'pending_received' | 'friends' | 'rejected'> => {
  try {
    await fixAuthentication();
    console.log(`[FRIENDSHIP] Checking friendship status between ${user1Id} and ${user2Id}`);
    
    const response = await pb.collection('friendships').getList(1, 1, {
      filter: `(user1="${user1Id}" && user2="${user2Id}") || (user1="${user2Id}" && user2="${user1Id}")`
    });
    
    if (response.totalItems === 0) {
      return 'none';
    }
    
    const friendship = response.items[0] as unknown as PBFriendshipRecord;
    
    if (friendship.status === 'accepted') {
      return 'friends';
    } 
    
    if (friendship.status === 'rejected') {
      return 'rejected';
    }
    
    if (friendship.status === 'pending') {
      // If user1 sent the request to user2
      if (friendship.user1 === user1Id && friendship.user2 === user2Id) {
        return 'pending_sent';
      } else {
        return 'pending_received';
      }
    }
    
    return 'none';
  } catch (error) {
    console.error('[FRIENDSHIP] Error checking friendship status:', error);
    return 'none';
  }
}; 