import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

export default function Index() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (session) {
      router.replace('/(tabs)');
    } else {
      router.replace('/login');
    }
  }, [session, loading, router]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ActivityIndicator size="large" color="#84cc16" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8faf5',
  },
});
