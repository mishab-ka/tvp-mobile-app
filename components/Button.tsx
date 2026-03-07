import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        (disabled || loading) && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'secondary' ? '#2563eb' : '#fff'} />
      ) : (
        <Text style={[styles.text, variant === 'outline' || variant === 'secondary' ? styles.textSecondary : styles.textPrimary]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: { backgroundColor: '#2563eb' },
  secondary: { backgroundColor: '#f1f5f9' },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#2563eb' },
  disabled: { opacity: 0.6 },
  text: { fontSize: 16, fontWeight: '600' },
  textPrimary: { color: '#fff' },
  textSecondary: { color: '#2563eb' },
});
