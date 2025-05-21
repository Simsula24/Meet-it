import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
  Modal,
  Dimensions,
  Image,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { createEvent } from '../api/events';
import { useAuth } from '../contexts/AuthContext';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapViewWrapper from '../components/MapViewWrapper';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0222;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface CreateMeetupScreenProps {
  navigation: any;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

const CreateMeetupScreen: React.FC<CreateMeetupScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState(new Date());
  const [maxAttendees, setMaxAttendees] = useState('');
  const [canInviteOthers, setCanInviteOthers] = useState(true);
  const [allowPlusOne, setAllowPlusOne] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Location state
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);
  const [initialRegion, setInitialRegion] = useState<any>(null);
  
  // Date/time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // Get user's current location for initial position
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          // Set a default location (city center)
          setInitialRegion({
            latitude: 37.7749,
            longitude: -122.4194,
            latitudeDelta: LATITUDE_DELTA,
            longitudeDelta: LONGITUDE_DELTA,
          });
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        const region = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };
        setInitialRegion(region);
      } catch (error) {
        console.error('Error getting location:', error);
        // Set a default location if there's an error
        setInitialRegion({
          latitude: 37.7749,
          longitude: -122.4194,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
      }
    };

    getUserLocation();
  }, []);
  
  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (selectedDate) {
      // Preserve the time from the current date
      const newDate = new Date(selectedDate);
      newDate.setHours(date.getHours());
      newDate.setMinutes(date.getMinutes());
      setDate(newDate);
      
      // On iOS, show the time picker right after selecting a date
      if (Platform.OS === 'ios') {
        setTimeout(() => setShowTimePicker(true), 300);
      }
    }
  };
  
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    
    if (selectedTime) {
      // Keep the current date but update the time
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  const handleMapPress = (event: any) => {
    try {
      if (event && event.nativeEvent && event.nativeEvent.coordinate) {
        const newCoords = event.nativeEvent.coordinate;
        console.log('Map pressed at coordinates:', newCoords);
        
        // Validate coordinates before setting state
        if (typeof newCoords.latitude === 'number' && 
            typeof newCoords.longitude === 'number') {
          setCoordinates(newCoords);
        }
      }
    } catch (error) {
      console.error('Error handling map press:', error);
    }
  };

  const openLocationPicker = () => {
    // Reset map ready state when opening the modal
    setShowMapModal(true);
  };

  const closeLocationPicker = () => {
    // Close modal without changing coordinates
    setShowMapModal(false);
  };

  const confirmLocation = () => {
    // Make sure coordinates are valid before closing the modal
    if (coordinates && 
        typeof coordinates.latitude === 'number' && 
        typeof coordinates.longitude === 'number') {
      // Create a fresh copy of the coordinates to avoid reference issues
      const confirmedCoordinates = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      };
      
      // Update coordinates with a new object
      setCoordinates(confirmedCoordinates);
      
      // Close the modal
      setShowMapModal(false);
      
      // Wait for state updates to complete
      setTimeout(() => {
        console.log('Location confirmed:', confirmedCoordinates);
      }, 100);
    } else {
      Alert.alert('Error', 'Please select a valid location on the map first.');
    }
  };
  
  const handleCreateMeetup = async () => {
    // Basic validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a meetup title');
      return;
    }
    
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }
    
    try {
      setLoading(true);
      
      if (!user || !user.id) {
        Alert.alert('Error', 'You need to be logged in to create meetups');
        setLoading(false);
        return;
      }
      
      // Parse maxAttendees or set to undefined if empty
      const maxAttendeesNum = maxAttendees.trim() ? parseInt(maxAttendees, 10) : undefined;
      
      // Create a meetup object with coordinates if available
      const eventData = {
        title: title.trim(),
        location: location.trim(),
        date: date,
        description: '',
        maxAttendees: maxAttendeesNum,
        allowPlusOne,
        organizer: user.id,
        hasExactLocation: !!coordinates,
        coordinates: coordinates || undefined
      };

      console.log('Creating event with data:', JSON.stringify(eventData));
      
      // Create the event
      const newEvent = await createEvent(eventData);
      
      Alert.alert('Success', 'Your meetup has been created!');
      
      // Navigate back to the meetups list or to the new meetup details
      navigation.navigate('MeetupDetails', { eventId: newEvent.id });
    } catch (error: any) {
      console.error('Error creating meetup:', error);
      
      // Show more detailed error message
      const errorMessage = error.response?.data ? 
        `Failed to create meetup: ${JSON.stringify(error.response.data)}` : 
        'Failed to create meetup. Please try again.';
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Map modal
  const renderMapModal = () => (
    <Modal
      visible={showMapModal}
      animationType="slide"
      transparent={false}
      onRequestClose={closeLocationPicker}
    >
      <View style={styles.mapModalContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapHeaderText}>Select Meetup Location</Text>
          <Text style={styles.mapSubheaderText}>Tap on the map to place a marker</Text>
        </View>
        
        {initialRegion && (
          <View style={styles.mapWrapper}>
            <MapViewWrapper
              style={styles.map}
              region={initialRegion}
              onMapPress={handleMapPress}
              showMarker={!!coordinates}
              markerCoordinate={coordinates || undefined}
              markerTitle="Meetup Location"
              markerDescription={location}
            />
          </View>
        )}
        
        <View style={styles.mapButtonContainer}>
          <TouchableOpacity
            style={[styles.mapButton, styles.cancelMapButton]}
            onPress={closeLocationPicker}
          >
            <Text style={styles.cancelMapButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mapButton, styles.confirmMapButton]}
            onPress={confirmLocation}
            disabled={!coordinates}
          >
            <Text style={styles.confirmMapButtonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create New Meetup</Text>
        </View>
        
        <View style={styles.formContainer}>
          <TextInput
            label="Meetup Title"
            placeholder="Enter meetup title"
            value={title}
            onChangeText={setTitle}
          />
          
          <View style={styles.locationContainer}>
            <View style={styles.locationInputContainer}>
              <TextInput
                label="Location"
                placeholder="Enter meetup location"
                value={location}
                onChangeText={setLocation}
                containerStyle={styles.locationInput}
              />
            </View>
            <TouchableOpacity 
              style={styles.mapPinButton}
              onPress={openLocationPicker}
            >
              <Text style={styles.mapPinText}>📍</Text>
            </TouchableOpacity>
          </View>
          
          {coordinates && (
            <View style={styles.mapPreviewContainer}>
              <Text style={styles.mapPreviewLabel}>Selected Location:</Text>
              <View style={styles.mapPreviewWrapper}>
                <MapViewWrapper
                  style={styles.mapPreview}
                  region={{
                    latitude: coordinates.latitude,
                    longitude: coordinates.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  showMarker={true}
                  markerCoordinate={coordinates}
                  markerTitle="Meetup Location"
                />
              </View>
              <TouchableOpacity 
                style={styles.clearLocationButton}
                onPress={() => setCoordinates(null)}
              >
                <Text style={styles.clearLocationText}>Clear Location</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.dateTimeContainer}>
            <Text style={styles.label}>Date & Time</Text>
            
            <View style={styles.dateTimeRow}>
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateTimeText}>
                  {formatDate(date)}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateTimeText}>
                  {formatTime(date)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TextInput
            label="Max Attendees (Optional)"
            placeholder="Enter maximum number of attendees"
            value={maxAttendees}
            onChangeText={setMaxAttendees}
            keyboardType="numeric"
          />
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Attendees can invite others</Text>
            <Switch
              value={canInviteOthers}
              onValueChange={setCanInviteOthers}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background.primary}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Attendees can bring a plus one</Text>
            <Switch
              value={allowPlusOne}
              onValueChange={setAllowPlusOne}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background.primary}
            />
          </View>
          
          <Button
            title="Create Meetup"
            onPress={handleCreateMeetup}
            loading={loading}
            style={styles.createButton}
          />
          
          <Button
            title="Cancel"
            onPress={() => navigation.goBack()}
            variant="secondary"
            style={styles.cancelButton}
          />
        </View>
      </ScrollView>
      
      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
      
      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}

      {/* Map Modal */}
      {renderMapModal()}
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
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  formContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    padding: spacing.lg,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end', 
    marginBottom: spacing.md,
  },
  locationInputContainer: {
    flex: 1,
  },
  locationInput: {
    marginBottom: 0,
  },
  mapPinButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.primary,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    marginBottom: 4,
  },
  mapPinText: {
    fontSize: 24,
    color: colors.text.inverse,
  },
  mapPreviewContainer: {
    marginBottom: spacing.md,
  },
  mapPreviewLabel: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  mapPreviewWrapper: {
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  mapPreview: {
    height: 150,
    width: '100%',
    borderRadius: 4,
  },
  clearLocationButton: {
    alignSelf: 'flex-end',
  },
  clearLocationText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
  },
  dateTimeContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeButton: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  dateTimeText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  switchLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
  },
  createButton: {
    marginTop: spacing.lg,
  },
  cancelButton: {
    marginTop: spacing.sm,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  mapHeader: {
    padding: spacing.md,
    backgroundColor: colors.primary,
  },
  mapHeaderText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  mapSubheaderText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.inverse,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapButtonContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mapButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelMapButton: {
    backgroundColor: colors.background.secondary,
    marginRight: spacing.sm,
  },
  confirmMapButton: {
    backgroundColor: colors.primary,
  },
  cancelMapButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
  confirmMapButtonText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.inverse,
  },
});

export default CreateMeetupScreen; 