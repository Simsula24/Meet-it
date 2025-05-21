const fs = require('fs');
const path = require('path');

// Create a file that will be imported by the app to inject authentication
const INJECT_FILE = path.join(__dirname, 'src', 'api', 'injectAuth.ts');

// This is the auth token and user ID from your working session
// Replace these with actual values from a working session
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN_HERE'; // Replace with a valid token
const USER_ID = 'YOUR_USER_ID_HERE';       // Replace with a valid user ID

// Create the inject file content
const injectContent = `
// This file is auto-generated to inject authentication
// It will be imported by pocketbaseSetup.ts

import { pb } from './pocketbaseSetup';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Immediately inject the auth token
export const injectAuth = async () => {
  try {
    console.log('[INJECT] Injecting authentication token');
    
    // The auth token from a working session
    const token = '${AUTH_TOKEN}';
    const userId = '${USER_ID}';
    
    if (!token || !userId || token === 'YOUR_AUTH_TOKEN_HERE') {
      console.error('[INJECT] Invalid token or user ID. Please update inject-auth.js');
      return;
    }
    
    // Save to PocketBase auth store
    pb.authStore.save(token, { id: userId });
    console.log('[INJECT] Token injected to PocketBase auth store');
    
    // Also save to AsyncStorage for persistence
    const authData = {
      token,
      model: { id: userId }
    };
    await AsyncStorage.setItem('pb_auth', JSON.stringify(authData));
    console.log('[INJECT] Token saved to AsyncStorage');
    
    // Verify auth is working
    if (pb.authStore.isValid) {
      console.log('[INJECT] Authentication is valid');
      
      // Test with an API call
      try {
        const user = await pb.collection('users').getOne(userId);
        console.log('[INJECT] Authentication verified with API call');
      } catch (apiError) {
        console.error('[INJECT] API call failed, token may be invalid:', apiError);
      }
    } else {
      console.error('[INJECT] Authentication is not valid after injection');
    }
  } catch (error) {
    console.error('[INJECT] Error injecting auth:', error);
  }
};

// Call immediately
injectAuth();
`;

// Write the file
fs.writeFileSync(INJECT_FILE, injectContent);

console.log(`Auth injection file created at ${INJECT_FILE}`);
console.log('');
console.log('IMPORTANT: You need to:');
console.log('1. Replace the placeholder token and user ID in the file');
console.log('2. Import this file in your app entry point (e.g., App.tsx):');
console.log('');
console.log('   import \'./src/api/injectAuth\';');
console.log('');
console.log('3. Rebuild and restart your app'); 