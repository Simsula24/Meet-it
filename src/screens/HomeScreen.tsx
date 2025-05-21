import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  SectionList,
  StatusBar,
  Platform,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { 
  getUserEvents, 
  getFriendsEvents, 
  Event, 
  getEventInvitations, 
  getEventAttendees,
  updateMeetupOrder,
  getMeetupOrders
} from '../api/events';
import { useNavigation } from '@react-navigation/native';
import { HomeScreenNavigationProp } from '../types/navigation';
import { getAvatarUrl } from '../utils/fileHelpers';
import EventInvitation from '../components/EventInvitation';
import MeetupCard from '../components/MeetupCard';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Use an existing icon as fallback avatar
const iconPlaceholder = require('../../assets/default-avatar.png');

const HomeScreen = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [attendeeCounts, setAttendeeCounts] = useState<Record<string, number>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [orderMap, setOrderMap] = useState<Record<string, number>>({});
  const [orderedEvents, setOrderedEvents] = useState<Event[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const fetchData = async () => {
    try {
      if (!user || !user.id) {
        console.error("User is not properly authenticated");
        return;
      }

      console.log("Fetching events for user:", user.id);

      // Fetch all events for the user (events they created and events they're attending)
      const userEvents = await getUserEvents(user.id);
      console.log(`Found ${userEvents.length} user events`);
      
      // Fetch events from friends
      const friendsEvents = await getFriendsEvents(user.id);
      console.log(`Found ${friendsEvents.length} friend events`);
      
      // Fetch pending event invitations
      const pendingInvitations = await getEventInvitations(user.id);
      console.log(`Found ${pendingInvitations.length} pending invitations`);
      setInvitations(pendingInvitations);
      
      // Combine and deduplicate events
      const allEvents = [...userEvents];
      
      friendsEvents.forEach(event => {
        if (!allEvents.some(e => e.id === event.id)) {
          allEvents.push(event);
        }
      });
      
      // Get stored ordering
      const storedOrderMap = await getMeetupOrders(user.id);
      setOrderMap(storedOrderMap);
      
      // Sort events by custom order first, then by date
      const sortedEvents = [...allEvents].sort((a, b) => {
        // First check if either event has a custom order
        const orderA = storedOrderMap[a.id] ?? Number.MAX_SAFE_INTEGER;
        const orderB = storedOrderMap[b.id] ?? Number.MAX_SAFE_INTEGER;
        
        // Sort by order first
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        
        // Fall back to date sorting
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      // Log event IDs for debugging
      console.log("Events to display:", sortedEvents.map(e => ({ id: e.id, title: e.title })));
      
      setEvents(allEvents);
      setOrderedEvents(sortedEvents);
      
      // Fetch attendee counts for all events
      const counts: Record<string, number> = {};
      for (const event of allEvents) {
        try {
          const attendees = await getEventAttendees(event.id);
          counts[event.id] = attendees.filter(a => a.status === 'going').length;
        } catch (error) {
          console.error(`Error fetching attendees for event ${event.id}:`, error);
          counts[event.id] = 0;
        }
      }
      setAttendeeCounts(counts);
    } catch (error) {
      console.error('Error fetching events:', error);
      Alert.alert('Error', 'Failed to load events. Please try again.');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const navigateToProfile = () => {
    // Navigate to the Profile tab
    navigation.getParent()?.navigate('Profile');
  };

  const navigateToCreateMeetup = () => {
    // Navigate to the CreateMeetup screen at the root level
    navigation.getParent()?.getParent()?.navigate('CreateMeetup');
  };

  const navigateToMeetupDetails = (eventId: string) => {
    // Navigate to the MeetupDetails screen within the current stack
    navigation.navigate('MeetupDetails', { eventId });
  };

  const navigateToInbox = () => {
    // Navigate to the inbox screen
    navigation.navigate('Inbox');
  };

  // Get the avatar URL for the current user
  const avatarUrl = getAvatarUrl(user);

  const renderEvent = ({ item, drag, isActive }: RenderItemParams<Event>) => {
    // Parse coordinates if they exist and are in string format
    let coordinates = null;
    let hasValidCoordinates = false;
    
    if (item.coordinates) {
      try {
        coordinates = typeof item.coordinates === 'string' 
          ? JSON.parse(item.coordinates) 
          : item.coordinates;
          
        // Validate coordinates to prevent rendering issues
        hasValidCoordinates = coordinates && 
          typeof coordinates.latitude === 'number' && 
          typeof coordinates.longitude === 'number';
      } catch (error) {
        console.error('Error parsing coordinates:', error);
      }
    }
    
    return (
      <ScaleDecorator>
        <MeetupCard
          id={item.id}
          title={item.title}
          location={item.location}
          date={new Date(item.date)}
          attendeesCount={attendeeCounts[item.id] || 0}
          maxAttendees={item.maxAttendees}
          organizer={item.expand?.organizer?.name || 'Unknown'}
          coordinates={hasValidCoordinates ? coordinates : undefined}
          hasExactLocation={hasValidCoordinates}
          onPress={navigateToMeetupDetails}
          onDragStart={drag}
          style={isActive ? { elevation: 10, shadowOpacity: 0.5 } : undefined}
        />
      </ScaleDecorator>
    );
  };

  const renderInvitation = ({ item }: { item: any }) => (
    <EventInvitation 
      event={item.event}
      attendeeId={item.attendeeId}
      invitedBy={item.invitedBy}
      onRespond={onRefresh}
    />
  );

  const handleDragEnd = useCallback(({ data }: { data: Event[] }) => {
    // Update the ordered events
    setOrderedEvents(data);
    setIsDragging(false);
    
    // Create a new order map based on the current order
    const newOrderMap: Record<string, number> = {};
    data.forEach((event, index) => {
      newOrderMap[event.id] = index;
    });
    
    // Update the order map state
    setOrderMap(newOrderMap);
    
    // Save the order to the backend
    if (user?.id) {
      updateMeetupOrder(user.id, newOrderMap).catch(error => {
        console.error('Failed to save meetup order:', error);
      });
    }
  }, [user]);

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0 }]}>
          <Text style={styles.headerTitle}>Your Meetups</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={navigateToInbox} style={styles.iconButton}>
              <Ionicons name="mail-outline" size={24} color="#333333" />
            </TouchableOpacity>
            <TouchableOpacity onPress={navigateToProfile} style={styles.iconButton}>
              <Image 
                source={avatarUrl ? { uri: avatarUrl } : iconPlaceholder} 
                style={styles.avatar} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {isDragging && (
          <View style={styles.dragIndicator}>
            <Text style={styles.dragIndicatorText}>
              Drag to reorder your meetups
            </Text>
          </View>
        )}

        {events.length === 0 && invitations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No meetups yet!</Text>
            <Text style={styles.emptySubtext}>
              Create a meetup or wait for an invitation from friends.
            </Text>
          </View>
        ) : (
          <View style={{ flex: 1 }}>
            {invitations.length > 0 && (
              <>
                <Text style={[styles.sectionHeader, { marginHorizontal: 16, marginTop: 16 }]}>
                  Invitations
                </Text>
                <FlatList
                  data={invitations}
                  renderItem={renderInvitation}
                  keyExtractor={(item) => `invitation-${item.attendeeId}`}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                  scrollEnabled={false}
                  nestedScrollEnabled={true}
                />
              </>
            )}
            
            {orderedEvents.length > 0 && (
              <>
                <Text style={[styles.sectionHeader, { marginHorizontal: 16, marginTop: 16 }]}>
                  Your Meetups
                </Text>
                <DraggableFlatList
                  data={orderedEvents}
                  onDragBegin={handleDragStart}
                  onDragEnd={handleDragEnd}
                  keyExtractor={(item) => `event-${item.id}`}
                  renderItem={renderEvent}
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                  }
                />
              </>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.createButton}
          onPress={navigateToCreateMeetup}
        >
          <Text style={styles.createButtonText}>Create Meetup</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555555',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  createButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#0A84FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 16,
  },
  dragIndicator: {
    backgroundColor: 'rgba(10, 132, 255, 0.9)',
    padding: 8,
    marginHorizontal: 16,
    marginVertical: 0,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragIndicatorText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
});

export default HomeScreen; 