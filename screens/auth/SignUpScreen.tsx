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

interface SignUpScreenProps {
  onSignUpSuccess: () => void;
  onNavigateToSignIn: () => void;
}

export function SignUpScreen({ onSignUpSuccess, onNavigateToSignIn }: SignUpScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      setError('Please enter a password');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSignUp = async () => {
    setError(null);

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      const { user, error: authError } = await AuthService.signUp(email.trim(), password);

      if (authError) {
        console.error('[SignUpScreen] Sign up failed:', authError);
        setError(authError.message || 'Failed to create account. Please try again.');
        return;
      }

      if (!user) {
        setError('Sign up failed. Please try again.');
        return;
      }

      // Show success message
      Alert.alert(
        'Account Created',
        'Your account has been created successfully! Please check your email to verify your account.',
        [
          {
            text: 'OK',
            onPress: () => onSignUpSuccess(),
          },
        ]
      );
    } catch (err) {
      console.error('[SignUpScreen] Exception during sign up:', err);
      setError('An unexpected error occurred. Please try again.');
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join Scratch Oracle today</Text>
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
                placeholder="At least 6 characters"
                placeholderTextColor="#708090"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setError(null);
                }}
                placeholder="Re-enter your password"
                placeholderTextColor="#708090"
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <View style={styles.disclaimerContainer}>
              <Text style={styles.disclaimerText}>
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.disabledButton]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#0A0A0F" />
              ) : (
                <Text style={styles.signUpButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={onNavigateToSignIn} disabled={isLoading}>
                <Text style={styles.signInLink}>Sign In</Text>
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
  disclaimerContainer: {
    marginBottom: 24,
  },
  disclaimerText: {
    color: '#708090',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  signUpButton: {
    backgroundColor: '#00FFFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: '#708090',
  },
  signUpButtonText: {
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
  signInLink: {
    color: '#00FFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
