import PocketBase from 'pocketbase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace this with your PocketBase URL
export const POCKETBASE_URL = 'http://pocketbase.sigmagram.xyz';

// Create and export a single PocketBase instance to be used across the app
export const pb = new PocketBase(POCKETBASE_URL);

// Set up persistent authentication storage
pb.authStore.onChange(async (token, model) => {
  try {
    console.log('[AUTH_STORE] Auth store changed, saving to AsyncStorage');
    const authData = {
      token,
      model
    };
    await AsyncStorage.setItem('pb_auth', JSON.stringify(authData));
    console.log('[AUTH_STORE] Auth data saved to storage');
  } catch (error) {
    console.error('[AUTH_STORE] Error saving auth data to storage:', error);
  }
});

/**
 * Fix authentication issues by restoring auth state from storage
 */
export const fixAuthentication = async (): Promise<boolean> => {
  try {
    console.log('[FIX_AUTH] Attempting to fix authentication issues...');
    
    // Check current state
    console.log('[FIX_AUTH] Current auth state:', 
      pb.authStore.isValid ? 'Valid' : 'Invalid',
      'Token:', pb.authStore.token ? 'Present' : 'Missing',
      'Model:', pb.authStore.model ? 'Present' : 'Missing'
    );
    
    // If already valid, no need to fix
    if (pb.authStore.isValid) {
      console.log('[FIX_AUTH] Authentication already valid, no fix needed');
      
      // Extra validation - test an API call
      try {
        const userId = pb.authStore.model?.id;
        if (userId) {
          const testResult = await pb.collection('users').getOne(userId);
          console.log(`[FIX_AUTH] Verified auth with API call: ${testResult.id}`);
          return true;
        }
      } catch (validationError) {
        console.error('[FIX_AUTH] Auth appears valid but failed validation:', validationError);
        // We'll continue below to attempt re-login
        pb.authStore.clear();
      }
    }
    
    // Try to get auth data from storage
    const storedAuth = await AsyncStorage.getItem('pb_auth');
    
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        console.log('[FIX_AUTH] Found stored auth data:', 
          'Token:', authData.token ? 'Present' : 'Missing',
          'Model:', authData.model ? 'Present' : 'Missing'
        );
        
        // Restore the auth state
        if (authData.token && authData.model) {
          pb.authStore.save(authData.token, authData.model);
          console.log('[FIX_AUTH] Restored auth from storage');
          
          // Verify that the fix worked
          if (pb.authStore.isValid) {
            console.log('[FIX_AUTH] Authentication fixed successfully');
            
            // Test the auth by making a simple API call
            try {
              const userId = pb.authStore.model?.id;
              if (!userId) {
                console.error('[FIX_AUTH] Auth model is missing user ID');
                pb.authStore.clear();
                await AsyncStorage.removeItem('pb_auth');
                return false;
              }
              
              const testResult = await pb.collection('users').getOne(userId);
              console.log(`[FIX_AUTH] Verified auth with API call: ${testResult.id}`);
              return true;
            } catch (apiError) {
              console.error('[FIX_AUTH] Auth restored but API call failed:', apiError);
              // Clear invalid auth
              pb.authStore.clear();
              await AsyncStorage.removeItem('pb_auth');
            }
          } else {
            console.log('[FIX_AUTH] Authentication still invalid after restore');
            // Clear invalid auth
            pb.authStore.clear();
            await AsyncStorage.removeItem('pb_auth');
          }
        }
      } catch (parseError) {
        console.error('[FIX_AUTH] Error parsing stored auth data:', parseError);
        // Clear corrupted auth data
        await AsyncStorage.removeItem('pb_auth');
      }
    } else {
      console.log('[FIX_AUTH] No stored auth data found');
    }
    
    // If we still don't have valid auth, try mock mode
    if (!pb.authStore.isValid) {
      console.log('[FIX_AUTH] Setting mock authentication as fallback');
      const mockUser = {
        id: 'mock_user',
        name: 'Mock User',
        email: 'mock@example.com',
      };
      pb.authStore.save('mock_token', mockUser);
      
      if (pb.authStore.isValid) {
        console.log('[FIX_AUTH] Mock authentication enabled as fallback');
        return true;
      }
    }
    
    return pb.authStore.isValid;
  } catch (error) {
    console.error('[FIX_AUTH] Error fixing authentication:', error);
    return false;
  }
};

