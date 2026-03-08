import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme, cardStyle } from '../../constants/theme';

const formatINR = (n: number | null | undefined) =>
  n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {icon}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function HomeTab() {
  const router = useRouter();
  const { session, driver, refreshDriver } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);
  const [alertsVisible, setAlertsVisible] = useState(false);

  useEffect(() => {
    if (!session) router.replace('/login');
  }, [session, router]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshDriver();
    setRefreshing(false);
  };

  const docStatus = useMemo(() => {
    if (!driver) return { list: [] as { name: string; uploaded: boolean }[], completed: 0, total: 5 };
    const list = [
      { name: 'Profile Photo', uploaded: !!(driver.profile_photo_url?.trim()) },
      { name: 'Aadhar Front', uploaded: !!(driver.aadhar_front_url?.trim()) },
      { name: 'Aadhar Back', uploaded: !!(driver.aadhar_back_url?.trim()) },
      { name: 'Driving License Front', uploaded: !!(driver.license_front_url?.trim()) },
      { name: 'Driving License Back', uploaded: !!(driver.license_back_url?.trim()) },
    ];
    const completed = list.filter((d) => d.uploaded).length;
    return { list, completed, total: 5 };
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
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasPendingDocs = docStatus.completed < docStatus.total;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Alerts button - top right; badge only when there are alerts */}
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
        <TouchableOpacity
          style={styles.alertsButton}
          onPress={() => setAlertsVisible(true)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.text} />
          {alerts.length > 0 && <View style={styles.alertsBadge} />}
        </TouchableOpacity>
      </View>

      <Modal
        visible={alertsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertsVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setAlertsVisible(false)}>
          <Pressable style={styles.alertsModal} onPress={(e) => e.stopPropagation()}>
            <View style={styles.alertsModalHeader}>
              <Text style={styles.alertsModalTitle}>Alerts</Text>
              <TouchableOpacity onPress={() => setAlertsVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            {alerts.length === 0 ? (
              <Text style={styles.alertsEmpty}>No alerts</Text>
            ) : (
              alerts.map((msg, i) => (
                <View key={i} style={styles.alertItem}>
                  <Ionicons name="warning-outline" size={18} color={theme.error} />
                  <Text style={styles.alertText}>{msg}</Text>
                </View>
              ))
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Driver header: photo, name, mobile, email, status */}
        <View style={styles.driverHeader}>
          {driver.profile_photo_url?.trim() ? (
            <Image source={{ uri: driver.profile_photo_url }} style={styles.driverAvatar} />
          ) : (
            <View style={[styles.driverAvatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>{driver.full_name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
            </View>
          )}
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{driver.full_name}</Text>
            {driver.driver_code ? (
              <Text style={styles.driverCode}>{driver.driver_code}</Text>
            ) : null}
            {driver.phone ? (
              <View style={styles.driverContactRow}>
                <Ionicons name="call-outline" size={14} color={theme.textSecondary} />
                <Text style={styles.driverContact}>{driver.phone}</Text>
              </View>
            ) : null}
            {driver.email ? (
              <View style={styles.driverContactRow}>
                <Ionicons name="mail-outline" size={14} color={theme.textSecondary} />
                <Text style={styles.driverContact} numberOfLines={1}>{driver.email}</Text>
              </View>
            ) : null}
            <View style={[styles.statusBadge, driver.status === 'active' ? styles.statusActive : styles.statusInactive]}>
              <Ionicons name={driver.status === 'active' ? 'checkmark-circle' : 'close-circle'} size={14} color={driver.status === 'active' ? '#166534' : '#991b1b'} />
              <Text style={[styles.statusText, driver.status === 'active' ? styles.statusActiveText : styles.statusInactiveText]}>
                {driver.status === 'active' ? 'Active' : (driver.status ?? 'Inactive')}
              </Text>
            </View>
          </View>
        </View>

        {/* Outstanding balance card - always red */}
        <View style={[styles.card, styles.outstandingCard, styles.outstandingRed]}>
          <View style={styles.outstandingRow}>
            <Ionicons name="wallet-outline" size={24} color={theme.error} />
            <Text style={styles.outstandingLabel}>Outstanding Balance</Text>
          </View>
          <Text style={styles.outstandingAmountRed}>
            {formatINR(driver.outstanding_balance)}
          </Text>
        </View>

        {/* Grid: Deposit (green), Penalty (red), Prepaid (green) */}
        <View style={styles.gridRow}>
          <View style={[styles.card, styles.gridCard]}>
            <Ionicons name="card-outline" size={22} color={theme.success} />
            <Text style={styles.gridLabel}>Deposit</Text>
            <Text style={styles.gridValueGreen}>{formatINR(driver.deposit_amount)}</Text>
          </View>
          <View style={[styles.card, styles.gridCard]}>
            <Ionicons name="alert-circle-outline" size={22} color={theme.error} />
            <Text style={styles.gridLabel}>Penalty</Text>
            <Text style={styles.gridValueRed}>{formatINR(driver.penalty_amount)}</Text>
          </View>
          <View style={[styles.card, styles.gridCard]}>
            <Ionicons name="cash-outline" size={22} color={theme.success} />
            <Text style={styles.gridLabel}>Prepaid</Text>
            <Text style={styles.gridValueGreen}>{formatINR(driver.pre_paid_rent_amount)}</Text>
          </View>
        </View>

        <Card
          title="Document Status"
          icon={<Ionicons name="document-text-outline" size={22} color={theme.primary} style={styles.cardIconEl} />}
        >
          <View style={styles.docCompletionWrap}>
            <Text style={styles.docCompletionLabel}>Document Completion</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(docStatus.completed / docStatus.total) * 100}%` }]} />
            </View>
            <Text style={styles.docCompletionPct}>{Math.round((docStatus.completed / docStatus.total) * 100)}%</Text>
          </View>
          {docStatus.list.map((d, i) => (
            <View key={i} style={styles.docRow}>
              <Text style={styles.docName}>{d.name}</Text>
              <View style={styles.docStatusRow}>
                {d.uploaded ? (
                  <Ionicons name="checkmark-circle" size={18} color={theme.success} />
                ) : (
                  <Ionicons name="time-outline" size={18} color={theme.warning} />
                )}
                <Text style={d.uploaded ? styles.docUploaded : styles.docPending}>
                  {d.uploaded ? 'Uploaded' : 'Pending'}
                </Text>
              </View>
            </View>
          ))}
          {hasPendingDocs && (
            <View style={styles.docWarning}>
              <Text style={styles.docWarningText}>Please upload pending documents to activate your account.</Text>
            </View>
          )}
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/upload-documents')}>
            <Text style={styles.primaryButtonText}>Upload Documents</Text>
          </TouchableOpacity>
        </Card>

        <Card
          title="Assigned Vehicles"
          icon={<Ionicons name="car-outline" size={22} color={theme.primary} style={styles.cardIconEl} />}
        >
          {driver.vehicle_numbers && driver.vehicle_numbers.length > 0 ? (
            driver.vehicle_numbers.map((v, i) => (
              <Text key={i} style={styles.vehiclePlate}>{v}</Text>
            ))
          ) : (
            <Text style={styles.emptyText}>No vehicle assigned yet. Please contact admin.</Text>
          )}
        </Card>

        <Card
          title="Quick Actions"
          icon={<Ionicons name="flash-outline" size={22} color={theme.primary} style={styles.cardIconEl} />}
        >
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/upload-documents')}>
            <Text style={styles.actionBtnText}>Upload Documents</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/view-vehicles')}>
            <Text style={styles.actionBtnText}>View Vehicles</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>Contact Admin</Text>
          </TouchableOpacity>
        </Card>

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

  driverHeader: {
    ...cardStyle,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  driverAvatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: { backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, color: '#fff', fontWeight: '600' },
  driverInfo: { flex: 1, marginLeft: 16 },
  driverName: { fontSize: 18, fontWeight: '700', color: theme.text, marginBottom: 2 },
  driverCode: { fontSize: 13, color: theme.textSecondary, marginBottom: 4 },
  driverContactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  driverContact: { fontSize: 13, color: theme.textSecondary, flex: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6, marginTop: 4 },
  statusActive: { backgroundColor: theme.successLight },
  statusInactive: { backgroundColor: theme.errorLight },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusActiveText: { color: '#166534' },
  statusInactiveText: { color: '#991b1b' },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 8, paddingVertical: 8 },
  topBarSpacer: { flex: 1 },
  alertsButton: { padding: 8, position: 'relative' },
  alertsBadge: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: theme.error },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  alertsModal: { backgroundColor: theme.card, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 20, width: '100%', maxWidth: 360 },
  alertsModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  alertsModalTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  alertsEmpty: { fontSize: 14, color: theme.textSecondary, textAlign: 'center', paddingVertical: 16 },

  outstandingCard: { marginBottom: 16 },
  outstandingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  outstandingLabel: { fontSize: 14, color: theme.textSecondary, fontWeight: '500' },
  outstandingAmountRed: { fontSize: 22, fontWeight: '700', color: theme.error },
  outstandingRed: { borderColor: theme.error, backgroundColor: theme.errorLight },

  gridRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  gridCard: {
    flex: 1,
    padding: 14,
    marginBottom: 0,
    alignItems: 'center',
  },
  gridLabel: { fontSize: 12, color: theme.textSecondary, marginTop: 6, marginBottom: 4 },
  gridValueGreen: { fontSize: 14, fontWeight: '700', color: theme.success },
  gridValueRed: { fontSize: 14, fontWeight: '700', color: theme.error },

  card: { ...cardStyle },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIconEl: { marginRight: 10 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  docCompletionWrap: { marginBottom: 16 },
  docCompletionLabel: { fontSize: 14, color: theme.textSecondary, marginBottom: 6 },
  docCompletionPct: { fontSize: 14, fontWeight: '700', color: theme.text, marginTop: 6 },
  progressBarBg: { height: 8, backgroundColor: theme.border, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.primary, borderRadius: 4 },
  docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  docName: { fontSize: 14, color: theme.text },
  docStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  docUploaded: { fontSize: 13, color: theme.success, fontWeight: '600' },
  docPending: { fontSize: 13, color: theme.warning, fontWeight: '600' },
  docWarning: { backgroundColor: '#fef9c3', padding: 12, borderRadius: 10, marginTop: 12, marginBottom: 16 },
  docWarningText: { fontSize: 13, color: '#92400e' },
  alertItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.errorLight, padding: 12, borderRadius: 10, marginBottom: 8, gap: 8 },
  alertText: { flex: 1, fontSize: 13, color: theme.error, fontWeight: '500' },
  primaryButton: { backgroundColor: theme.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  primaryButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  vehiclePlate: { fontSize: 16, fontWeight: '600', color: theme.text, paddingVertical: 8 },
  emptyText: { fontSize: 14, color: theme.textSecondary, fontStyle: 'italic' },
  actionBtn: { backgroundColor: theme.borderLight, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: theme.text },
});
