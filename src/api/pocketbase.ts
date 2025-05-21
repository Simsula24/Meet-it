import PocketBase from 'pocketbase';

// Initialize Pocketbase client
// In a real production app, you would use a real server URL
export const pb = new PocketBase('http://pocketbase.sigmagram.xyz');

// Mock data for development
const mockUsers = [
  { 
    id: 'user1', 
    name: 'John Doe',
    phone: '1234567890',
    avatar: null 
  }
];

const mockMeetups = [
  {
    id: 'meetup1',
    title: 'Coffee Meetup',
    location: 'Starbucks Downtown',
    locationCoords: { lat: 47.6062, lng: -122.3321 },
    date: new Date().toISOString(),
    maxAttendees: 5,
    organizer: 'user1',
    collectionId: 'meetups',
    collectionName: 'meetups',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    expand: {
      organizer: {
        id: 'user1',
        name: 'John Doe'
      }
    }
  }
];

// Use mock data for development
const USE_MOCK = true;

// Auth functions
export const register = async (phone: string, name: string) => {
  try {
    if (USE_MOCK) {
      // Simulate successful registration
      const mockUser = {
        id: 'user2',
        phone,
        name,
        avatar: null
      };
      mockUsers.push(mockUser);
      
      // Simulate latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return mockUser;
    }
    
    // Normal implementation for real server
    const user = await pb.collection('users').create({
      phone,
      name,
      password: phone, // In a real app, you would use a secure password or token-based auth
      passwordConfirm: phone,
    });
    
    return user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const login = async (phone: string) => {
  try {
    if (USE_MOCK) {
      // Simulate successful login
      const user = mockUsers.find(u => u.phone === phone);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Simulate authentication
      pb.authStore.save('mock_token', user);
      
      // Simulate latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { token: 'mock_token', record: user };
    }
    
    // Normal implementation
    const authData = await pb.collection('users').authWithPassword(phone, phone);
    return authData;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = () => {
  pb.authStore.clear();
};

// Get the current logged-in user
export const getCurrentUser = () => {
  // Always return the actual authenticated user
  return pb.authStore.model;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  if (USE_MOCK) {
    // For development, always return true to skip login
    return true;
  }
  return pb.authStore.isValid;
}; 