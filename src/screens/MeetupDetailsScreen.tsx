import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Linking,
  Platform,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { getEvent, getEventAttendees, addAttendee, inviteUserToEvent, getUninvitedFriends, deleteEvent, updateAttendeeStatus } from '../api/events';
import { getCurrentUser } from '../api/pocketbase';
import Button from '../components/Button';
import { MeetupDetailsScreenNavigationProp } from '../types/navigation';
import { useAuth } from '../contexts/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapViewWrapper from '../components/MapViewWrapper';

// Define explicit style for center
const centerStyle = {
  justifyContent: 'center' as 'center',
  alignItems: 'center' as 'center',
};

interface MeetupDetailsScreenProps {
  route: { params: { eventId: string } };
  navigation: MeetupDetailsScreenNavigationProp;
}

interface Attendee {
  id: string;
  userId: string;
  status: 'going' | 'maybe' | 'not_going' | 'invited' | 'declined';
  plusOne: boolean;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface Friend {
  id: string;
  name: string;
  avatar?: string;
}

const MeetupDetailsScreen: React.FC<MeetupDetailsScreenProps> = ({ route, navigation }) => {
  const { eventId } = route.params;
  const { user } = useAuth();
  const [meetup, setMeetup] = useState<any>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [uninvitedFriends, setUninvitedFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [joining, setJoining] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviting, setInviting] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [leaving, setLeaving] = useState<boolean>(false);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('Loading event details for ID:', eventId);
      
      // Fetch meetup details using the events API
      const eventData = await getEvent(eventId);
      setMeetup(eventData);
      
      // Fetch attendees using the events API
      const attendeesList = await getEventAttendees(eventId);
      setAttendees(attendeesList);
    } catch (error: any) {
      console.error('Error loading meetup data:', error);
      
      if (error.status === 404) {
        Alert.alert(
          'Event Not Found',
          'This event may have been deleted or is no longer available.',
          [
            {
              text: 'Go Back',
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to load meetup details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUninvitedFriends = async () => {
    if (!user?.id) return;
    
    try {
      const friends = await getUninvitedFriends(user.id, eventId);
      setUninvitedFriends(friends);
    } catch (error) {
      console.error('Error loading uninvited friends:', error);
    }
  };
  
  const handleJoinMeetup = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'You need to be logged in to join meetups.');
        return;
      }
      
      setJoining(true);
      
      // Check if already attending or has declined
      const existingAttendee = attendees.find(
        attendee => attendee.userId === user.id
      );
      
      if (existingAttendee) {
        if (existingAttendee.status === 'going') {
          Alert.alert('Already Joined', 'You are already attending this meetup.');
          setJoining(false);
          return;
        } else if (existingAttendee.status === 'declined') {
          Alert.alert(
            'Cannot Join',
            'You have previously declined this meetup. Please ask the organizer to invite you again.',
            [{ text: 'OK' }]
          );
          setJoining(false);
          return;
        }
      }
      
      // Join the meetup using the events API
      await addAttendee(eventId, user.id, 'going');
      
      // Reload data
      await loadData();
      
      Alert.alert('Success', 'You have joined the meetup!');
    } catch (error) {
      console.error('Error joining meetup:', error);
      Alert.alert('Error', 'Failed to join meetup. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleShowInviteModal = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You need to be logged in to invite friends.');
      return;
    }

    await loadUninvitedFriends();
    setShowInviteModal(true);
  };

  const handleInviteFriend = async (friendId: string) => {
    if (!user?.id) return;
    
    try {
      setInviting(true);
      await inviteUserToEvent(eventId, friendId, user.id);
      
      // Update the list of uninvited friends
      setUninvitedFriends(uninvitedFriends.filter(friend => friend.id !== friendId));
      
      Alert.alert('Success', 'Friend invited to the meetup!');
    } catch (error: any) {
      console.error('Error inviting friend:', error);
      Alert.alert('Error', error.message || 'Failed to invite friend.');
    } finally {
      setInviting(false);
    }
  };

  const handleShareLink = () => {
    Alert.alert('Coming Soon', 'Share link functionality is under development');
  };
  
  const handleOpenChat = () => {
    console.log('Opening chat for event:', eventId);
    navigation.navigate('Chat', { eventId });
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const handleEditMeetup = () => {
    // Check if the user is the organizer
    if (user && meetup && meetup.organizer === user.id) {
      navigation.navigate('EditMeetup' as any, { eventId });
    } else {
      Alert.alert('Permission Denied', 'You can only edit meetups that you organized.');
    }
  };

  const handleDeleteMeetup = () => {
    Alert.alert(
      'Delete Meetup',
      'Are you sure you want to delete this meetup? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: confirmDeleteMeetup 
        }
      ]
    );
  };

