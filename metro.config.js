// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure additional file types are handled by Metro
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];

// Handle asset files
config.resolver.assetExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

// Add react-native-vector-icons to asset extensions
config.resolver.assetExts.push('ttf');

module.exports = config; 