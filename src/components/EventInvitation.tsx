import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Event, respondToInvitation } from '../api/events';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

interface EventInvitationProps {
  event: Event;
  attendeeId: string;
  invitedBy?: any;
  onRespond: () => void;
}

const EventInvitation: React.FC<EventInvitationProps> = ({
  event,
  attendeeId,
  invitedBy,
  onRespond
}) => {
  const [loading, setLoading] = React.useState(false);

  // Format the date to display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  };

  const handleAccept = async (plusOne = false) => {
    try {
      setLoading(true);
      const success = await respondToInvitation(attendeeId, 'going', plusOne);
      if (success) {
        Alert.alert('Success', 'You have accepted the invitation!');
        onRespond();
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      Alert.alert('Error', 'Failed to accept the invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    try {
      setLoading(true);
      const success = await respondToInvitation(attendeeId, 'declined');
      if (success) {
        Alert.alert('Success', 'You have declined the invitation.');
        onRespond();
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      Alert.alert('Error', 'Failed to decline the invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get the name of the person who invited the user
  const inviterName = invitedBy?.name || "Someone";

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{event.title}</Text>
        <View style={styles.inviteBadge}>
          <Text style={styles.inviteBadgeText}>Invitation</Text>
        </View>
      </View>
      
      <Text style={styles.inviteText}>
        {inviterName} invited you to this event
      </Text>
      
      <View style={styles.detailsContainer}>
        <Text style={styles.dateText}>{formatDate(event.date)}</Text>
        <Text style={styles.locationText}>{event.location}</Text>
      </View>
      
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
      ) : (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.declineButton]}
            onPress={handleDecline}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.acceptButton]}
            onPress={() => handleAccept(false)}
          >
            <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
          
          {event.allowPlusOne && (
            <TouchableOpacity
              style={[styles.button, styles.plusOneButton]}
              onPress={() => handleAccept(true)}
            >
              <Text style={styles.acceptButtonText}>Accept +1</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
    borderLeftColor: colors.primary,
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    flex: 1,
  },
  inviteBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  inviteBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  inviteText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  detailsContainer: {
    marginBottom: spacing.md,
  },
  dateText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  locationText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  acceptButton: {
    backgroundColor: colors.primary,
  },
  plusOneButton: {
    backgroundColor: colors.success,
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.error,
  },
  acceptButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  declineButtonText: {
    color: colors.error,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  loader: {
    padding: spacing.md,
  },
});

export default EventInvitation; 