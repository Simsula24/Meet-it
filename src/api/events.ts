import { pb } from './pocketbaseSetup';
import { checkIfFriends } from './friendships';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  description?: string;
  organizer: string;
  maxAttendees?: number;
  allowPlusOne: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  hasExactLocation?: boolean;
  expand?: {
    organizer?: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
}

export interface EventAttendee {
  id: string;
  userId: string;
  status: 'going' | 'maybe' | 'not_going' | 'invited' | 'declined';
  plusOne: boolean;
  invitedBy?: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

/**
 * Create a new event
 */
export const createEvent = async (data: {
  title: string;
  date: Date;
  location: string;
  description?: string;
  organizer: string;
  maxAttendees?: number;
  allowPlusOne: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  hasExactLocation?: boolean;
}): Promise<Event> => {
  try {
    console.log('Creating event with data:', JSON.stringify(data));
    console.log('Current auth status:', pb.authStore.isValid ? 'Authenticated' : 'Not authenticated');
    console.log('Current user:', pb.authStore.model);
    
    const serializedData = {
      ...data,
      date: data.date.toISOString(),
      coordinates: data.coordinates ? JSON.stringify(data.coordinates) : null,
    };
    
    const event = await pb.collection('events').create(serializedData);
    console.log('Event created successfully:', event);
    
    // Automatically add the organizer as an attendee
    await addAttendee(event.id, data.organizer, 'going');
    
    // Cast the RecordModel to Event type
    return event as unknown as Event;
  } catch (error: any) {
    console.error('Error creating event:', error);
    
    // Log more detailed error information
    if (error.response) {
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
    }
    
    throw error;
  }
};

/**
 * Get all events a user is part of (as organizer or attendee)
 */
export const getUserEvents = async (userId: string): Promise<Event[]> => {
  try {
    console.log(`Fetching events for user ID: ${userId}`);
    
    // Get events where user is the organizer
    const organizerEvents = await pb.collection('events').getList(1, 100, {
      filter: `organizer = "${userId}"`,
      sort: '+date',
      expand: 'organizer',
    });
    
    console.log(`Found ${organizerEvents.items.length} events where user is organizer`);
    
    // Get events where user is an attendee
    const attendeeRecords = await pb.collection('event_attendees').getList(1, 100, {
      filter: `user = "${userId}" && status != "declined"`,
      expand: 'event,event.organizer',
    });
    
    console.log(`Found ${attendeeRecords.items.length} events where user is attendee`);
    
    // Extract event objects from attendee records and validate they have IDs
    const attendeeEvents = attendeeRecords.items
      .map((record) => record.expand?.event)
      .filter((event) => event && event.id) as unknown as Event[];
    
    console.log(`Extracted ${attendeeEvents.length} valid attendee events`);
    
    // Combine both lists, avoiding duplicates
    const allEvents = [...organizerEvents.items] as unknown as Event[];
    
    attendeeEvents.forEach((event) => {
      if (!allEvents.some((e) => e.id === event.id)) {
        allEvents.push(event);
      }
    });
    
    console.log(`Total combined events: ${allEvents.length}`);
    
    // Validate all events have required fields
    const validEvents = allEvents.filter(event => 
      event && event.id && event.title && event.date
    );
    
    console.log(`Valid events after filtering: ${validEvents.length}`);
    
    // Sort by date
    return validEvents.sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  } catch (error) {
    console.error('Error fetching user events:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
  }
};

/**
 * Get a single event by ID
 */
export const getEvent = async (eventId: string): Promise<Event> => {
  try {
    console.log(`Fetching event with ID: ${eventId}`);
    
    if (!eventId) {
      console.error('Invalid eventId provided:', eventId);
      throw new Error('Invalid event ID');
    }
    
    const event = await pb.collection('events').getOne(eventId, {
      expand: 'organizer',
    });
    
    console.log('Event fetched successfully:', event);
    return event as unknown as Event;
  } catch (error: any) {
    console.error(`Error fetching event with ID ${eventId}:`, error);
    
    // Add more detailed error information
    if (error.status === 404) {
      console.error('Event not found in database. This could be because:');
      console.error('1. The event was deleted');
      console.error('2. The event ID is incorrect');
      console.error('3. There might be a mismatch between local data and server data');
    }
    
    throw error;
  }
};

/**
 * Update an event
 */
export const updateEvent = async (eventId: string, data: Partial<Event>): Promise<Event> => {
  try {
    return await pb.collection('events').update(eventId, data);
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

/**
 * Delete an event
 */
export const deleteEvent = async (eventId: string): Promise<boolean> => {
  try {
    await pb.collection('events').delete(eventId);
    return true;
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

/**
 * Add an attendee to an event
 */
export const addAttendee = async (
  eventId: string, 
  userId: string, 
  status: 'going' | 'maybe' | 'not_going' | 'invited' | 'declined' = 'going',
  plusOne: boolean = false
): Promise<any> => {
  try {
    return await pb.collection('event_attendees').create({
      event: eventId,
      user: userId,
      status,
      plusOne,
    });
  } catch (error) {
    console.error('Error adding attendee:', error);
    throw error;
  }
};

/**
 * Update an attendee's status
 */
export const updateAttendeeStatus = async (
  attendeeId: string, 
  status: 'going' | 'maybe' | 'not_going' | 'invited' | 'declined',
  plusOne: boolean = false
): Promise<any> => {
  try {
    // First get the current attendee record to get the event ID
    const currentAttendee = await pb.collection('event_attendees').getOne(attendeeId);
    
    return await pb.collection('event_attendees').update(attendeeId, {
      event: currentAttendee.event,
      status,
      plusOne,
    });
  } catch (error) {
    console.error('Error updating attendee status:', error);
    throw error;
  }
};

/**
 * Get all attendees for an event
 */
export const getEventAttendees = async (eventId: string): Promise<any[]> => {
  try {
    const records = await pb.collection('event_attendees').getList(1, 100, {
      filter: `event="${eventId}"`,
      expand: 'user',
    });
    
    return records.items.map((item) => ({
      id: item.id,
      userId: item.user,
      status: item.status,
      plusOne: item.plusOne,
      user: item.expand?.user,
    }));
  } catch (error) {
    console.error('Error fetching event attendees:', error);
    throw error;
  }
};

/**
 * Get user's events based on their friend's events
 */
export const getFriendsEvents = async (userId: string): Promise<Event[]> => {
  try {
    // First, get all events the user is already invited to or participating in
    const userAttendeeRecords = await pb.collection('event_attendees').getList(1, 200, {
      filter: `user="${userId}"`,
      expand: 'event,event.organizer',
    });

    // Extract event IDs the user is already connected to
    const userEventIds = userAttendeeRecords.items
      .filter(item => item.expand?.event)
      .map(item => item.expand?.event.id);

    console.log(`User already connected to ${userEventIds.length} events`);

    // Get user's friends (accepted status)
    const friends1 = await pb.collection('friendships').getList(1, 100, {
      filter: `user1="${userId}" && status="accepted"`,
      expand: 'user2',
    });
    
    const friends2 = await pb.collection('friendships').getList(1, 100, {
      filter: `user2="${userId}" && status="accepted"`,
      expand: 'user1',
    });
    
    // Extract friend IDs
    const friendIds = [
      ...friends1.items.map((item) => item.user2),
      ...friends2.items.map((item) => item.user1),
    ];
    
    if (friendIds.length === 0) {
      console.log('User has no friends');
      return [];
    }
    
    // Instead of just getting all friend-organized events, 
    // we need events where the user is actually an attendee
    // (invited, going, maybe - any valid status)
    
    // First get the event_attendees records where user is an attendee and event is organized by a friend
    const friendEventAttendeeRecords = await pb.collection('event_attendees').getList(1, 100, {
      filter: `user="${userId}" && status != "declined"`,
      expand: 'event,event.organizer',
    });

    console.log(`Found ${friendEventAttendeeRecords.items.length} event attendee records for user`);
    
    // Filter for events where the organizer is one of the user's friends
    const friendEventIds = friendEventAttendeeRecords.items
      .filter(item => {
        const event = item.expand?.event;
        return event && friendIds.includes(event.organizer);
      })
      .map(item => {
        // Use optional chaining and ensure the event exists
        return item.expand?.event?.id;
      })
      .filter(Boolean); // Remove any undefined values
    
    console.log(`User has ${friendEventIds.length} events connected to friends`);
    
    // Now get complete events data for these IDs
    if (friendEventIds.length === 0) {
      return [];
    }

    // Build filter for events where user is already an attendee
    const eventsFilter = friendEventIds
      .map(id => `id="${id}"`)
      .join(' || ');
    
    // Get the events
    const friendEvents = await pb.collection('events').getList(1, 50, {
      filter: eventsFilter,
      sort: '+date',
      expand: 'organizer',
    });
    
    console.log(`Fetched ${friendEvents.items.length} friend events where user is an attendee`);
    
    return friendEvents.items as unknown as Event[];
  } catch (error) {
    console.error('Error fetching friends events:', error);
    return [];
  }
};

/**
 * Invite a user to an event
 */
export const inviteUserToEvent = async (
  eventId: string,
  userId: string,
  invitedBy: string
): Promise<any> => {
  try {
    // First check if the users are friends
    const areFriends = await checkIfFriends(userId, invitedBy);
    if (!areFriends) {
      throw new Error('You can only invite friends to events');
    }
    
    // Check if the user is already invited or attending
    const existingAttendee = await pb.collection('event_attendees').getList(1, 1, {
      filter: `event="${eventId}" && user="${userId}"`,
    });
    
    if (existingAttendee.items.length > 0) {
      throw new Error('User is already invited to this event');
    }
    
    // Create a new attendee record with 'invited' status
    return await pb.collection('event_attendees').create({
      event: eventId,
      user: userId,
      status: 'invited', // New status for invited users
      plusOne: false,
      invitedBy: invitedBy,
    });
  } catch (error) {
    console.error('Error inviting user to event:', error);
    throw error;
  }
};

/**
 * Get friends who haven't been invited to an event yet
 */
export const getUninvitedFriends = async (userId: string, eventId: string): Promise<any[]> => {
  try {
    // Get all friends
    const friends1 = await pb.collection('friendships').getList(1, 100, {
      filter: `user1="${userId}" && status="accepted"`,
      expand: 'user2',
    });
    
    const friends2 = await pb.collection('friendships').getList(1, 100, {
      filter: `user2="${userId}" && status="accepted"`,
      expand: 'user1',
    });
    
    // Combine and extract friend records
    const allFriends = [
      ...friends1.items.map(item => ({
        id: item.expand?.user2?.id,
        name: item.expand?.user2?.name,
        avatar: item.expand?.user2?.avatar,
      })),
      ...friends2.items.map(item => ({
        id: item.expand?.user1?.id,
        name: item.expand?.user1?.name,
        avatar: item.expand?.user1?.avatar,
      })),
    ].filter(friend => friend.id);
    
    // If no friends, return empty array
    if (allFriends.length === 0) {
      return [];
    }
    
    // Get all attendees for this event
    const attendees = await pb.collection('event_attendees').getList(1, 100, {
      filter: `event="${eventId}"`,
    });
    
    // Filter out friends who are already invited or attending
    const attendeeUserIds = attendees.items.map(item => item.user);
    const uninvitedFriends = allFriends.filter(friend => !attendeeUserIds.includes(friend.id));
    
    return uninvitedFriends;
  } catch (error) {
    console.error('Error getting uninvited friends:', error);
    // Return empty array on error to avoid breaking the UI
    return [];
  }
};

/**
 * Get all pending event invitations for a user
 */
export const getEventInvitations = async (userId: string): Promise<{event: Event, attendeeId: string}[]> => {
  try {
    console.log(`Fetching event invitations for user ID: ${userId}`);
    
    // Get all records where user has been invited but hasn't responded
    const invitations = await pb.collection('event_attendees').getList(1, 100, {
      filter: `user="${userId}" && status="invited"`,
      expand: 'event,event.organizer,invitedBy',
    });
    
    console.log(`Found ${invitations.items.length} pending invitations`);
    
    // Map to a more usable format
    return invitations.items
      .filter(item => item.expand?.event) // Ensure event data exists
      .map(item => ({
        event: item.expand?.event as unknown as Event,
        attendeeId: item.id,
        invitedBy: item.expand?.invitedBy
      }));
  } catch (error) {
    console.error('Error fetching event invitations:', error);
    return [];
  }
};

/**
 * Respond to an event invitation
 * @param attendeeId The ID of the attendee record
 * @param response 'going', 'maybe', 'not_going', or 'declined'
 * @param plusOne Whether the user is bringing a plus one
 */
export const respondToInvitation = async (
  attendeeId: string,
  response: 'going' | 'maybe' | 'not_going' | 'declined',
  plusOne: boolean = false
): Promise<boolean> => {
  try {
    console.log(`Responding to invitation ${attendeeId} with response: ${response}`);
    
    await pb.collection('event_attendees').update(attendeeId, {
      status: response,
      plusOne
    });
    
    console.log('Successfully updated invitation response');
    return true;
  } catch (error) {
    console.error('Error responding to invitation:', error);
    return false;
  }
};

/**
 * Update the display order for meetups
 */
export const updateMeetupOrder = async (
  userId: string,
  eventOrderMap: Record<string, number>
): Promise<boolean> => {
  try {
    console.log(`[ORDER] Updating order for ${Object.keys(eventOrderMap).length} events`);
    
    // Store order in local storage as a fallback
    try {
      const orderData = JSON.stringify({userId, orderMap: eventOrderMap});
      await AsyncStorage.setItem('meetup_orders', orderData);
      console.log('[ORDER] Saved order to local storage');
    } catch (storageError) {
      console.error('[ORDER] Error saving to local storage:', storageError);
    }
    
    // Try to save to server, but don't fail if it doesn't work
    try {
      // Check for the meetup_orders collection
      const collections = await pb.collections.getFullList();
      const orderCollection = collections.find(c => c.name === 'meetup_orders');
      
      if (!orderCollection) {
        console.warn('[ORDER] meetup_orders collection does not exist in database. Order will be stored locally only.');
        return true; // Return true so UI still works
      }
    
      // Get existing order records for this user
      const existingRecords = await pb.collection('meetup_orders').getList(1, 500, {
        filter: `user = "${userId}"`,
      });
      
      // Create a map of existing records for faster lookup
      const existingOrderMap: Record<string, any> = {};
      existingRecords.items.forEach(record => {
        existingOrderMap[record.event] = record;
      });
      
      // Process each event in the order map
      const updates = Object.entries(eventOrderMap).map(async ([eventId, order]) => {
        const data = { 
          user: userId,
          event: eventId,
          order 
        };
        
        if (existingOrderMap[eventId]) {
          // Update existing record
          await pb.collection('meetup_orders').update(existingOrderMap[eventId].id, data);
        } else {
          // Create new record
          await pb.collection('meetup_orders').create(data);
        }
      });
      
      await Promise.all(updates);
      console.log('[ORDER] Successfully saved order to database');
    } catch (serverError) {
      console.warn('[ORDER] Could not save order to server, using local storage instead:', serverError);
      // This is okay - we'll just use local storage
    }
    
    return true;
  } catch (error) {
    console.error('[ORDER] Error updating meetup order:', error);
    return false;
  }
};

/**
 * Get all custom ordering info for a user's meetups
 */
export const getMeetupOrders = async (
  userId: string
): Promise<Record<string, number>> => {
  try {
    console.log(`[ORDER] Fetching orders for user=${userId}`);
    
    // Try to get from server first
    try {
      // Check if collection exists
      const collections = await pb.collections.getFullList();
      const orderCollection = collections.find(c => c.name === 'meetup_orders');
      
      if (orderCollection) {
        // Get all order records for this user
        const records = await pb.collection('meetup_orders').getList(1, 500, {
          filter: `user = "${userId}"`,
        });

        console.log(`[ORDER] Found ${records.items.length} order records in database`);
        
        // Build order map
        const orderMap: Record<string, number> = {};
        records.items.forEach(record => {
          if (record.order !== null && record.order !== undefined) {
            orderMap[record.event] = record.order;
          }
        });

        return orderMap;
      } else {
        console.warn('[ORDER] meetup_orders collection does not exist');
      }
    } catch (serverError) {
      console.warn('[ORDER] Could not fetch orders from server:', serverError);
    }
    
    // Fall back to local storage if server failed
    try {
      const storedData = await AsyncStorage.getItem('meetup_orders');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.userId === userId && parsedData.orderMap) {
          console.log('[ORDER] Using order from local storage');
          return parsedData.orderMap;
        }
      }
    } catch (storageError) {
      console.error('[ORDER] Error reading from local storage:', storageError);
    }
    
    // Return empty map if both options failed
    return {};
  } catch (error) {
    console.error('[ORDER] Error getting meetup orders:', error);
    return {};
  }
}; 