import { pb } from './pocketbase';

// Mock data
const mockUsers = [
  { 
    id: 'user1', 
    name: 'John Doe',
    phone: '1234567890',
    avatar: null 
  },
  { 
    id: 'user2', 
    name: 'Jane Smith',
    phone: '9876543210',
    avatar: null 
  },
  { 
    id: 'user3', 
    name: 'Bob Johnson',
    phone: '5551234567',
    avatar: null 
  }
];

const mockFriendRequests = [
  {
    id: 'freq1',
    sender: 'user2',
    receiver: 'user1',
    status: 'pending',
    expand: {
      sender: mockUsers[1]
    }
  }
];

const mockFriends = [
  {
    id: 'friend1',
    user1: 'user1',
    user2: 'user3',
    expand: {
      user1: mockUsers[0],
      user2: mockUsers[2]
    }
  }
];

// Use mock data for development
const USE_MOCK = true;

// Send a friend request
export const sendFriendRequest = async (senderId: string, receiverPhone: string) => {
  try {
    if (USE_MOCK) {
      // Find user with this phone
      const receiver = mockUsers.find(u => u.phone === receiverPhone);
      if (!receiver) {
        throw new Error('User with this phone number not found');
      }
      
      const receiverId = receiver.id;
      
      // Check if a friend request already exists
      const existingRequest = mockFriendRequests.find(
        fr => (fr.sender === senderId && fr.receiver === receiverId) || 
              (fr.sender === receiverId && fr.receiver === senderId)
      );
      
      if (existingRequest) {
        throw new Error('A friend request already exists between these users');
      }
      
      // Check if they are already friends
      const existingFriend = mockFriends.find(
        f => (f.user1 === senderId && f.user2 === receiverId) || 
             (f.user1 === receiverId && f.user2 === senderId)
      );
      
      if (existingFriend) {
        throw new Error('These users are already friends');
      }
      
      // Find sender user (must exist)
      const sender = mockUsers.find(u => u.id === senderId);
      if (!sender) {
        throw new Error('Sender user not found');
      }
      
      // Create friend request
      const newRequest = {
        id: `freq${mockFriendRequests.length + 1}`,
        sender: senderId,
        receiver: receiverId,
        status: 'pending',
        expand: {
          sender: sender
        }
      };
      
      mockFriendRequests.push(newRequest);
      
      // Simulate latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return newRequest;
    }
    
    // First, check if user with this phone exists
    const users = await pb.collection('users').getList(1, 1, {
      filter: `phone="${receiverPhone}"`,
    });
    
    if (users.items.length === 0) {
      throw new Error('User with this phone number not found');
    }
    
    const receiverId = users.items[0].id;
    
    // Check if a friend request already exists
    const existingRequests = await pb.collection('friend_requests').getList(1, 1, {
      filter: `(sender="${senderId}" && receiver="${receiverId}") || (sender="${receiverId}" && receiver="${senderId}")`,
    });
    
    if (existingRequests.items.length > 0) {
      throw new Error('A friend request already exists between these users');
    }
    
    // Check if they are already friends
    const existingFriends = await pb.collection('friends').getList(1, 1, {
      filter: `(user1="${senderId}" && user2="${receiverId}") || (user1="${receiverId}" && user2="${senderId}")`,
    });
    
    if (existingFriends.items.length > 0) {
      throw new Error('These users are already friends');
    }
    
    // Create friend request
    return await pb.collection('friend_requests').create({
      sender: senderId,
      receiver: receiverId,
      status: 'pending',
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
};

// Accept a friend request
export const acceptFriendRequest = async (requestId: string) => {
  try {
    if (USE_MOCK) {
      // Find the request
      const request = mockFriendRequests.find(r => r.id === requestId);
      if (!request) {
        throw new Error('Friend request not found');
      }
      
      // Update request status
      request.status = 'accepted';
      
      // Find the users
      const user1 = mockUsers.find(u => u.id === request.sender);
      const user2 = mockUsers.find(u => u.id === request.receiver);
      
      if (!user1 || !user2) {
        throw new Error('User not found');
      }
      
      // Create friend relationship
      const newFriend = {
        id: `friend${mockFriends.length + 1}`,
        user1: request.sender,
        user2: request.receiver,
        expand: {
          user1: user1,
          user2: user2
        }
      };
      
      mockFriends.push(newFriend);
      
      // Simulate latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return newFriend;
    }
    
    // Get the request
    const request = await pb.collection('friend_requests').getOne(requestId);
    
    // Update request status
    await pb.collection('friend_requests').update(requestId, {
      status: 'accepted',
    });
    
    // Create friend relationship
    return await pb.collection('friends').create({
      user1: request.sender,
      user2: request.receiver,
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
};

// Reject a friend request
export const rejectFriendRequest = async (requestId: string) => {
  try {
    if (USE_MOCK) {
      // Find the request
      const request = mockFriendRequests.find(r => r.id === requestId);
      if (!request) {
        throw new Error('Friend request not found');
      }
      
      // Update request status
      request.status = 'rejected';
      
      // Simulate latency
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return request;
    }
    
    return await pb.collection('friend_requests').update(requestId, {
      status: 'rejected',
    });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    throw error;
  }
};

// Get all pending friend requests for a user
export const getPendingFriendRequests = async (userId: string) => {
  try {
    if (USE_MOCK) {
      const requests = mockFriendRequests.filter(r => r.receiver === userId && r.status === 'pending');
      
      return {
        page: 1,
        perPage: 50,
        totalItems: requests.length,
        totalPages: 1,
        items: requests
      };
    }
    
    return await pb.collection('friend_requests').getList(1, 50, {
      filter: `receiver="${userId}" && status="pending"`,
      expand: 'sender',
    });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    throw error;
  }
};

// Get all friends for a user
export const getUserFriends = async (userId: string) => {
  try {
    if (USE_MOCK) {
      // Find friends where user is either user1 or user2
      const friendsAsUser1 = mockFriends.filter(f => f.user1 === userId);
      const friendsAsUser2 = mockFriends.filter(f => f.user2 === userId);
      
      // Combine both lists and filter out undefined values
      const friends = [
        ...friendsAsUser1.map(f => f.expand?.user2),
        ...friendsAsUser2.map(f => f.expand?.user1)
      ].filter(f => f !== undefined);
      
      return friends;
    }
    
    const friendsAsUser1 = await pb.collection('friends').getList(1, 100, {
      filter: `user1="${userId}"`,
      expand: 'user2',
    });
    
    const friendsAsUser2 = await pb.collection('friends').getList(1, 100, {
      filter: `user2="${userId}"`,
      expand: 'user1',
    });
    
    // Combine both lists
    const friends = [
      ...friendsAsUser1.items.map((item: Record<string, any>) => item.expand?.user2),
      ...friendsAsUser2.items.map((item: Record<string, any>) => item.expand?.user1),
    ];
    
    return friends;
  } catch (error) {
    console.error('Error fetching user friends:', error);
    throw error;
  }
}; 