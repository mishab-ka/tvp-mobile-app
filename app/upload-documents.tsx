import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { uploadDriverDocument } from '../lib/upload';
import { theme } from '../constants/theme';

const DOCUMENTS = [
  { id: 'profile', label: 'Profile Photo', field: 'profile_photo_url', type: 'profile' },
  { id: 'aadhar_front', label: 'Aadhar Card (Front)', field: 'aadhar_front_url', type: 'aadhar_front' },
  { id: 'aadhar_back', label: 'Aadhar Card (Back)', field: 'aadhar_back_url', type: 'aadhar_back' },
  { id: 'license_front', label: 'Driving License (Front)', field: 'license_front_url', type: 'license_front' },
  { id: 'license_back', label: 'Driving License (Back)', field: 'license_back_url', type: 'license_back' },
] as const;

export default function UploadDocumentsScreen() {
  const router = useRouter();
  const { driver, refreshDriver } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);

  const email = driver?.email?.trim();
  const hasDriver = !!driver && !!email;

  const pickAndUpload = async (doc: (typeof DOCUMENTS)[number]) => {
    if (!hasDriver) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to photos to upload documents.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: doc.id === 'profile',
      aspect: doc.id === 'profile' ? [1, 1] : undefined,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(doc.id);
    try {
      const url = await uploadDriverDocument(email, doc.type, result.assets[0].uri);
      const { error } = await supabase
        .from('tvp_drivers')
        .update({ [doc.field]: url })
        .eq('email', email);

      if (error) throw error;
      await refreshDriver();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Upload failed';
      Alert.alert('Error', message);
    } finally {
      setUploading(null);
    }
  };

  const getStatus = (field: string) => {
    if (!driver) return false;
    const v = (driver as Record<string, unknown>)[field];
    return typeof v === 'string' && v.trim().length > 0;
  };

  if (!hasDriver) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}>
          <Text style={styles.noDriver}>Driver profile not found.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back to Home</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Upload Documents</Text>
        <Text style={styles.subtitle}>
          Tap a document to upload. You need to upload: Profile Photo, Aadhar (front & back), and Driving License (front & back).
        </Text>

        <View style={styles.card}>
          {DOCUMENTS.map((doc) => {
            const uploaded = getStatus(doc.field);
            const loading = uploading === doc.id;
            return (
              <TouchableOpacity
                key={doc.id}
                style={[styles.docRow, loading && styles.docRowDisabled]}
                onPress={() => !loading && pickAndUpload(doc)}
                disabled={loading}
              >
                <View style={styles.docLeft}>
                  <Text style={styles.docLabel}>{doc.label}</Text>
                  <Text style={uploaded ? styles.docStatusOk : styles.docStatusPending}>
                    {uploaded ? 'Uploaded ✅' : 'Pending — Tap to upload'}
                  </Text>
                </View>
                {loading ? (
                  <ActivityIndicator size="small" color={theme.primary} />
                ) : uploaded && doc.id === 'profile' && driver?.profile_photo_url ? (
                  <Image source={{ uri: driver.profile_photo_url }} style={styles.thumb} />
                ) : (
                  <View style={styles.uploadBadge}>
                    <Text style={styles.uploadBadgeText}>{uploaded ? 'Change' : 'Upload'}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>⚠ Upload clear photos. All 5 documents are required to activate your account.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.backgroundSecondary },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noDriver: { fontSize: 16, color: theme.textSecondary, marginBottom: 16 },
  back: { marginBottom: 16 },
  backText: { fontSize: 16, color: theme.primary, fontWeight: '600' },
  backBtn: { paddingVertical: 12, paddingHorizontal: 20, backgroundColor: theme.primary, borderRadius: 12 },
  backBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: theme.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: theme.textSecondary, marginBottom: 20, lineHeight: 20 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 4,
    marginBottom: 20,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  docRowDisabled: { opacity: 0.7 },
  docLeft: { flex: 1 },
  docLabel: { fontSize: 16, fontWeight: '600', color: theme.text, marginBottom: 4 },
  docStatusOk: { fontSize: 13, color: theme.success },
  docStatusPending: { fontSize: 13, color: theme.warning },
  thumb: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.borderLight },
  uploadBadge: { backgroundColor: theme.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  uploadBadgeText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  warningBox: { backgroundColor: '#fef9c3', padding: 14, borderRadius: 12 },
  warningText: { fontSize: 13, color: '#92400e' },
});
