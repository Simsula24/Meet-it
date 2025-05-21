import PocketBase from 'pocketbase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize PocketBase client with the correct URL
export const pb = new PocketBase('http://127.0.0.1:8090');

// Load auth state from storage
const loadAuth = async () => {
  try {
    const authData = await AsyncStorage.getItem('pb_auth');
    if (authData) {
      const { token, model } = JSON.parse(authData);
      pb.authStore.save(token, model);
      console.log('Auth state loaded:', { token: !!token, model: !!model });
    } else {
      console.log('No auth state found in storage');
    }
  } catch (error) {
    console.error('Error loading auth state:', error);
  }
};

// Save auth state to storage when it changes
pb.authStore.onChange(() => {
  try {
    const authState = {
      token: pb.authStore.token,
      model: pb.authStore.model
    };
    AsyncStorage.setItem('pb_auth', JSON.stringify(authState));
    console.log('Auth state saved:', { token: !!authState.token, model: !!authState.model });
  } catch (error) {
    console.error('Error saving auth state:', error);
  }
});

// Load auth state on initialization
loadAuth();

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
  const isValid = pb.authStore.isValid;
  console.log('Auth check:', { isValid, token: !!pb.authStore.token });
  return isValid;
};

// Helper function to get current user
export const getCurrentUser = () => {
  const user = pb.authStore.model;
  console.log('Current user:', { id: user?.id, name: user?.name });
  return user;
}; 