import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  Dimensions,
  Platform,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import MapViewWrapper from './MapViewWrapper';
import { useAuth } from '../contexts/AuthContext';
import { Entypo } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface MeetupCardProps {
  id: string;
  title: string;
  location: string;
  date: Date;
  attendeesCount: number;
  maxAttendees?: number;
  organizer: string;
  coordinates?: Coordinates;
  hasExactLocation?: boolean;
  onPress: (id: string) => void;
  style?: ViewStyle;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const MeetupCard: React.FC<MeetupCardProps> = ({
  id,
  title,
  location,
  date,
  attendeesCount,
  maxAttendees,
  organizer,
  coordinates,
  hasExactLocation,
  onPress,
  style,
  onDragStart,
  onDragEnd,
}) => {
  // Add component identification for debugging
  const cardId = `card-${id.substring(0, 6)}`;
  
  // Format the date to display
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Safe map rendering with error handling
  const renderMap = () => {
    if (!hasExactLocation || !coordinates) return null;
    
    try {
      return (
        <View style={styles.mapContainer}>
          <View style={styles.mapWrapper}>
            <MapViewWrapper
              style={styles.map}
              region={{
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
              showMarker={true}
              markerCoordinate={coordinates}
              liteMode={true} // Use lite mode for better performance
            />
          </View>
        </View>
      );
    } catch (error) {
      console.error('Error rendering map in MeetupCard:', error);
      return (
        <View style={[styles.mapContainer, styles.mapErrorContainer]}>
          <Text style={styles.mapErrorText}>📍 Location set</Text>
        </View>
      );
    }
  };

  const handleDragStart = () => {
    if (onDragStart) {
      onDragStart();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => onPress(id)}
      activeOpacity={0.7}
      onLongPress={handleDragStart}
      delayLongPress={100}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        <View style={styles.dateContainer}>
          <Text style={styles.date}>{formatDate(date)}</Text>
        </View>
      </View>
      
      <View style={styles.locationContainer}>
        <Text style={styles.locationText} numberOfLines={1} ellipsizeMode="tail">
          {location}
        </Text>
      </View>
      
      {renderMap()}
      
      <View style={styles.footer}>
        <View style={styles.attendeesContainer}>
          <Text style={styles.attendeesText}>
            {attendeesCount} {attendeesCount === 1 ? 'person' : 'people'} going
            {maxAttendees ? ` · Max ${maxAttendees}` : ''}
          </Text>
        </View>
        <View style={styles.footerControls}>
          <Text style={styles.organizerText}>
            by {organizer}
          </Text>
          {onDragStart && (
            <View style={styles.dragHandle}>
              <Entypo name="menu" size={18} color={colors.text.secondary} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  dateContainer: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  date: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  locationText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  mapContainer: {
    width: '100%',
    marginBottom: spacing.md,
  },
  mapWrapper: {
    height: 120,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attendeesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendeesText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  organizerText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  mapErrorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    height: 60,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  mapErrorText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
  },
  footerControls: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  dragHandle: {
    padding: 2,
    marginTop: 2,
  },
});

export default MeetupCard; 