  const confirmDeleteMeetup = async () => {
    try {
      setDeleting(true);
      await deleteEvent(eventId);
      Alert.alert(
        'Success',
        'Meetup deleted successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error deleting meetup:', error);
      Alert.alert('Error', 'Failed to delete meetup. Please try again.');
      setDeleting(false);
    }
  };

  const getCoordinatesFromMeetup = () => {
    if (!meetup?.coordinates) return null;
    
    try {
      if (typeof meetup.coordinates === 'string') {
        return JSON.parse(meetup.coordinates);
      }
      return meetup.coordinates;
    } catch (error) {
      console.error('Error parsing coordinates:', error);
      return null;
    }
  };

  const openInMaps = () => {
    const coordinates = getCoordinatesFromMeetup();
    if (!coordinates) return;
    
    const { latitude, longitude } = coordinates;
    const label = encodeURIComponent(meetup.location || meetup.title);
    
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });
    
    if (url) {
      Linking.openURL(url).catch(err => {
        console.error('Error opening maps app:', err);
        Alert.alert('Error', 'Could not open maps application');
      });
    }
  };

  const handleLeaveMeetup = async () => {
    if (!user) {
      Alert.alert('Error', 'You need to be logged in to leave meetups.');
      return;
    }

    Alert.alert(
      'Leave Meetup',
      'Are you sure you want to leave this meetup?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLeaving(true);
              
              // Find the attendee record for the current user
              const userAttendee = attendees.find(
                attendee => attendee.userId === user.id && attendee.status === 'going'
              );
              
              if (!userAttendee) {
                throw new Error('Could not find your attendance record');
              }
              
              // Update the attendee status to 'declined'
              await updateAttendeeStatus(userAttendee.id, 'declined');
              
              // Reload data
              await loadData();
              
              Alert.alert('Success', 'You have left the meetup.');
            } catch (error: any) {
              console.error('Error leaving meetup:', error);
              Alert.alert('Error', error.message || 'Failed to leave meetup. Please try again.');
            } finally {
              setLeaving(false);
            }
          }
        }
      ]
    );
  };
  
  useEffect(() => {
    loadData();
  }, [eventId]);
  
  if (loading) {
    return (
      <View style={[styles.container, centerStyle]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  if (!meetup) {
    return (
      <View style={[styles.container, centerStyle]}>
        <Text style={styles.errorText}>Meetup not found</Text>
      </View>
    );
  }
  
  const isOrganizer = user && meetup && meetup.organizer === user.id;
  const isAttending = user && attendees.some(
    attendee => attendee.userId === user.id && attendee.status === 'going'
  );

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <View style={styles.friendItem}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
      <Text style={styles.friendName}>{item.name}</Text>
      <TouchableOpacity 
        style={styles.inviteButton}
        onPress={() => handleInviteFriend(item.id)}
        disabled={inviting}
      >
        <Text style={styles.inviteButtonText}>Invite</Text>
      </TouchableOpacity>
    </View>
  );

  const coordinates = getCoordinatesFromMeetup();
  
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{meetup.title}</Text>
          <Text style={styles.organizer}>
            Organized by: {meetup.expand?.organizer?.name || 'Unknown'}
          </Text>
          {isOrganizer && (
            <TouchableOpacity 
              style={styles.deleteIconButton} 
              onPress={handleDeleteMeetup}
              disabled={deleting}
            >
              <Ionicons name="trash" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>When:</Text>
            <Text style={styles.detailValue}>{formatDate(meetup.date)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Where:</Text>
            <Text style={styles.detailValue}>{meetup.location}</Text>
          </View>
          {meetup.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailValue}>{meetup.description}</Text>
            </View>
          )}
          {meetup.maxAttendees && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Max Attendees:</Text>
              <Text style={styles.detailValue}>
                {attendees.length} / {meetup.maxAttendees}
              </Text>
            </View>
          )}
        </View>
        
        {meetup.hasExactLocation && coordinates && (
          <View style={styles.mapContainer}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapWrapper}>
              <MapViewWrapper
                style={styles.map}
                region={{
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                showMarker={true}
                markerCoordinate={{
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude,
                }}
                markerTitle={meetup.title}
                markerDescription={meetup.location}
              />
            </View>
            <TouchableOpacity
              style={styles.openMapsButton}
              onPress={openInMaps}
            >
              <Text style={styles.openMapsButtonText}>Open in Maps App</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendees</Text>
          {attendees.length > 0 ? (
            attendees.map((attendee) => (
              <View key={attendee.id} style={styles.attendeeItem}>
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {attendee.user?.name?.charAt(0).toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={styles.attendeeInfo}>
                  <Text style={styles.attendeeName}>
                    {attendee.user?.name || 'Unknown'}
                  </Text>
                  {attendee.plusOne && (
                    <Text style={styles.plusOneText}>+1</Text>
                  )}
                </View>
                {attendee.status !== 'going' && (
                  <View style={[
                    styles.statusBadge,
                    attendee.status === 'invited' && styles.invitedBadge,
                    attendee.status === 'maybe' && styles.maybeBadge,
                    attendee.status === 'declined' && styles.declinedBadge
                  ]}>
                    <Text style={styles.statusText}>
                      {attendee.status === 'invited' ? 'Invited' : 
                       attendee.status === 'maybe' ? 'Maybe' : 
                       attendee.status === 'declined' ? 'Declined' : 
                       attendee.status}
                    </Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noAttendeesText}>
              No one has joined this meetup yet.
            </Text>
          )}
        </View>
        
        <View style={styles.actionContainer}>
          {isOrganizer ? (
            <>
              <Button
                title="Edit Meetup"
                onPress={handleEditMeetup}
                style={styles.actionButton}
              />
              <Button
                title="Invite to Meetup"
                onPress={handleShowInviteModal}
                style={styles.actionButton}
              />
            </>
          ) : isAttending ? (
            <>
              <Button
                title="Chat with Attendees"
                onPress={handleOpenChat}
                style={styles.actionButton}
              />
              <Button
                title="Leave Meetup"
                onPress={handleLeaveMeetup}
                style={[styles.actionButton, styles.leaveButton] as any}
                disabled={leaving}
              />
            </>
          ) : (
            <Button
              title="Join Meetup"
              onPress={handleJoinMeetup}
              style={styles.actionButton}
              disabled={joining}
            />
          )}
        </View>
      </ScrollView>

      {/* Invite Friends Modal */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite Friends</Text>
            
            <Button
              title="Share Invitation Link"
              onPress={handleShareLink}
              style={styles.shareButton}
            />
            
            {uninvitedFriends.length > 0 ? (
              <FlatList
                data={uninvitedFriends}
                renderItem={renderFriendItem}
                keyExtractor={(item) => item.id}
                style={styles.friendsList}
              />
            ) : (
              <Text style={styles.noFriendsText}>
                No friends to invite. All your friends have already been invited.
              </Text>
            )}
            
            <Button
              title="Close"
              onPress={() => setShowInviteModal(false)}
              variant="secondary"
              style={styles.closeButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  organizer: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
  },
  section: {
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
    width: 120,
  },
  detailValue: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
  },
  attendeeInfo: {
    flex: 1,
  },
  attendeeName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
  plusOneText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.primary,
  },
  noAttendeesText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: spacing.sm,
  },
  invitedBadge: {
    backgroundColor: colors.primaryLight,
  },
  maybeBadge: {
    backgroundColor: '#FAD02C20',
  },
  declinedBadge: {
    backgroundColor: '#FF000020',
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  actionContainer: {
    marginVertical: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    marginBottom: spacing.md,
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
  },
  deleteIconButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: spacing.lg,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  shareButton: {
    marginBottom: spacing.lg,
  },
  friendsList: {
    maxHeight: 300,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  friendName: {
    flex: 1,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
  inviteButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  inviteButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  noFriendsText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginVertical: spacing.xl,
  },
  closeButton: {
    marginTop: spacing.md,
  },
  mapContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  mapWrapper: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  openMapsButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: 4,
    alignItems: 'center',
  },
  openMapsButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
  },
  leaveButton: {
    backgroundColor: colors.error,
    marginTop: spacing.sm,
  },
});

export default MeetupDetailsScreen; 