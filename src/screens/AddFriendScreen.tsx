import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { searchUsers, sendFriendRequest, UserRecord } from '../api/friendship';
import { pb, fixAuthentication } from '../api/pocketbaseSetup';
import { useAuth } from '../contexts/AuthContext';

interface AddFriendScreenProps {
  navigation: any;
}

const AddFriendScreen: React.FC<AddFriendScreenProps> = ({ navigation }) => {
  const { user, isAuthenticated, refreshAuthState } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [authStatus, setAuthStatus] = useState<string>('Checking...');

  // Check auth status when component mounts
  useEffect(() => {
    const checkAuthStatus = async () => {
      await refreshAuthState();
      
      if (isAuthenticated && user) {
        setAuthStatus(`Logged in as: ${user.name || user.email} (${user.id})`);
      } else if (pb.authStore.isValid) {
        setAuthStatus(`PocketBase auth valid, but context not updated`);
        // Force refresh auth context
        await refreshAuthState();
      } else {
        setAuthStatus('Not authenticated');
      }
    };
    
    checkAuthStatus();
  }, [refreshAuthState, isAuthenticated, user]);

  // Search as user types with debouncing
  useEffect(() => {
    // Don't search if query is too short
    if (!searchQuery || searchQuery.length < 1) {
      setSearchResults([]);
      return;
    }

    // Set up a debounce timer to avoid too many API calls
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300); // 300ms debounce time

    // Clear the timeout if the component unmounts or searchQuery changes
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    try {
      setLoading(true);
      
      // Fix authentication first
      await fixAuthentication();
      // Make sure auth context is up to date
      await refreshAuthState();
      
      if (!isAuthenticated || !user) {
        console.error('[ADD_FRIEND] Not authenticated. Auth status:', { 
          isAuthenticated,
          contextUser: user?.id,
          pbAuthValid: pb.authStore.isValid,
          pbAuthUser: pb.authStore.model?.id
        });
        
        setLoading(false);
        return;
      }
      
      console.log('[ADD_FRIEND] Searching users matching:', query);
      console.log('[ADD_FRIEND] Current user ID:', user.id);
      
      const results = await searchUsers(query, user.id);
      console.log('[ADD_FRIEND] Found', results.length, 'results');
      setSearchResults(results);
    } catch (error) {
      console.error('[ADD_FRIEND] Error searching users:', error);
      // Show error to user so they know something went wrong
      Alert.alert('Search Error', 'Failed to search for users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (receiverId: string) => {
    try {
      setLoading(true);
      
      // Fix authentication first
      await fixAuthentication();
      // Make sure auth context is up to date
      await refreshAuthState();
      
      if (!isAuthenticated || !user) {
        Alert.alert('Error', 'You must be logged in to send friend requests');
        setLoading(false);
        return;
      }
      
      console.log('[ADD_FRIEND] Sending friend request from', user.id, 'to', receiverId);
      await sendFriendRequest(user.id, receiverId);
      Alert.alert('Success', 'Friend request sent successfully');
      
      // Remove the user from search results
      setSearchResults(prevResults => 
        prevResults.filter(userRecord => userRecord.id !== receiverId)
      );
    } catch (error) {
      console.error('[ADD_FRIEND] Error sending friend request:', error);
      
      // Handle specific errors with user-friendly messages
      if (error instanceof Error) {
        if (error.message.includes('already pending')) {
          Alert.alert('Already Requested', 'You have already sent a friend request to this user');
        } else if (error.message.includes('already friends')) {
          Alert.alert('Already Friends', 'You are already friends with this user');
        } else {
          Alert.alert('Error', `Failed to send friend request: ${error.message}`);
        }
      } else {
        Alert.alert('Error', 'Failed to send friend request');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item }: { item: UserRecord }) => (
    <View style={styles.userItem}>
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        {item.email && <Text style={styles.userEmail}>{item.email}</Text>}
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => handleSendFriendRequest(item.id)}
      >
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyResults = () => (
    <View style={styles.emptyContainer}>
      {searchQuery.length > 0 ? (
        <View>
          <Text style={styles.emptyText}>No users found matching "{searchQuery}"</Text>
          <Text style={styles.helpText}>
            Make sure the name is spelled correctly. Try searching for an email address instead.
          </Text>
        </View>
      ) : (
        <Text style={styles.emptyText}>
          Search for users by name or email to send friend requests
        </Text>
      )}
      
      {/* Show auth status for debugging */}
      
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Friends</Text>
        <View style={{ width: 50 }} />
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyResults}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    paddingHorizontal: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontFamily: typography.fontFamily.medium,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    color: colors.text.primary,
  },
  searchButton: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  searchButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 4,
  },
  addButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  authStatusContainer: {
    marginTop: spacing.xl,
    backgroundColor: colors.background.primary,
    padding: spacing.md,
    borderRadius: 8,
    width: '100%',
  },
  authStatusText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  authStatusValue: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  authFixButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 4,
    alignSelf: 'center',
  },
  authFixButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  helpText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

export default AddFriendScreen; 