import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import TextInput from '../components/TextInput';
import Button from '../components/Button';
import { colors, spacing, typography, borderRadius } from '../theme';
import { login, register } from '../api/pocketbase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { LoginScreenNavigationProp } from '../types/navigation';

const logoPlaceholder = require('../../assets/icon.png');

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login: authLogin, requestVerification } = useAuth();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      await authLogin(email, password);
    } catch (error: any) {
      // Check if the error is related to email verification
      if (error.message && error.message.includes('verify your email')) {
        Alert.alert(
          'Email Not Verified',
          'Please verify your email before logging in.',
          [
            {
              text: 'Resend Verification',
              onPress: async () => {
                try {
                  await requestVerification(email);
                  Alert.alert('Success', 'Verification email has been sent. Please check your inbox.');
                } catch (err) {
                  Alert.alert('Error', 'Failed to send verification email. Please try again.');
                }
              }
            },
            {
              text: 'OK',
              style: 'cancel'
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Invalid credentials');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image source={logoPlaceholder} style={styles.logo} />
        

        <Text style={styles.tagline}>
          Plan meetups with friends, all in one place
        </Text>
      </View>

      <View style={styles.formContainer}>
        <TextInput
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button
          title="Login"
          onPress={handleLogin}
          fullWidth
          style={styles.authButton}
        />
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.toggleText}>Don't have an account? Sign up</Text>
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
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    padding: spacing.lg,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: spacing.md,
    marginTop: -80,
  },
  appName: {
    fontSize: typography.fontSize.xxxl,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    
  },
  formContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
   
  },
  authButton: {
    marginTop: spacing.md,
  },
  toggleButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
    
  },
  toggleText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
  },
});

export default LoginScreen; 