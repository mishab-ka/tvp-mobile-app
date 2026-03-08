import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import type { TvpDriver } from '../lib/types';

const formatINR = (n: number | null | undefined) =>
  n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

function Card({
  title,
  icon,
  children,
  style,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>{icon}</Text>
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { session, driver, signOut, refreshDriver } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (!session) router.replace('/login');
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

  const viewVehiclesHref = '/view-vehicles' as const;
  const openViewVehiclesScreen = () => router.push('/view-vehicles');

  const docStatus = useMemo(() => {
    if (!driver) return { list: [] as { name: string; uploaded: boolean }[], completed: 0, total: 5, missing: [] as { name: string }[] };
    const list = [
      { name: 'Profile Photo', uploaded: !!(driver.profile_photo_url?.trim()) },
      { name: 'Aadhar Front', uploaded: !!(driver.aadhar_front_url?.trim()) },
      { name: 'Aadhar Back', uploaded: !!(driver.aadhar_back_url?.trim()) },
      { name: 'Driving License Front', uploaded: !!(driver.license_front_url?.trim()) },
      { name: 'Driving License Back', uploaded: !!(driver.license_back_url?.trim()) },
    ];
    const completed = list.filter((d) => d.uploaded).length;
    const missing = list.filter((d) => !d.uploaded).map((d) => ({ name: d.name }));
    return { list, completed, total: 5, missing };
  }, [driver]);

  const alerts = useMemo(() => {
    if (!driver) return [];
    const a: string[] = [];
    if (!driver.aadhar_back_url?.trim()) a.push('Aadhar back not uploaded');
    if (!driver.license_back_url?.trim()) a.push('Driving license back not uploaded');
    if (!driver.aadhar_front_url?.trim()) a.push('Aadhar front not uploaded');
    if (!driver.license_front_url?.trim()) a.push('Driving license front not uploaded');
    const bal = Number(driver.outstanding_balance ?? 0);
    if (bal > 0) a.push('Outstanding balance pending');
    const vehicles = driver.vehicle_numbers ?? [];
    if (vehicles.length === 0) a.push('No vehicle assigned');
    return a;
  }, [driver]);

  if (!driver) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.noProfile}>No driver profile found.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSignOut}>
            <Text style={styles.primaryButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const outstanding = Number(driver.outstanding_balance ?? 0);
  const hasPendingDocs = docStatus.completed < docStatus.total;
  const perfScore = driver.performance_score != null ? Math.min(100, Math.max(0, Number(driver.performance_score))) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. PROFILE CARD */}
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
              {driver.phone ? (
                <Text style={styles.profilePhone}>📞 {driver.phone}</Text>
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
        </View>

        {/* ALERTS */}
        {alerts.length > 0 && (
          <Card title="Alerts" icon="🔔">
            {alerts.map((msg, i) => (
              <View key={i} style={styles.alertItem}>
                <Text style={styles.alertIcon}>⚠</Text>
                <Text style={styles.alertText}>{msg}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* 2. DOCUMENT STATUS - only when there are missing documents; hide section when all uploaded */}
        {hasPendingDocs && (
          <Card title="Document Status" icon="📄">
            <View style={styles.docCompletionWrap}>
              <Text style={styles.docCompletionLabel}>Document Completion</Text>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${(docStatus.completed / docStatus.total) * 100}%` }]} />
              </View>
              <Text style={styles.docCompletionPct}>{Math.round((docStatus.completed / docStatus.total) * 100)}%</Text>
            </View>
            {docStatus.missing.map((d, i) => (
              <View key={i} style={styles.docRow}>
                <Text style={styles.docName}>{d.name}</Text>
                <Text style={styles.docPending}>Pending ⚠ Upload Required</Text>
              </View>
            ))}
            <View style={styles.docWarning}>
              <Text style={styles.docWarningText}>⚠ Please upload pending documents to activate your driver account.</Text>
            </View>
            <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/upload-documents')}>
              <Text style={styles.primaryButtonText}>Upload Documents</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* 3. VEHICLES - View details opens vehicle page */}
        <Card title="Assigned Vehicles" icon="🚗">
          {driver.vehicle_numbers && driver.vehicle_numbers.length > 0 ? (
            <>
              {driver.vehicle_numbers.map((v, i) => (
                <Text key={i} style={styles.vehiclePlate}>{v}</Text>
              ))}
              <Link href={viewVehiclesHref} asChild>
                <Pressable style={({ pressed }) => [styles.viewDetailsButton, pressed && styles.viewDetailsButtonPressed]}>
                  <Text style={styles.viewDetailsButtonText}>View details</Text>
                </Pressable>
              </Link>
            </>
          ) : (
            <>
              <Text style={styles.emptyText}>No vehicle assigned yet. Please contact admin.</Text>
              <Link href={viewVehiclesHref} asChild>
                <Pressable style={({ pressed }) => [styles.viewDetailsButton, pressed && styles.viewDetailsButtonPressed]}>
                  <Text style={styles.viewDetailsButtonText}>View vehicle details</Text>
                </Pressable>
              </Link>
            </>
          )}
        </Card>

        {/* 4. EARNINGS */}
        <Card title="Earnings & Payments" icon="💰">
          <Row label="Total Earnings" value={formatINR(driver.total_earnings)} />
          <Row label="Cash Collected" value={formatINR(driver.total_cash_collect)} />
          <Row label="Deposit" value={formatINR(driver.deposit_amount)} />
          <View style={styles.divider} />
          <Row label="Outstanding Balance" value={formatINR(driver.outstanding_balance)} />
          <Row label="Net Outstanding" value={formatINR(driver.net_outstanding)} />
          <Row label="Penalty" value={formatINR(driver.penalty_amount)} />
          {outstanding > 0 && (
            <View style={styles.alertItem}>
              <Text style={styles.alertIcon}>⚠</Text>
              <Text style={styles.alertText}>You have pending payment balance.</Text>
            </View>
          )}
        </Card>

        {/* 5. PERFORMANCE */}
        <Card title="Performance" icon="📊">
          <View style={styles.perfScoreWrap}>
            <Text style={styles.perfScoreLabel}>Score</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, styles.perfFill, { width: `${perfScore}%` }]} />
            </View>
            <Text style={styles.perfScoreValue}>{perfScore}%</Text>
          </View>
          <Row label="Payment Delay" value={driver.payment_delay_days != null ? `${driver.payment_delay_days} Days` : null} />
          <Row label="Rental Days" value={driver.cumulative_rental_days != null ? `${driver.cumulative_rental_days} Days` : null} />
        </Card>

        {/* 6. ROOM */}
        <Card title="Room Information" icon="🏠">
          <Row label="Room Provided" value={driver.including_room ? 'Yes' : 'No'} />
          {driver.including_room && <Row label="Room Deposit" value={formatINR(driver.room_deposit)} />}
        </Card>

        {/* 7. DRIVER PHOTOS */}
        <Card title="Driver Photos (Uber)" icon="📷">
          {driver.uber_driver_photos && driver.uber_driver_photos.length > 0 ? (
            <View style={styles.photoGrid}>
              {driver.uber_driver_photos.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.photoThumb} resizeMode="cover" />
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No driver photos uploaded.</Text>
          )}
          <TouchableOpacity style={styles.photoUploadLink} onPress={() => router.push('/upload-documents')}>
            <Text style={styles.photoUploadLinkText}>Upload driver photos in Upload Documents →</Text>
          </TouchableOpacity>
        </Card>

        {/* 8. NOTES */}
        {driver.notes?.trim() && (
          <Card title="Notes" icon="📝">
            <Text style={styles.notesText}>{driver.notes}</Text>
          </Card>
        )}

        {/* 9. QUICK ACTIONS */}
        <Card title="Quick Actions" icon="⚡">
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/upload-documents')}>
            <Text style={styles.actionBtnText}>Upload Documents</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={openViewVehiclesScreen} activeOpacity={0.7}>
            <Text style={styles.actionBtnText}>View Vehicles</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>View Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Contact Admin</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </Card>

        {/* LOGOUT - at end of home */}
        <View style={styles.logoutSection}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut} activeOpacity={0.8}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noProfile: { fontSize: 16, color: '#6b7280', marginBottom: 16 },
  bottomSpacer: { height: 48 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIcon: { fontSize: 20, marginRight: 10 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  profileTop: { flexDirection: 'row', marginBottom: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: { backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, color: '#fff', fontWeight: '600' },
  profileInfo: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  profileName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  profileCode: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  profilePhone: { fontSize: 15, color: '#111827', fontWeight: '600', marginBottom: 8 },
  statusBadge: { alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, overflow: 'hidden' },
  statusActive: { backgroundColor: '#d1fae5', color: '#065f46' },
  statusInactive: { backgroundColor: '#fee2e2', color: '#991b1b' },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  rowLabel: { fontSize: 14, color: '#6b7280' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#111827' },

  docCompletionWrap: { marginBottom: 16 },
  docCompletionLabel: { fontSize: 14, color: '#6b7280', marginBottom: 6 },
  docCompletionPct: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 6 },
  progressBarBg: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: 4 },
  perfFill: { backgroundColor: '#059669' },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  docName: { fontSize: 14, color: '#374151' },
  docUploaded: { fontSize: 13, color: '#059669', fontWeight: '600' },
  docPending: { fontSize: 13, color: '#d97706', fontWeight: '600' },
  docWarning: { backgroundColor: '#fef3c7', padding: 12, borderRadius: 10, marginTop: 12, marginBottom: 16 },
  docWarningText: { fontSize: 13, color: '#92400e' },

  alertItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef2f2', padding: 12, borderRadius: 10, marginBottom: 8 },
  alertIcon: { marginRight: 8, fontSize: 16 },
  alertText: { flex: 1, fontSize: 13, color: '#991b1b', fontWeight: '500' },

  primaryButton: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },

  vehiclePlate: { fontSize: 16, fontWeight: '600', color: '#111827', paddingVertical: 8 },
  viewDetailsButton: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  viewDetailsButtonPressed: { opacity: 0.8 },
  viewDetailsButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  emptyText: { fontSize: 14, color: '#6b7280', fontStyle: 'italic' },
  photoUploadLink: { marginTop: 12, paddingVertical: 8 },
  photoUploadLinkText: { fontSize: 14, color: '#2563eb', fontWeight: '600' },
  logoutSection: { marginTop: 24, marginBottom: 16 },
  logoutButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: { fontSize: 16, fontWeight: '700', color: '#dc2626' },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 8 },

  perfScoreWrap: { marginBottom: 12 },
  perfScoreLabel: { fontSize: 14, color: '#6b7280', marginBottom: 6 },
  perfScoreValue: { fontSize: 14, fontWeight: '700', color: '#059669', marginTop: 6 },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoThumb: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f3f4f6' },
  notesText: { fontSize: 14, color: '#374151', lineHeight: 22 },

  actionBtn: { backgroundColor: '#f3f4f6', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
});
