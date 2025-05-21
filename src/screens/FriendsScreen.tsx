import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { getFriends, getPendingFriendRequests, acceptFriendRequest, rejectFriendRequest, removeFriend, Friend, FriendRequest } from '../api/friendship';
import { pb, fixAuthentication } from '../api/pocketbaseSetup';
import Button from '../components/Button';
import { useAuth } from '../contexts/AuthContext';

// Define explicit style for center
const centerStyle = {
  justifyContent: 'center' as 'center',
  alignItems: 'center' as 'center',
};

interface FriendsScreenProps {
  navigation: any;
}

const FriendsScreen: React.FC<FriendsScreenProps> = ({ navigation }) => {
  const { user, isAuthenticated, refreshAuthState } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [initialLoadCompleted, setInitialLoadCompleted] = useState<boolean>(false);

  // Memoize fetchData to avoid recreating it on each render
  const fetchData = useCallback(async () => {
    try {
      if (!isAuthenticated || !user) {
        console.error('[FRIENDS] Not authenticated:', {
          isAuthenticated,
          user: user?.id,
          pbAuthValid: pb.authStore.isValid,
          pbAuthUser: pb.authStore.model?.id
        });
        
        setLoading(false);
        return;
      }
      
      console.log("[FRIENDS] Current user ID:", user.id);
      
      // Get friends list (accepted friendships)
      const friendsList = await getFriends(user.id);
      console.log(`[FRIENDS] Found ${friendsList.length} friends`);
      setFriends(friendsList);
      
      // Get pending friend requests (where user is the recipient)
      const requests = await getPendingFriendRequests(user.id);
      console.log(`[FRIENDS] Found ${requests.length} pending friend requests`);
      setPendingRequests(requests);
      
      // Auto-switch to requests tab if there are pending requests
      if (requests.length > 0 && activeTab !== 'requests') {
        setActiveTab('requests');
      }
    } catch (error) {
      console.error('[FRIENDS] Error fetching friends data:', error);
      Alert.alert('Error', 'Failed to load friends. Please try again later.');
    } finally {
      setLoading(false);
      setInitialLoadCompleted(true);
    }
  }, [isAuthenticated, user, activeTab]);

  // Initial setup and authentication
  useEffect(() => {
    let isMounted = true;
    
    // One-time initialization when component first mounts
    const initScreen = async () => {
      try {
        // First ensure we're authenticated
        await fixAuthentication();
        await refreshAuthState();
        
        // Only load data on initial mount if we're authenticated
        if (isMounted && isAuthenticated && user && !initialLoadCompleted) {
          await fetchData();
        } else if (isMounted) {
          console.error("[FRIENDS] Not authenticated after init");
          setLoading(false);
        }
      } catch (error) {
        console.error("[FRIENDS] Error initializing FriendsScreen:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    if (!initialLoadCompleted) {
      initScreen();
    }
    
    return () => { isMounted = false; };
  }, []);

  // Set up focus listener separately to avoid dependency issues
  useEffect(() => {
    // Only run this effect once to set up the listener
    const unsubscribe = navigation.addListener('focus', () => {
      // We only want to refresh data when returning to the screen, not on first load
      if (initialLoadCompleted && isAuthenticated && user) {
        setRefreshing(true);
        fetchData().finally(() => {
          setRefreshing(false);
        });
      }
    });
    
    return unsubscribe;
  }, [navigation, initialLoadCompleted, isAuthenticated, user, fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      Alert.alert('Success', 'Friend request accepted');
      handleRefresh(); // Use handleRefresh instead of fetchData directly
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      Alert.alert('Success', 'Friend request rejected');
      handleRefresh(); // Use handleRefresh instead of fetchData directly
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      Alert.alert('Error', 'Failed to reject friend request');
    }
  };

  const handleRemoveFriend = async (friendshipId: string, friendName: string) => {
    Alert.alert(
      'Remove Friend',
      `Are you sure you want to remove ${friendName} from your friends?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriend(friendshipId);
              Alert.alert('Success', 'Friend removed');
              handleRefresh(); // Use handleRefresh instead of fetchData directly
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Error', 'Failed to remove friend');
            }
          }
        }
      ]
    );
  };

  const navigateToAddFriend = () => {
    navigation.navigate('AddFriend');
  };

  const renderEmptyFriends = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateTitle}>No Friends Yet</Text>
      <Text style={styles.emptyStateDescription}>
        Start connecting with friends to see them here.
      </Text>
      <Button
        title="Find Friends"
        onPress={navigateToAddFriend}
        style={styles.actionButton}
      />
    </View>
  );

  const renderEmptyRequests = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateTitle}>No Pending Requests</Text>
      <Text style={styles.emptyStateDescription}>
        You don't have any friend requests at the moment.
      </Text>
      <Button
        title="Find Friends"
        onPress={navigateToAddFriend}
        style={styles.actionButton}
      />
    </View>
  );

  const renderFriendItem = ({ item }: { item: Friend }) => {
    if (!item.user || !item.user.name) return null;
    
    return (
      <View style={styles.friendItem}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {item.user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.user.name}</Text>
          {item.user.email && (
            <Text style={styles.infoText}>{item.user.email}</Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemoveFriend(item.id, item.user.name)}
        >
          <Text style={styles.removeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRequestItem = ({ item }: { item: FriendRequest }) => {
    // Handle missing sender data
    const senderName = item.sender?.name || 'Unknown User';
    const senderInitial = senderName.charAt(0).toUpperCase();
    
    return (
      <View style={styles.requestItem}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {senderInitial}
          </Text>
        </View>
        <View style={styles.requestInfo}>
          <Text style={styles.friendName}>{senderName}</Text>
          {item.sender?.email && (
            <Text style={styles.infoText}>{item.sender.email}</Text>
          )}
          <View style={styles.requestActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleAcceptRequest(item.id)}
            >
              <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleRejectRequest(item.id)}
            >
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, centerStyle]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Friends</Text>
        <TouchableOpacity style={styles.addButton} onPress={navigateToAddFriend}>
          <Text style={styles.addButtonText}>+ Add Friend</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'friends' && styles.activeTab
          ]}
          onPress={() => setActiveTab('friends')}
        >
          <Text 
            style={[
              styles.tabText,
              activeTab === 'friends' && styles.activeTabText
            ]}
          >
            Friends
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'requests' && styles.activeTab
          ]}
          onPress={() => setActiveTab('requests')}
        >
          <Text 
            style={[
              styles.tabText,
              activeTab === 'requests' && styles.activeTabText
            ]}
          >
            Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'friends' ? (
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={renderEmptyFriends}
        />
      ) : (
        <FlatList
          data={pendingRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={renderEmptyRequests}
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
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  addButton: {
    padding: spacing.sm,
  },
  addButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
  },
  activeTabText: {
    color: colors.primary,
  },
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  requestItem: {
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
  friendInfo: {
    flex: 1,
  },
  requestInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
  },
  requestActions: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 4,
    marginRight: spacing.sm,
    marginTop: spacing.sm,
  },
  acceptButton: {
    backgroundColor: colors.primary,
  },
  rejectButton: {
    backgroundColor: colors.error,
  },
  actionButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.md,
    fontWeight: 'bold',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxl,
  },
  emptyStateTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});

export default FriendsScreen; 