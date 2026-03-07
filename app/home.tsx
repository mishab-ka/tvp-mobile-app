import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function PhotoSection({ title, url }: { title: string; url: string | null | undefined }) {
  if (!url) return null;
  return (
    <View style={styles.photoSection}>
      <Text style={styles.photoTitle}>{title}</Text>
      <Image source={{ uri: url }} style={styles.photo} resizeMode="cover" />
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { session, driver, signOut, refreshDriver } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (!session) {
      router.replace('/login');
    }
  }, [session, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshDriver();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!driver) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.noProfile}>No driver profile found.</Text>
          <Button title="Logout" onPress={handleSignOut} variant="outline" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        {driver.profile_photo_url ? (
          <Image source={{ uri: driver.profile_photo_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>
              {driver.full_name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{driver.full_name}</Text>
        {driver.driver_code ? (
          <Text style={styles.code}>Code: {driver.driver_code}</Text>
        ) : null}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile details</Text>
        <DetailRow label="Email" value={driver.email} />
        <DetailRow label="Phone" value={driver.phone} />
        <DetailRow label="Alternative phone" value={driver.alternative_phone_1} />
        <DetailRow label="Region" value={driver.region} />
        <DetailRow label="Address" value={driver.address} />
        <DetailRow label="Status" value={driver.status ?? undefined} />
        <DetailRow label="Category" value={driver.category ?? undefined} />
        {driver.join_date ? (
          <DetailRow label="Join date" value={new Date(driver.join_date).toLocaleDateString()} />
        ) : null}
        {driver.vehicle_numbers && driver.vehicle_numbers.length > 0 ? (
          <DetailRow label="Vehicles" value={driver.vehicle_numbers.join(', ')} />
        ) : null}
        {driver.performance_score != null ? (
          <DetailRow label="Performance score" value={String(driver.performance_score)} />
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Documents</Text>
        <PhotoSection title="Aadhar (front)" url={driver.aadhar_front_url} />
        <PhotoSection title="Aadhar (back)" url={driver.aadhar_back_url} />
        <PhotoSection title="Licence (front)" url={driver.license_front_url} />
        <PhotoSection title="Licence (back)" url={driver.license_back_url} />
        {driver.uber_driver_photos && driver.uber_driver_photos.length > 0 ? (
          <View style={styles.photoSection}>
            <Text style={styles.photoTitle}>Uber profile photos</Text>
            <View style={styles.uberGrid}>
              {driver.uber_driver_photos.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.photoSmall} resizeMode="cover" />
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noProfile: { fontSize: 16, color: '#666', marginBottom: 16 },
  header: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarPlaceholder: { backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: '600' },
  name: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 4 },
  code: { fontSize: 14, color: '#666', marginBottom: 16 },
  logoutBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  logoutText: { fontSize: 15, color: '#2563eb', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 16 },
  row: { marginBottom: 12 },
  label: { fontSize: 12, color: '#666', marginBottom: 2 },
  value: { fontSize: 15, color: '#111' },
  photoSection: { marginTop: 16 },
  photoTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  photo: { width: '100%', height: 180, borderRadius: 8, backgroundColor: '#f1f5f9' },
  photoSmall: { width: 72, height: 72, borderRadius: 8, backgroundColor: '#f1f5f9' },
  uberGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
