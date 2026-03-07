import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { theme } from '../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, refreshDriver } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [alternativePhone, setAlternativePhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = 'Name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email';
    const digitsOnly = phone.replace(/\D/g, '');
    if (!digitsOnly) next.phone = 'Phone is required';
    else if (digitsOnly.length !== 10) next.phone = 'Phone must be exactly 10 digits (numbers only)';
    if (!password) next.password = 'Password is required';
    else if (password.length < 6) next.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const { error: authError } = await signUp(email.trim(), password);
      if (authError) {
        setLoading(false);
        Alert.alert('Registration failed', authError.message);
        return;
      }

      const { error: insertError } = await supabase.from('tvp_drivers').insert({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.replace(/\D/g, '').slice(0, 10),
        alternative_phone_1: alternativePhone.trim() || null,
        status: 'active',
      });

      if (insertError) {
        setLoading(false);
        Alert.alert('Registration failed', insertError.message);
        return;
      }

      await refreshDriver();
      router.replace('/(tabs)');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

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
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Register as a TVP driver</Text>

            <Input
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="Your full name"
              error={errors.fullName}
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Input
              label="Phone (10 digits only)"
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
              placeholder="e.g. 9876543210"
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.phone}
            />
            <Input
              label="Alternative phone (optional)"
              value={alternativePhone}
              onChangeText={setAlternativePhone}
              placeholder="Optional"
              keyboardType="phone-pad"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min 6 characters"
              secureTextEntry
              error={errors.password}
            />
            <Input
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat password"
              secureTextEntry
              error={errors.confirmPassword}
            />

            <Button title="Register" onPress={handleRegister} loading={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={styles.footerLink}>Login</Text>
            </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 32,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  back: { marginBottom: 20 },
  backText: { fontSize: 16, color: theme.primary, fontWeight: '600' },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 24,
    marginBottom: 24,
  },
  title: { fontSize: 22, fontWeight: '700', color: theme.text, marginBottom: 6 },
  subtitle: { fontSize: 15, color: theme.textSecondary, marginBottom: 24 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 15, color: theme.textSecondary },
  footerLink: { fontSize: 15, color: theme.primary, fontWeight: '600' },
});
