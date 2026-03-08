import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export interface VehicleAssignment {
  id: string;
  driver_id: string;
  vehicle_number: string;
  status: string | null;
  assigned_date: string | null;
  current_rental_days: number | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export default function ViewVehiclesScreen() {
  const router = useRouter();
  const { driver } = useAuth();
  const [assignments, setAssignments] = useState<VehicleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = async () => {
    if (!driver?.id) return;
    setError(null);
    const { data, error: err } = await supabase
      .from('tvp_vehicle_assignments')
      .select('*')
      .eq('driver_id', driver.id)
      .order('assigned_date', { ascending: false });

    if (err) {
      setError(err.message);
      setAssignments([]);
      return;
    }
    setAssignments((data as VehicleAssignment[]) ?? []);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAssignments();
    setRefreshing(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await fetchAssignments();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [driver?.id]);

  const vehicleNumbers = driver?.vehicle_numbers ?? [];
  const hasAssignments = assignments.length > 0;
  const showFallback = !hasAssignments && vehicleNumbers.length > 0;

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const renderVehicleCard = (item: {
    vehicle_number: string;
    status?: string | null;
    assigned_date?: string | null;
    current_rental_days?: number | null;
    notes?: string | null;
  }) => {
    const raw = (item.status ?? 'Active').trim() || 'Active';
    const isActive = raw.toLowerCase() === 'active';
    const statusStr = isActive ? 'Active' : 'Inactive';
    return (
      <View key={item.vehicle_number} style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Vehicle Number</Text>
          <Text style={styles.value}>{item.vehicle_number}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
              {statusStr}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Assigned Date</Text>
          <Text style={styles.value}>{formatDate(item.assigned_date ?? null)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Current Rental Days</Text>
          <Text style={styles.value}>{item.current_rental_days != null ? `${item.current_rental_days} days` : '—'}</Text>
        </View>
        {item.notes?.trim() ? (
          <View style={styles.notesRow}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.notesValue}>{item.notes}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  const showDriverNull = !driver;
  const showContent = !showDriverNull;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={showContent ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> : undefined}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Home</Text>
        </TouchableOpacity>

        <Text style={styles.title}>All Listed Vehicles</Text>
        <Text style={styles.subtitle}>Vehicle number, status, assigned date and current rental days for each vehicle</Text>

        {showDriverNull ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Loading profile...</Text>
            <Text style={styles.hint}>If this doesn’t load, go back and try again.</Text>
          </View>
        ) : loading ? (
          <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
        ) : error && !showFallback && vehicleNumbers.length === 0 && !showDriverNull ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No vehicles assigned yet.</Text>
            <Text style={styles.hint}>Contact admin to get a vehicle assigned.</Text>
          </View>
        ) : (
          <>
            {hasAssignments && assignments.map((a) => renderVehicleCard(a))}
            {showFallback && (
              <>
                <Text style={styles.fallbackTitle}>Your assigned vehicles</Text>
                <Text style={styles.fallbackHint}>Status, assigned date and rental days will show here when updated by admin.</Text>
                {vehicleNumbers.map((v) => renderVehicleCard({
                  vehicle_number: v,
                  status: 'Active',
                  assigned_date: null,
                  current_rental_days: null,
                }))}
              </>
            )}
            {!hasAssignments && vehicleNumbers.length === 0 && !error && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No vehicle assigned yet.</Text>
                <Text style={styles.hint}>Please contact admin.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  back: { marginBottom: 16 },
  backText: { fontSize: 16, color: '#2563eb', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  loader: { marginTop: 24 },
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
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusActive: { backgroundColor: '#d1fae5' },
  statusInactive: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 13, fontWeight: '600' },
  statusTextActive: { color: '#065f46' },
  statusTextInactive: { color: '#991b1b' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  label: { fontSize: 14, color: '#6b7280' },
  value: { fontSize: 14, fontWeight: '600', color: '#111827' },
  notesRow: { paddingVertical: 10 },
  notesValue: { fontSize: 14, color: '#374151', marginTop: 4 },
  emptyBox: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#374151', marginBottom: 8 },
  hint: { fontSize: 14, color: '#6b7280' },
  fallbackTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  fallbackHint: { fontSize: 13, color: '#6b7280', marginBottom: 16 },
});
