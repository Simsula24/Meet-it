import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, typography } from '../theme';
import { getEvent, updateEvent } from '../api/events';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';
import { EditMeetupScreenNavigationProp } from '../types/navigation';

interface EditMeetupScreenProps {
  route: { params: { eventId: string } };
  navigation: EditMeetupScreenNavigationProp;
}

const EditMeetupScreen: React.FC<EditMeetupScreenProps> = ({ route, navigation }) => {
  const { eventId } = route.params;
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [maxAttendees, setMaxAttendees] = useState<string>('');
  const [allowPlusOne, setAllowPlusOne] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  useEffect(() => {
    const loadMeetupData = async () => {
      try {
        setLoading(true);
        const meetup = await getEvent(eventId);
        
        // Verify that the current user is the organizer
        if (meetup.organizer !== user?.id) {
          Alert.alert(
            'Permission Denied',
            'You can only edit meetups that you organized.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
          return;
        }
        
        // Set form data
        setTitle(meetup.title || '');
        setLocation(meetup.location || '');
        setDescription(meetup.description || '');
        setDate(new Date(meetup.date));
        setMaxAttendees(meetup.maxAttendees ? meetup.maxAttendees.toString() : '');
        setAllowPlusOne(meetup.allowPlusOne || false);
      } catch (error) {
        console.error('Error loading meetup data:', error);
        Alert.alert(
          'Error',
          'Failed to load meetup details. Please try again.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } finally {
        setLoading(false);
      }
    };
    
    loadMeetupData();
  }, [eventId, user?.id, navigation]);

  const handleSave = async () => {
    try {
      if (!title.trim()) {
        Alert.alert('Error', 'Please enter a title for the meetup');
        return;
      }
      
      if (!location.trim()) {
        Alert.alert('Error', 'Please enter a location for the meetup');
        return;
      }
      
      setSaving(true);
      
      const updatedMeetup = {
        title: title.trim(),
        location: location.trim(),
        description: description.trim(),
        date: date.toISOString(),
        maxAttendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
        allowPlusOne,
      };
      
      await updateEvent(eventId, updatedMeetup);
      
      Alert.alert(
        'Success',
        'Meetup updated successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error updating meetup:', error);
      Alert.alert('Error', 'Failed to update meetup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Edit Meetup</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter meetup title"
            placeholderTextColor={colors.text.secondary}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter meetup location"
            placeholderTextColor={colors.text.secondary}
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter meetup description"
            placeholderTextColor={colors.text.secondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Date & Time</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{formatDisplayDate(date)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="datetime"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Max Attendees (Optional)</Text>
          <TextInput
            style={styles.input}
            value={maxAttendees}
            onChangeText={setMaxAttendees}
            placeholder="Leave blank for unlimited"
            placeholderTextColor={colors.text.secondary}
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Allow Plus One</Text>
          <Switch
            value={allowPlusOne}
            onValueChange={setAllowPlusOne}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={Platform.OS === 'ios' ? '#fff' : allowPlusOne ? colors.primaryLight : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.button}
          />
          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={saving}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
  },
  datePickerButton: {
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  button: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
});

export default EditMeetupScreen; 