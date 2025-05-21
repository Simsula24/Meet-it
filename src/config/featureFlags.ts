import { Platform } from 'react-native';

type PlatformType = 'ios' | 'android' | 'windows' | 'macos' | 'web';

interface PlatformConfig {
  disabled: boolean;
  usePlaceholders: boolean;
}

interface MapFeatureConfig {
  enabled: boolean;
  android: PlatformConfig;
  ios: PlatformConfig;
  [key: string]: PlatformConfig | boolean; // Index signature for other platforms
}

interface FeatureFlags {
  maps: MapFeatureConfig;
}

// Feature flags for the application
export const featureFlags: FeatureFlags = {
  // Map-related features
  maps: {
    // Enable/disable map functionality completely
    enabled: true,
    
    // Platform-specific settings
    android: {
      // Force disable maps on Android to prevent crashes
      disabled: true,
      // Use placeholder UI instead of real maps on Android
      usePlaceholders: true,
    },
    ios: {
      disabled: false,
      usePlaceholders: false,
    },
    // Add defaults for other platforms
    windows: { disabled: true, usePlaceholders: true },
    macos: { disabled: false, usePlaceholders: false },
    web: { disabled: true, usePlaceholders: true }
  }
};

// Helper functions to check features
export const isFeatureEnabled = (featurePath: string): boolean => {
  try {
    const path = featurePath.split('.');
    let current: any = featureFlags;
    
    for (const segment of path) {
      if (current[segment] === undefined) return false;
      current = current[segment];
    }
    
    return typeof current === 'boolean' ? current : Boolean(current.enabled);
  } catch (error) {
    console.error('Error checking feature flag:', error);
    return false;
  }
};

// Check if maps should be completely disabled for the current platform
export const areMapsDisabled = (): boolean => {
  if (!isFeatureEnabled('maps')) return true;
  
  const platform = Platform.OS as PlatformType;
  // Default to true (disabled) for unsupported platforms
  if (!featureFlags.maps[platform]) return true;
  
  return Boolean((featureFlags.maps[platform] as PlatformConfig).disabled);
};

// Check if map placeholders should be used instead of real maps
export const useMapPlaceholders = (): boolean => {
  if (areMapsDisabled()) return true;
  
  const platform = Platform.OS as PlatformType;
  // Default to true for unsupported platforms
  if (!featureFlags.maps[platform]) return true;
  
  return Boolean((featureFlags.maps[platform] as PlatformConfig).usePlaceholders);
};

export default featureFlags; 