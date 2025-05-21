import { pb, fixAuthentication } from './pocketbaseSetup';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

/**
 * Send a friend request to a user based on their phone number
 */
export const sendFriendRequest = async (senderId: string, receiverPhone: string): Promise<any> => {
  try {
    console.log(`Attempting to send friend request from ${senderId} to phone ${receiverPhone}`);
    
    if (!senderId) {
      console.error('Invalid sender ID:', senderId);
      throw new Error('Invalid sender ID');
    }
    
    // First, check if user with this phone exists
    console.log('Searching for user with phone:', receiverPhone);
    const users = await pb.collection('users').getList(1, 1, {
      filter: `phone="${receiverPhone}"`,
    });
    
    console.log(`Found ${users.items.length} users with that phone number`);
    
    if (users.items.length === 0) {
      throw new Error('User with this phone number not found');
    }
    
    const receiverId = users.items[0].id;
    console.log('Found receiver ID:', receiverId);
    
    // Check if this is the same user
    if (senderId === receiverId) {
      throw new Error('You cannot send a friend request to yourself');
    }
    
    // Check if a friendship already exists
    const existingFriendships = await pb.collection('friendships').getList(1, 1, {
      filter: `(user1="${senderId}" && user2="${receiverId}") || (user1="${receiverId}" && user2="${senderId}")`,
    });
    
    if (existingFriendships.items.length > 0) {
      const status = existingFriendships.items[0].status;
      if (status === 'accepted') {
        throw new Error('You are already friends with this user');
      } else if (status === 'pending') {
        throw new Error('A friend request is already pending');
      } else if (status === 'rejected') {
        // Allow resending if previously rejected
        return await pb.collection('friendships').update(existingFriendships.items[0].id, {
          status: 'pending',
        });
      }
    }
    
    // Create new friendship record with pending status
    console.log(`Creating new friendship record with user1=${senderId}, user2=${receiverId}, status=pending`);
    const result = await pb.collection('friendships').create({
      user1: senderId,
      user2: receiverId,
      status: 'pending',
    });
    console.log('Friendship record created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
};

/**
 * Send a friend request to a user based on their user ID
 */
export const sendFriendRequestById = async (senderId: string, receiverId: string): Promise<any> => {
  try {
    console.log(`[FRIEND_REQUEST] Starting: sender=${senderId}, receiver=${receiverId}`);
    console.log(`[FRIEND_REQUEST] PocketBase instance:`, pb);
    console.log(`[FRIEND_REQUEST] Auth status:`, pb.authStore.isValid);
    console.log(`[FRIEND_REQUEST] Auth token:`, pb.authStore.token?.substring(0, 20) + "...");
    
    if (!senderId) {
      console.error('[FRIEND_REQUEST] Invalid sender ID:', senderId);
      throw new Error('Invalid sender ID');
    }
    
    if (!receiverId) {
      console.error('[FRIEND_REQUEST] Invalid receiver ID:', receiverId);
      throw new Error('Invalid receiver ID');
    }
    
    // Check if the user with this ID exists
    console.log('[FRIEND_REQUEST] Checking if receiver exists with ID:', receiverId);
    try {
      const receiver = await pb.collection('users').getOne(receiverId);
      console.log('[FRIEND_REQUEST] Receiver found successfully:', receiver.id);
    } catch (error) {
      console.error('[FRIEND_REQUEST] Receiver not found:', error);
      throw new Error('User with this ID not found');
    }
    
    // Check if this is the same user
    if (senderId === receiverId) {
      console.error('[FRIEND_REQUEST] Sender and receiver are the same user');
      throw new Error('You cannot send a friend request to yourself');
    }
    
    // Check if a friendship already exists
    console.log('[FRIEND_REQUEST] Checking for existing friendship');
    try {
      const existingFriendships = await pb.collection('friendships').getList(1, 1, {
        filter: `(user1="${senderId}" && user2="${receiverId}") || (user1="${receiverId}" && user2="${senderId}")`,
      });
      
      console.log(`[FRIEND_REQUEST] Found ${existingFriendships.items.length} existing friendships`);
      
      if (existingFriendships.items.length > 0) {
        const status = existingFriendships.items[0].status;
        console.log('[FRIEND_REQUEST] Existing friendship status:', status);
        
        if (status === 'accepted') {
          throw new Error('You are already friends with this user');
        } else if (status === 'pending') {
          throw new Error('A friend request is already pending');
        } else if (status === 'rejected') {
          // Allow resending if previously rejected
          console.log('[FRIEND_REQUEST] Updating rejected friendship to pending');
          return await pb.collection('friendships').update(existingFriendships.items[0].id, {
            status: 'pending',
          });
        }
      }
    } catch (error) {
      console.error('[FRIEND_REQUEST] Error checking existing friendship:', error);
      // Continue anyway to try creating the friendship
    }
    
    // Create new friendship record with pending status
    console.log('[FRIEND_REQUEST] Creating new friendship record');
    try {
      const result = await pb.collection('friendships').create({
        user1: senderId,
        user2: receiverId,
        status: 'pending',
      });
      console.log('[FRIEND_REQUEST] Friendship created successfully:', result);
      return result;
    } catch (error) {
      console.error('[FRIEND_REQUEST] Error creating friendship:', error);
      throw error;
    }
  } catch (error) {
    console.error('[FRIEND_REQUEST] Overall error in sendFriendRequestById:', error);
    throw error;
  }
};

/**
 * Get all pending friend requests for a user
 */
export const getPendingFriendRequests = async (userId: string): Promise<any[]> => {
  try {
    console.log("[GET_REQUESTS] Getting pending requests for user:", userId);
    
    // Make sure we're authenticated
    console.log("[GET_REQUESTS] Fixing authentication if needed");
    await fixAuthentication();
    console.log("[GET_REQUESTS] Authentication state after fix:", 
      pb.authStore.isValid ? 'Valid' : 'Invalid'
    );
    
    // Try direct database access with minimal filtering
    console.log("[GET_REQUESTS] Performing direct query to check all friendships");
    const allFriendships = await pb.collection('friendships').getList(1, 100, {});
    console.log("[GET_REQUESTS] All friendships in database:", allFriendships.totalItems);
    
    // Log all friendships to see what's available
    allFriendships.items.forEach((item, index) => {
      console.log(`[GET_REQUESTS] Friendship #${index}:`, {
        id: item.id,
        user1: item.user1,
        user2: item.user2,
        status: item.status
      });
    });
    
    // Get requests where this user is user2 (receiver)
    const filterQuery = `user2="${userId}" && status="pending"`;
    console.log("[GET_REQUESTS] Using filter:", filterQuery);
    
    // First get the basic requests
    const requests = await pb.collection('friendships').getList(1, 100, {
      filter: filterQuery,
      expand: 'user1',
    });
    
    console.log("[GET_REQUESTS] Total pending requests found:", requests.totalItems);
    
    // Process each request and ensure we have the sender details
    const mappedRequests = [];
    
    for (const item of requests.items) {
      console.log(`[GET_REQUESTS] Processing request:`, {
        id: item.id,
        user1: item.user1,
        user2: item.user2,
        status: item.status,
        expand: item.expand ? 'present' : 'missing'
      });
      
      // If expand is missing, fetch the user directly
      let senderDetails = item.expand?.user1;
      
      if (!senderDetails) {
        try {
          console.log(`[GET_REQUESTS] Expand missing, fetching user directly:`, item.user1);
          senderDetails = await pb.collection('users').getOne(item.user1);
          console.log(`[GET_REQUESTS] Fetched user:`, senderDetails.id, senderDetails.name);
        } catch (err) {
          console.error(`[GET_REQUESTS] Failed to fetch user:`, err);
        }
      }
      
      // Now map the request with the sender details
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
    
    console.log("[GET_REQUESTS] Final mapped results:", mappedRequests.length);
    
    return mappedRequests;
  } catch (error) {
    console.error('Error fetching pending friend requests:', error);
    throw error;
  }
};

/**
 * Accept a friend request
 */
export const acceptFriendRequest = async (requestId: string): Promise<any> => {
  try {
    return await pb.collection('friendships').update(requestId, {
      status: 'accepted',
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
};

/**
 * Reject a friend request
 */
export const rejectFriendRequest = async (requestId: string): Promise<any> => {
  try {
    return await pb.collection('friendships').update(requestId, {
      status: 'rejected',
    });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    throw error;
  }
};

/**
 * Get all friends for a user
 */
export const getUserFriends = async (userId: string): Promise<User[]> => {
  try {
    // Get friendships where user1 is the current user and status is accepted
    const friends1 = await pb.collection('friendships').getList(1, 100, {
      filter: `user1="${userId}" && status="accepted"`,
      expand: 'user2',
    });
    
    // Get friendships where user2 is the current user and status is accepted
    const friends2 = await pb.collection('friendships').getList(1, 100, {
      filter: `user2="${userId}" && status="accepted"`,
      expand: 'user1',
    });
    
    // Combine and extract friend records
    const friendsList = [
      ...friends1.items.map(item => item.expand?.user2),
      ...friends2.items.map(item => item.expand?.user1),
    ].filter(Boolean) as User[];
    
    return friendsList;
  } catch (error) {
    console.error('Error fetching user friends:', error);
    throw error;
  }
};

/**
 * Remove a friend
 */
export const removeFriend = async (userId: string, friendId: string): Promise<boolean> => {
  try {
    // Find the friendship record
    const friendships = await pb.collection('friendships').getList(1, 1, {
      filter: `(user1="${userId}" && user2="${friendId}") || (user1="${friendId}" && user2="${userId}")`,
    });
    
    if (friendships.items.length === 0) {
      throw new Error('Friendship not found');
    }
    
    // Delete the friendship record
    await pb.collection('friendships').delete(friendships.items[0].id);
    return true;
  } catch (error) {
    console.error('Error removing friend:', error);
    throw error;
  }
};

/**
 * Search users by email
 */
export const searchUsersByEmail = async (emailQuery: string): Promise<User[]> => {
  try {
    const users = await pb.collection('users').getList(1, 20, {
      filter: `email ~ "${emailQuery}"`,
    });
    
    return users.items.map(item => ({
      id: item.id,
      name: item.name,
      email: item.email,
      avatar: item.avatar
    })) as User[];
  } catch (error) {
    console.error('Error searching users by email:', error);
    throw error;
  }
};

/**
 * Check if two users are friends
 */
export const checkIfFriends = async (userId1: string, userId2: string): Promise<boolean> => {
  try {
    const friendships = await pb.collection('friendships').getList(1, 1, {
      filter: `((user1="${userId1}" && user2="${userId2}") || (user1="${userId2}" && user2="${userId1}")) && status="accepted"`,
    });
    
    return friendships.items.length > 0;
  } catch (error) {
    console.error('Error checking friendship status:', error);
    return false;
  }
};

/**
 * Utility function to test PocketBase connection directly
 */
export const testPocketBaseConnection = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    console.log('[TEST] Testing PocketBase connection...');
    console.log('[TEST] PocketBase URL:', pb.baseUrl);
    console.log('[TEST] Auth status:', pb.authStore.isValid ? 'Valid' : 'Invalid');
    
    // Test 1: Check if we can access collections list
    try {
      console.log('[TEST] Attempting to list collections...');
      const collections = await pb.collections.getList(1, 10);
      console.log('[TEST] Successfully retrieved collections:', collections.items.map(c => c.name).join(', '));
    } catch (error) {
      console.error('[TEST] Failed to list collections:', error);
      return {
        success: false,
        message: 'Failed to list collections',
        details: error
      };
    }
    
    // Test 2: Check if we can access users collection
    try {
      console.log('[TEST] Attempting to access users collection...');
      const users = await pb.collection('users').getList(1, 1);
      console.log('[TEST] Successfully accessed users collection:', users.totalItems, 'total users');
    } catch (error) {
      console.error('[TEST] Failed to access users collection:', error);
      return {
        success: false,
        message: 'Failed to access users collection',
        details: error
      };
    }
    
    // Test 3: Check if we can access friendships collection
    try {
      console.log('[TEST] Attempting to access friendships collection...');
      const friendships = await pb.collection('friendships').getList(1, 1);
      console.log('[TEST] Successfully accessed friendships collection:', friendships.totalItems, 'total friendships');
    } catch (error) {
      console.error('[TEST] Failed to access friendships collection:', error);
      return {
        success: false,
        message: 'Failed to access friendships collection',
        details: error
      };
    }
    
    return {
      success: true,
      message: 'Successfully connected to PocketBase and accessed all required collections'
    };
  } catch (error) {
    console.error('[TEST] Overall error in PocketBase connection test:', error);
    return {
      success: false,
      message: 'Failed to test PocketBase connection',
      details: error
    };
  }
};

/**
 * Send a friend request by ID with minimized permission requirements
 * This version doesn't try to check existing friendships first, which requires List privileges
 */
export const createDirectFriendRequest = async (senderId: string, receiverId: string): Promise<any> => {
  try {
    console.log('[DIRECT_REQUEST] Starting direct friend request creation');
    console.log('[DIRECT_REQUEST] Sender:', senderId, 'Receiver:', receiverId);
    
    if (!senderId || !receiverId) {
      throw new Error('Invalid sender or receiver ID');
    }
    
    // Skip checking for existing relationships - that requires List access
    // Just try to create the friendship directly
    try {
      console.log('[DIRECT_REQUEST] Creating friendship record directly');
      console.log('[DIRECT_REQUEST] Data:', { user1: senderId, user2: receiverId, status: 'pending' });
      
      const result = await pb.collection('friendships').create({
        user1: senderId,
        user2: receiverId,
        status: 'pending',
      });
      
      console.log('[DIRECT_REQUEST] Friendship created successfully:', result.id);
      console.log('[DIRECT_REQUEST] Complete record:', JSON.stringify(result, null, 2));
      return result;
    } catch (error: any) {
      // Check if it's a unique constraint error - this would indicate the friendship already exists
      if (error.status === 400 && error.data?.data?.user2?.code === 'validation_not_unique') {
        console.log('[DIRECT_REQUEST] Friendship already exists');
        throw new Error('A friendship or request already exists with this user');
      }
      
      console.error('[DIRECT_REQUEST] Error creating friendship:', error);
      throw error;
    }
  } catch (error) {
    console.error('[DIRECT_REQUEST] Overall error in direct friend request:', error);
    throw error;
  }
};

/**
 * Direct method to find a user by phone number
 * This uses a direct GET request with a filter which requires less permissions than listing
 */
export const findUserByPhone = async (phone: string): Promise<string | null> => {
  try {
    console.log('[DIRECT_PHONE] Looking up user with phone:', phone);
    
    // Use the filter API which might work with lower permissions
    const response = await pb.send('/api/collections/users/records', {
      method: 'GET',
      params: {
        filter: `phone="${phone}"`,
        fields: 'id,name,phone',
        perPage: 1
      }
    });
    
    console.log('[DIRECT_PHONE] Response:', response);
    
    if (response && response.items && response.items.length > 0) {
      console.log('[DIRECT_PHONE] Found user:', response.items[0].id);
      return response.items[0].id;
    }
    
    console.log('[DIRECT_PHONE] No user found with that phone number');
    return null;
  } catch (error) {
    console.error('[DIRECT_PHONE] Error finding user by phone:', error);
    return null;
  }
};

/**
 * Direct method to send friend request by phone
 */
export const createDirectFriendRequestByPhone = async (senderId: string, receiverPhone: string): Promise<any> => {
  try {
    console.log('[DIRECT_PHONE_REQ] Starting direct friend request by phone');
    
    // Get receiver ID from phone
    const receiverId = await findUserByPhone(receiverPhone);
    
    if (!receiverId) {
      throw new Error('User with this phone number not found');
    }
    
    // Use the direct method we created earlier
    return await createDirectFriendRequest(senderId, receiverId);
  } catch (error) {
    console.error('[DIRECT_PHONE_REQ] Error in direct friend request by phone:', error);
    throw error;
  }
}; 