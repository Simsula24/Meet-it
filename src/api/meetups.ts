import { pb } from './pocketbase';

// Mock data
const mockMeetups = [
  {
    id: 'meetup1',
    title: 'Coffee Meetup',
    location: 'Starbucks Downtown',
    locationCoords: { lat: 47.6062, lng: -122.3321 },
    date: new Date().toISOString(),
    maxAttendees: 5,
    canInviteOthers: true,
    allowPlusOne: true,
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
  },
  {
    id: 'meetup2',
    title: 'Movie Night',
    location: 'AMC Theater',
    locationCoords: { lat: 47.6092, lng: -122.3350 },
    date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    maxAttendees: 10,
    canInviteOthers: true,
    allowPlusOne: true,
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

const mockAttendees = [
  {
    id: 'attendee1',
    meetup: 'meetup1',
    user: 'user1',
    expand: {
      meetup: mockMeetups[0]
    }
  },
  {
    id: 'attendee2',
    meetup: 'meetup2',
    user: 'user1',
    expand: {
      meetup: mockMeetups[1]
    }
  }
];

// Use mock data for development
const USE_MOCK = true;

// Create a new meetup
export const createMeetup = async (data: {
  title: string;
  location: string;
  locationCoords: { lat: number; lng: number };
  date: Date;
  maxAttendees?: number;
  duration?: number;
  canInviteOthers: boolean;
  allowPlusOne: boolean;
  organizer: string; // User ID
}) => {
  try {
    if (USE_MOCK) {
      // Create a mock meetup
      const newMeetup = {
        id: `meetup${mockMeetups.length + 1}`,
        title: data.title,
        location: data.location,
        locationCoords: data.locationCoords,
        date: data.date.toISOString(),
        maxAttendees: data.maxAttendees || 10, // Default to 10 if not provided
        canInviteOthers: data.canInviteOthers,
        allowPlusOne: data.allowPlusOne,
        organizer: data.organizer,
        collectionId: 'meetups',
        collectionName: 'meetups',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        expand: {
          organizer: {
            id: data.organizer,
            name: 'John Doe'
          }
        }
      };
      
      mockMeetups.push(newMeetup);
      
      // Automatically add creator as attendee
      await addAttendee(newMeetup.id, data.organizer);
      
      // Simulate latency
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return newMeetup;
    }
    
    // Regular implementation
    const serializedData = {
      ...data,
      date: data.date.toISOString(),
      locationCoords: JSON.stringify(data.locationCoords),
    };
    
    const meetup = await pb.collection('events').create(serializedData);
    
    // Automatically add the organizer as an attendee
    await addAttendee(meetup.id, data.organizer);
    
    return meetup;
  } catch (error) {
    console.error('Error creating meetup:', error);
    throw error;
  }
};

// Get all meetups a user is part of
export const getUserMeetups = async (userId: string) => {
  try {
    if (USE_MOCK) {
      // Return mock meetups for this user
      return mockMeetups;
    }
    
    // Regular implementation
    const attendees = await pb.collection('attendees').getList(1, 50, {
      filter: `user="${userId}"`,
      expand: 'meetup',
    });
    
    // Extract the meetups from the attendees records
    return attendees.items.map((item: Record<string, any>) => item.expand?.meetup);
  } catch (error) {
    console.error('Error fetching user meetups:', error);
    throw error;
  }
};

// Get a single meetup by ID
export const getMeetup = async (meetupId: string) => {
  try {
    if (USE_MOCK) {
      const meetup = mockMeetups.find(m => m.id === meetupId);
      if (!meetup) {
        throw new Error('Meetup not found');
      }
      return meetup;
    }
    
    return await pb.collection('events').getOne(meetupId);
  } catch (error) {
    console.error('Error fetching meetup:', error);
    throw error;
  }
};

// Add an attendee to a meetup
export const addAttendee = async (meetupId: string, userId: string) => {
  try {
    if (USE_MOCK) {
      // Find the meetup
      const meetup = mockMeetups.find(m => m.id === meetupId);
      if (!meetup) {
        throw new Error('Meetup not found');
      }
      
      const newAttendee = {
        id: `attendee${mockAttendees.length + 1}`,
        meetup: meetupId,
        user: userId,
        expand: {
          meetup: meetup
        }
      };
      
      mockAttendees.push(newAttendee);
      
      // Simulate latency
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return newAttendee;
    }
    
    return await pb.collection('attendees').create({
      meetup: meetupId,
      user: userId,
    });
  } catch (error) {
    console.error('Error adding attendee:', error);
    throw error;
  }
};

// Get all attendees for a meetup
export const getMeetupAttendees = async (meetupId: string) => {
  try {
    if (USE_MOCK) {
      return [{ id: 'user1', name: 'John Doe', avatar: null }];
    }
    
    const records = await pb.collection('attendees').getList(1, 50, {
      filter: `meetup="${meetupId}"`,
      expand: 'user',
    });
    
    // Extract user info from the records
    return records.items.map((item: Record<string, any>) => item.expand?.user);
  } catch (error) {
    console.error('Error fetching meetup attendees:', error);
    throw error;
  }
};

// Upload media to a meetup
export const uploadMeetupMedia = async (
  meetupId: string, 
  userId: string,
  file: any // In a real app, this would be a proper File type
) => {
  try {
    if (USE_MOCK) {
      // Simulate successful upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        id: 'media1',
        meetup: meetupId,
        user: userId,
        file: 'https://example.com/image.jpg'
      };
    }
    
    const formData = new FormData();
    formData.append('meetup', meetupId);
    formData.append('user', userId);
    formData.append('file', file);
    
    return await pb.collection('meetup_media').create(formData);
  } catch (error) {
    console.error('Error uploading meetup media:', error);
    throw error;
  }
};

// Get all media for a meetup
export const getMeetupMedia = async (meetupId: string) => {
  try {
    if (USE_MOCK) {
      return {
        page: 1,
        perPage: 100,
        totalItems: 0,
        totalPages: 1,
        items: []
      };
    }
    
    return await pb.collection('meetup_media').getList(1, 100, {
      filter: `meetup="${meetupId}"`,
      sort: 'created',
    });
  } catch (error) {
    console.error('Error fetching meetup media:', error);
    throw error;
  }
}; 