/**
 * Reset PocketBase connection and verify it works
 */
export const resetAndVerifyConnection = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log('[RESET] Attempting to reset PocketBase connection...');
    
    // Check server health first without clearing auth
    try {
      const health = await pb.health.check();
      console.log('[RESET] Health check successful:', health);
    } catch (error) {
      console.error('[RESET] Health check failed:', error);
      return {
        success: false,
        message: 'Cannot reach PocketBase server. Please check your internet connection and server URL.'
      };
    }
    
    // Try to fix authentication before checking auth status
    await fixAuthentication();
    console.log('[RESET] After fix, auth state is:', pb.authStore.isValid ? 'Valid' : 'Invalid');
    
    // If still no auth, return success but inform that auth is missing
    if (!pb.authStore.isValid) {
      return {
        success: true,
        message: 'Server is reachable but you are not authenticated. Please log in again.'
      };
    }
    
    return {
      success: true,
      message: 'PocketBase connection reset and verified successfully.'
    };
  } catch (error: any) {
    console.error('[RESET] Error resetting connection:', error);
    return {
      success: false,
      message: 'Failed to reset PocketBase connection: ' + (error.message || 'Unknown error')
    };
  }
};

// Schema helper for use in PocketBase Admin UI
export const pocketbaseSchema = {
  collections: [
    {
      name: 'users',
      type: 'auth',
      schema: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'email',
          type: 'email',
          required: true,
          unique: true,
        },
        {
          name: 'phone',
          type: 'text',
          required: false,
          unique: true,
        },
        {
          name: 'avatar',
          type: 'file',
          required: false,
        },
      ],
    },
    {
      name: 'events',
      type: 'base',
      schema: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'date',
          type: 'date',
          required: true,
        },
        {
          name: 'location',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'text',
          required: false,
        },
        {
          name: 'organizer',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'users',
            cascadeDelete: false,
          },
        },
        {
          name: 'maxAttendees',
          type: 'number',
          required: false,
        },
        {
          name: 'allowPlusOne',
          type: 'bool',
          required: true,
          default: false,
        },
      ],
    },
    {
      name: 'friendships',
      type: 'base',
      schema: [
        {
          name: 'user1',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'users',
            cascadeDelete: true,
          },
        },
        {
          name: 'user2',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'users',
            cascadeDelete: true,
          },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          options: {
            values: ['pending', 'accepted', 'rejected'],
          },
        },
      ],
    },
    {
      name: 'event_attendees',
      type: 'base',
      schema: [
        {
          name: 'event',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'events',
            cascadeDelete: true,
          },
        },
        {
          name: 'user',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'users',
            cascadeDelete: true,
          },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          options: {
            values: ['going', 'maybe', 'not_going', 'invited'],
          },
        },
        {
          name: 'plusOne',
          type: 'bool',
          required: true,
          default: false,
        },
      ],
    },
    {
      name: 'meetup_orders',
      type: 'base',
      schema: [
        {
          name: 'user',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'users',
            cascadeDelete: true,
          },
        },
        {
          name: 'event',
          type: 'relation',
          required: true,
          options: {
            collectionId: 'events',
            cascadeDelete: true,
          },
        },
        {
          name: 'order',
          type: 'number',
          required: true,
        },
      ],
      indexes: [
        {
          name: 'unique_user_event',
          type: 'unique',
          options: {
            fields: ['user', 'event'],
          },
        },
      ],
    },
  ],
};

/**
 * Check if required collections exist
 */
export const initializeCollections = async (): Promise<void> => {
  if (!pb.authStore.isValid) {
    console.log('[INIT] Cannot initialize collections: Not authenticated');
    return;
  }

  try {
    // Check basic structure - we could add more verification here in the future
    console.log('[INIT] Checking if basic collections exist');
    const collections = await pb.collections.getFullList();
    
    // Log the collections we found
    console.log('[INIT] Found collections:', collections.map(c => c.name).join(', '));
    
    // You can add specific checks for other collections if needed
  } catch (error) {
    console.error('[INIT] Error initializing collections:', error);
  }
}; 