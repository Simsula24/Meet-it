import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native';
import { colors, typography } from '../theme';
import { areMapsDisabled, useMapPlaceholders } from '../config/featureFlags';

// Conditional import to prevent MapView from being imported when maps are disabled
let MapView: any = null;
let Marker: any = null;
let PROVIDER_DEFAULT: any = null;

// Only import the map components when maps are not disabled
if (!areMapsDisabled() && Platform.OS === 'ios') {
  try {
    const MapComponents = require('react-native-maps');
    MapView = MapComponents.default;
    Marker = MapComponents.Marker;
    PROVIDER_DEFAULT = MapComponents.PROVIDER_DEFAULT;
  } catch (error) {
    console.error('Failed to load react-native-maps:', error);
  }
}

// Define types without importing from react-native-maps
interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapWrapperProps {
  region: Region;
  showMarker?: boolean;
  markerCoordinate?: {
    latitude: number;
    longitude: number;
  };
  markerTitle?: string;
  markerDescription?: string;
  style?: any;
  onMapPress?: (event: any) => void;
  onMapReady?: () => void;
  children?: React.ReactNode;
  liteMode?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
}

const MapViewWrapper: React.FC<MapWrapperProps> = ({
  region,
  showMarker = false,
  markerCoordinate,
  markerTitle,
  markerDescription,
  style,
  onMapPress,
  onMapReady,
  children,
  liteMode = false,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const mapsDisabled = areMapsDisabled();
  const usePlaceholder = useMapPlaceholders();

  // Add a safety timeout to detect loading issues
  useEffect(() => {
    if (mapsDisabled || usePlaceholder) return; // Skip when not showing real maps
    
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log('Map loading timed out, showing error state');
        setIsLoading(false);
        setHasError(true);
      }
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(timeoutId);
  }, [isLoading, mapsDisabled, usePlaceholder]);

  // Validate the region to prevent crashes
  const isRegionValid = region && 
    typeof region.latitude === 'number' && 
    typeof region.longitude === 'number' && 
    typeof region.latitudeDelta === 'number' && 
    typeof region.longitudeDelta === 'number';

  // Validate marker coordinates
  const isMarkerValid = !showMarker || (markerCoordinate && 
    typeof markerCoordinate.latitude === 'number' && 
    typeof markerCoordinate.longitude === 'number');

  const handleMapReady = () => {
    setIsLoading(false);
    if (onMapReady) {
      onMapReady();
    }
  };

  // If region is invalid, show error instead of crashing
  if (!isRegionValid) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorText}>Invalid map location</Text>
      </View>
    );
  }

  // Use placeholder when maps are disabled or placeholders are preferred
  if (mapsDisabled || usePlaceholder) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>📍 Location Set</Text>
          {markerTitle && (
            <Text style={styles.placeholderSubtext} numberOfLines={1}>
              {markerTitle || markerDescription || ''}
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Only render actual map if maps are enabled and MapView is available
  if (!MapView) {
    return (
      <View style={[styles.container, styles.errorContainer, style]}>
        <Text style={styles.errorText}>Maps not available on this device</Text>
      </View>
    );
  }

  // Standard map implementation
  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        region={region}
        provider={PROVIDER_DEFAULT}
        onPress={onMapPress}
        onMapReady={handleMapReady}
        liteMode={liteMode}
        {...props}
      >
        {showMarker && isMarkerValid && markerCoordinate && Marker && (
          <Marker
            coordinate={markerCoordinate}
            title={markerTitle}
            description={markerDescription}
          />
        )}
        {children}
      </MapView>

      {isLoading && !liteMode && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      )}

      {hasError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Could not load map</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    textAlign: 'center',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  placeholderText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  placeholderSubtext: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    marginTop: 4,
  }
});

export default MapViewWrapper; 