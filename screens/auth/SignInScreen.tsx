import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { AuthService } from '../../services/auth/authService';

interface SignInScreenProps {
  onSignInSuccess: () => void;
  onNavigateToSignUp: () => void;
}

export function SignInScreen({ onSignInSuccess, onNavigateToSignUp }: SignInScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateInputs = (): boolean => {
    if (!email.trim()) {
      setError('Please enter your email');
      return false;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!password) {
      setError('Please enter your password');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleSignIn = async () => {
    setError(null);

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      const { user, error: authError } = await AuthService.signIn(email.trim(), password);

      if (authError) {
        console.error('[SignInScreen] Sign in failed:', authError);
        setError(authError.message || 'Failed to sign in. Please try again.');
        return;
      }

      if (!user) {
        setError('Sign in failed. Please check your credentials.');
        return;
      }

      // Success - callback will be triggered by auth state change
      onSignInSuccess();
    } catch (err) {
      console.error('[SignInScreen] Exception during sign in:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address to reset your password.');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const { error: resetError } = await AuthService.resetPassword(email.trim());

      if (resetError) {
        Alert.alert('Error', resetError.message || 'Failed to send reset email. Please try again.');
        return;
      }

      Alert.alert(
        'Check Your Email',
        'We have sent you a password reset link. Please check your email.'
      );
    } catch (err) {
      console.error('[SignInScreen] Exception during password reset:', err);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
                }}
                placeholder="your.email@example.com"
                placeholderTextColor="#708090"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(null);
                }}
                placeholder="Enter your password"
                placeholderTextColor="#708090"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={isLoading}
              style={styles.forgotPasswordButton}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.signInButton, isLoading && styles.disabledButton]}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#0A0A0F" />
              ) : (
                <Text style={styles.signInButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={onNavigateToSignUp} disabled={isLoading}>
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00FFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E0E0',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 69, 0, 0.1)',
    borderWidth: 1,
    borderColor: '#FF4500',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#2E2E3F',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#E0E0E0',
    fontSize: 16,
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#00FFFF',
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: '#00FFFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: '#708090',
  },
  signInButtonText: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: '#708090',
    fontSize: 14,
  },
  signUpLink: {
    color: '#00FFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
