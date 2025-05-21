import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import { colors, spacing, typography } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { SignupScreenNavigationProp } from '../types/navigation';

const SignupScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const { signup } = useAuth();
  const navigation = useNavigation<SignupScreenNavigationProp>();

  const handleSignup = async () => {
    try {
      if (!email || !password || !name) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      // Check if the full name has 2-3 words (first name, middle name, last name)
      const nameWords = name.trim().split(/\s+/).filter(word => word.length > 0);
      
      if (nameWords.length < 2 || nameWords.length > 3) {
        Alert.alert(
          'Full Name Required',
          'Please enter your full real name (first and last name, with optional middle name) for the best experience.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      await signup(email, password, name);
      
      // Show confirmation message after successful registration
      Alert.alert(
        'Verification Email Sent',
        'Please check your email and click the verification link to activate your account.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create account');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.form}>
        <Text style={styles.title}>Create Account</Text>
        <TextInput
          label="Email"
          placeholder="example@meetit.net"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          label="Full Name"
          placeholder="Enter your full name (first & last name)"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          label="Password"
          placeholder="Create a password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button
          title="Sign Up"
          onPress={handleSignup}
          fullWidth
          style={styles.button}
        />
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.xl,
    textAlign: 'center',
    color: colors.text.primary,
  },
  button: {
    marginTop: spacing.md,
  },
  linkButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
  },
});

export default SignupScreen; 