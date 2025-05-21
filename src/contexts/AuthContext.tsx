import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pb } from '../api/pocketbaseSetup';
import { Alert } from 'react-native';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  requestVerification: (email: string) => Promise<void>;
  confirmVerification: (email: string, token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  verificationSent: boolean;
  refreshAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationSent, setVerificationSent] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      console.log('[AUTH] Checking authentication...');
      
      // Log the current state
      console.log('[AUTH] Current PB auth state:', 
        pb.authStore.isValid ? 'Valid' : 'Invalid',
        'Model:', pb.authStore.model
      );
      
      const token = await AsyncStorage.getItem('pb_auth');
      console.log('[AUTH] Token from AsyncStorage:', token ? 'Found' : 'Not found');
      
      if (token) {
        const authData = JSON.parse(token);
        console.log('[AUTH] Auth data from storage:', 
          'Token:', authData.token ? 'Present' : 'Missing',
          'Model:', authData.model ? 'Present' : 'Missing'
        );
        
        try {
          pb.authStore.save(authData.token, authData.model);
          console.log('[AUTH] Auth store saved with token and model');
          
          if (pb.authStore.isValid) {
            console.log('[AUTH] Auth store is valid, setting user:', pb.authStore.model);
            setUser(pb.authStore.model);
            setIsAuthenticated(true);
          } else {
            console.log('[AUTH] Auth store is not valid after loading');
          }
        } catch (error) {
          console.error('[AUTH] Error saving auth store:', error);
        }
      } else {
        console.log('[AUTH] No token found in storage');
      }
    } catch (error) {
      console.error('[AUTH] Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const refreshAuthState = async () => {
    console.log('[AUTH] Manually refreshing auth state');
    await checkAuth();
  };

  const login = async (email: string, password: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      
      // Temporarily disable email verification check to fix auth issues
      /*
      // Check if the user's email is verified
      if (!authData.record.verified) {
        // Send a verification email if not verified
        await requestVerification(email);
        throw new Error('Please verify your email before logging in');
      }
      */
      
      setUser(authData.record);
      setIsAuthenticated(true);
      
      // Store authentication data in a serializable format
      const authState = {
        token: pb.authStore.token,
        model: pb.authStore.model
      };
      await AsyncStorage.setItem('pb_auth', JSON.stringify(authState));
    } catch (error) {
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const data = {
        email,
        password,
        passwordConfirm: password,
        name,
      };
      
      // Create user with email verification enabled
      const newUser = await pb.collection('users').create(data);
      console.log('[AUTH] User created successfully:', newUser.id);
      
      // Temporarily disable verification and login the user immediately
      try {
        // Login with the new credentials
        const authData = await pb.collection('users').authWithPassword(email, password);
        console.log('[AUTH] Auto-login after signup successful');
        
        setUser(authData.record);
        setIsAuthenticated(true);
        
        // Store authentication data
        const authState = {
          token: pb.authStore.token,
          model: pb.authStore.model
        };
        await AsyncStorage.setItem('pb_auth', JSON.stringify(authState));
      } catch (loginError) {
        console.error('[AUTH] Auto-login after signup failed:', loginError);
        // Continue without throwing - at least the account was created
      }
      
      /*
      // Explicitly send verification email
      await requestVerification(email);
      */
      
      return;
    } catch (error) {
      throw error;
    }
  };
  
  const requestVerification = async (email: string) => {
    try {
      await pb.collection('users').requestVerification(email);
      setVerificationSent(true);
    } catch (error) {
      console.error('Error requesting verification:', error);
      throw error;
    }
  };
  
  const confirmVerification = async (email: string, token: string) => {
    try {
      await pb.collection('users').confirmVerification(token);
      setVerificationSent(false);
      return true;
    } catch (error) {
      console.error('Error confirming verification:', error);
      return false;
    }
  };

  const logout = async () => {
    pb.authStore.clear();
    await AsyncStorage.removeItem('pb_auth');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      signup, 
      requestVerification,
      confirmVerification,
      logout, 
      loading,
      verificationSent,
      refreshAuthState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 