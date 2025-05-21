// Export the PocketBase instance
import { pb } from './pocketbaseSetup';
export { pb };

// Auth-related exports
export {
  // Types
  User,
  // Functions
  sendFriendRequest,
  getPendingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getUserFriends,
  removeFriend,
  searchUsersByEmail,
} from './friendships';

// Event-related exports
export {
  // Types
  Event,
  // Functions
  createEvent,
  getUserEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  addAttendee,
  updateAttendeeStatus,
  getEventAttendees,
  getFriendsEvents,
} from './events';

// Chat-related exports
export {
  // Types
  Message,
  // Functions
  sendMessage,
  getEventMessages,
  subscribeToEventMessages,
  deleteMessage,
} from './chat';

// Media-related exports
export {
  // Types
  Media,
  // Functions
  uploadMedia,
  getEventMedia,
  deleteMedia,
  updateMediaCaption,
} from './media';

// Service health check
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    // A simple health check for the PocketBase server
    const health = await fetch(`${pb.baseUrl}/health`);
    return health.ok;
  } catch (error) {
    console.error('API connection check failed:', error);
    return false;
  }
}; 