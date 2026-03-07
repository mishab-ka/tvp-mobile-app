import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { theme, cardStyle } from '../../constants/theme';

const formatINR = (n: number | null | undefined) =>
  n != null ? `₹${Number(n).toLocaleString('en-IN')}` : '—';

function Row({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{String(value)}</Text>
    </View>
  );
}

export default function PaymentHistoryTab() {
  const router = useRouter();
  const { session, driver } = useAuth();

  useEffect(() => {
    if (!session) router.replace('/login');
  }, [session, router]);

  if (!driver) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const outstanding = Number(driver.outstanding_balance ?? 0);
  const perfScore = driver.performance_score != null ? Math.min(100, Math.max(0, Number(driver.performance_score))) : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Payment History</Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="wallet-outline" size={22} color={theme.primary} style={styles.cardIconEl} />
            <Text style={styles.cardTitle}>Earnings & Payments</Text>
          </View>
          <Row label="Total Earnings" value={formatINR(driver.total_earnings)} />
          <Row label="Cash Collected" value={formatINR(driver.total_cash_collect)} />
          <Row label="Deposit" value={formatINR(driver.deposit_amount)} />
          <View style={styles.divider} />
          <Row label="Outstanding Balance" value={formatINR(driver.outstanding_balance)} />
          <Row label="Net Outstanding" value={formatINR(driver.net_outstanding)} />
          <Row label="Penalty" value={formatINR(driver.penalty_amount)} />
          {outstanding > 0 && (
            <View style={styles.alertItem}>
              <Ionicons name="warning-outline" size={18} color={theme.error} />
              <Text style={styles.alertText}>You have pending payment balance.</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="stats-chart-outline" size={22} color={theme.primary} style={styles.cardIconEl} />
            <Text style={styles.cardTitle}>Performance</Text>
          </View>
          <View style={styles.perfScoreWrap}>
            <Text style={styles.perfScoreLabel}>Score</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${perfScore}%` }]} />
            </View>
            <Text style={styles.perfScoreValue}>{perfScore}%</Text>
          </View>
          <Row label="Payment Delay" value={driver.payment_delay_days != null ? `${driver.payment_delay_days} Days` : null} />
          <Row label="Rental Days" value={driver.cumulative_rental_days != null ? `${driver.cumulative_rental_days} Days` : null} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="list-outline" size={22} color={theme.primary} style={styles.cardIconEl} />
            <Text style={styles.cardTitle}>Recent Payments</Text>
          </View>
          <Text style={styles.emptyText}>Payment history will appear here once available.</Text>
        </View>

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
  card: { ...cardStyle },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardIconEl: { marginRight: 10 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.borderLight },
  rowLabel: { fontSize: 14, color: theme.textSecondary },
  rowValue: { fontSize: 14, fontWeight: '600', color: theme.text },
  divider: { height: 1, backgroundColor: theme.border, marginVertical: 8 },
  alertItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.errorLight, padding: 12, borderRadius: 10, marginTop: 8, gap: 8 },
  alertText: { flex: 1, fontSize: 13, color: theme.error, fontWeight: '500' },
  perfScoreWrap: { marginBottom: 12 },
  perfScoreLabel: { fontSize: 14, color: theme.textSecondary, marginBottom: 6 },
  perfScoreValue: { fontSize: 14, fontWeight: '700', color: theme.primary, marginTop: 6 },
  progressBarBg: { height: 8, backgroundColor: theme.border, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: theme.primary, borderRadius: 4 },
  emptyText: { fontSize: 14, color: theme.textSecondary, fontStyle: 'italic' },
});
