import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme, cardStyle } from '../../constants/theme';

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

const formatINR = (n: number | null | undefined) =>
  n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

export default function ProfileTab() {
  const router = useRouter();
  const { session, driver, signOut } = useAuth();

  useEffect(() => {
    if (!session) router.replace('/login');
  }, [session, router]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  if (!driver) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No driver profile found.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSignOut}>
            <Text style={styles.primaryButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Profile</Text>

        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            {driver.profile_photo_url?.trim() ? (
              <Image source={{ uri: driver.profile_photo_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarText}>{driver.full_name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{driver.full_name}</Text>
              {driver.driver_code ? (
                <Text style={styles.profileCode}>Driver Code: {driver.driver_code}</Text>
              ) : null}
              <View style={styles.statusBadge}>
                <Text style={[styles.statusText, driver.status === 'active' ? styles.statusActive : styles.statusInactive]}>
                  {driver.status === 'active' ? 'Active' : (driver.status ?? 'Inactive')}
                </Text>
              </View>
            </View>
          </View>
          <Row label="Phone" value={driver.phone} />
          <Row label="Alternative Number 1" value={driver.alternative_phone_1} />
          <Row label="Alternative Number 2" value={driver.alternative_phone_2} />
          <Row label="Alternative Number 3" value={driver.alternative_phone_3} />
          <Row label="Address" value={driver.address} />
          <Row label="Prepaid Amount" value={formatINR(driver.pre_paid_rent_amount)} />
          <Row label="Document Charges" value={formatINR(driver.documents_charge)} />
          <Row label="Region" value={driver.region} />
          <Row label="Category" value={driver.category === 'single_driver' ? 'Single Driver' : driver.category === 'double_driver' ? 'Double Driver' : driver.category} />
          <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="images-outline" size={22} color={theme.primary} style={styles.cardIconEl} />
            <Text style={styles.cardTitle}>Driver Photos</Text>
          </View>
          {driver.uber_driver_photos && driver.uber_driver_photos.length > 0 ? (
            <View style={styles.photoGrid}>
              {driver.uber_driver_photos.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.photoThumb} resizeMode="cover" />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No driver photos uploaded.</Text>
          )}
        </View>

        {driver.notes?.trim() ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text-outline" size={22} color={theme.primary} style={styles.cardIconEl} />
              <Text style={styles.cardTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{driver.notes}</Text>
          </View>
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.backgroundSecondary },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  screenTitle: { fontSize: 24, fontWeight: '700', color: theme.text, marginBottom: 20 },
  bottomSpacer: { height: 24 },
  profileCard: { ...cardStyle },
  profileTop: { flexDirection: 'row', marginBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, color: '#fff', fontWeight: '600' },
  profileInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  profileName: { fontSize: 20, fontWeight: '700', color: theme.text, marginBottom: 4 },
  profileCode: { fontSize: 14, color: theme.textSecondary, marginBottom: 8 },
  statusBadge: { alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  statusActive: { backgroundColor: '#dcfce7', color: '#166534' },
  statusInactive: { backgroundColor: '#fee2e2', color: '#991b1b' },
  logoutBtn: { marginTop: 12, paddingVertical: 8 },
  logoutText: { fontSize: 15, color: theme.primary, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  rowLabel: { fontSize: 14, color: theme.textSecondary },
  rowValue: { fontSize: 14, fontWeight: '600', color: theme.text },
  card: { ...cardStyle },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIconEl: { marginRight: 10 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  primaryButton: { backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  emptyText: { fontSize: 14, color: theme.textSecondary, fontStyle: 'italic' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoThumb: { width: 80, height: 80, borderRadius: 12, backgroundColor: theme.borderLight },
  notesText: { fontSize: 14, color: theme.text, lineHeight: 22 },
});
