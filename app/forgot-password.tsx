import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { theme } from '../constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error: err } = await resetPassword(email.trim());
    setLoading(false);
    if (err) {
      Alert.alert('Error', err.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.sentContainer}>
          <View style={styles.card}>
            <Text style={styles.title}>Check your email</Text>
            <Text style={styles.message}>
              We've sent a password reset link to {email}. Open the link to set a new password.
            </Text>
            <Button title="Back to Login" onPress={() => router.back()} variant="primary" />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.title}>Forgot password?</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a link to reset your password.
            </Text>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button title="Send reset link" onPress={handleSubmit} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.backgroundSecondary },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  sentContainer: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  back: { marginBottom: 20 },
  backText: { fontSize: 16, color: theme.primary, fontWeight: '600' },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 24,
    width: '100%',
    maxWidth: 420,
  },
  title: { fontSize: 22, fontWeight: '700', color: theme.text, marginBottom: 12 },
  subtitle: { fontSize: 15, color: theme.textSecondary, marginBottom: 24 },
  message: { fontSize: 15, color: theme.textSecondary, marginBottom: 24 },
  errorText: { fontSize: 12, color: theme.error, marginTop: -8, marginBottom: 12 },
});
