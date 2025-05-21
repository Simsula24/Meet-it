import { NavigatorScreenParams } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

// Auth stack params
export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

// Home stack params
export type HomeStackParamList = {
  HomeScreen: undefined;
  MeetupDetails: { eventId: string };
  EditMeetup: { eventId: string };
  Inbox: undefined;
  Chat: { eventId: string };
};

// Profile stack params
export type ProfileStackParamList = {
  ProfileScreen: undefined;
};

// Friends stack params
export type FriendsStackParamList = {
  FriendsScreen: undefined;
};

// Main tab params
export type MainTabsParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
  Friends: NavigatorScreenParams<FriendsStackParamList>;
};

// Root stack params
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabsParamList>;
  CreateMeetup: undefined;
  Login: undefined;
  Signup: undefined;
};

// Combined navigation types for screens
export type HomeScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, 'HomeScreen'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabsParamList, 'Home'>,
    StackNavigationProp<RootStackParamList>
  >
>;

export type ProfileScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<ProfileStackParamList, 'ProfileScreen'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabsParamList, 'Profile'>,
    StackNavigationProp<RootStackParamList>
  >
>;

export type FriendsScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<FriendsStackParamList, 'FriendsScreen'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabsParamList, 'Friends'>,
    StackNavigationProp<RootStackParamList>
  >
>;

export type MeetupDetailsScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, 'MeetupDetails'>,
  StackNavigationProp<RootStackParamList>
>;

export type EditMeetupScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, 'EditMeetup'>,
  StackNavigationProp<RootStackParamList>
>;

export type CreateMeetupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateMeetup'>;
export type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;
export type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;
export type InboxScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, 'Inbox'>,
  StackNavigationProp<RootStackParamList>
>;
export type ChatScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<HomeStackParamList, 'Chat'>,
  StackNavigationProp<RootStackParamList>
>; 