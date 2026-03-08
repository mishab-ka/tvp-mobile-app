import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');
const PREVIEW_MODAL_HEIGHT = Math.min(WINDOW_HEIGHT * 0.88, 640);
const PREVIEW_SCROLL_HEIGHT = PREVIEW_MODAL_HEIGHT - 60;
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { uploadDriverDocument } from '../lib/upload';

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
  const [uploadingUber, setUploadingUber] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const email = driver?.email?.trim();
  const hasDriver = !!driver && !!email;
  const uberPhotos = driver?.uber_driver_photos ?? [];

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

  const uploadedForPreview = useMemo(() => {
    if (!driver) return [];
    return DOCUMENTS.filter((doc) => getStatus(doc.field)).map((doc) => ({
      label: doc.label,
      url: (driver as Record<string, unknown>)[doc.field] as string,
    }));
  }, [driver]);

  const addUberPhoto = async () => {
    if (!hasDriver) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to photos to upload.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingUber(true);
    try {
      const url = await uploadDriverDocument(email!, 'uber', result.assets[0].uri, uberPhotos.length);
      const newUrls = [...uberPhotos, url];
      const { error } = await supabase
        .from('tvp_drivers')
        .update({ uber_driver_photos: newUrls })
        .eq('email', email);
      if (error) throw error;
      await refreshDriver();
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadingUber(false);
    }
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
                  <ActivityIndicator size="small" color="#2563eb" />
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

        <Text style={styles.sectionTitle}>Driver photos (Uber)</Text>
        <Text style={styles.sectionSubtitle}>Add one or more driver photos. These appear on your Home profile.</Text>
        <View style={styles.uberCard}>
          {uberPhotos.length > 0 && (
            <View style={styles.uberGrid}>
              {uberPhotos.map((url, i) => (
                <Image key={i} source={{ uri: url }} style={styles.uberThumb} resizeMode="cover" />
              ))}
            </View>
          )}
          <TouchableOpacity
            style={[styles.uberAddBtn, uploadingUber && styles.uberAddBtnDisabled]}
            onPress={addUberPhoto}
            disabled={uploadingUber}
          >
            {uploadingUber ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.uberAddBtnText}>+ Add driver photo</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.previewButton}
          onPress={() => setPreviewVisible(true)}
        >
          <Text style={styles.previewButtonText}>Preview Documents</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.previewOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setPreviewVisible(false)} />
          <View style={[styles.previewModal, { height: PREVIEW_MODAL_HEIGHT }]}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>Uploaded Documents</Text>
              <TouchableOpacity onPress={() => setPreviewVisible(false)} hitSlop={12}>
                <Text style={styles.previewClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={[styles.previewScroll, { height: PREVIEW_SCROLL_HEIGHT }]}
              contentContainerStyle={styles.previewScrollContent}
              showsVerticalScrollIndicator={true}
              bounces={true}
              scrollEventThrottle={16}
            >
              {uploadedForPreview.length === 0 ? (
                <Text style={styles.previewEmpty}>No documents uploaded yet.</Text>
              ) : (
                uploadedForPreview.map((item, i) => (
                  <View key={i} style={styles.previewItem}>
                    <Text style={styles.previewLabel}>{item.label}</Text>
                    <Image source={{ uri: item.url }} style={styles.previewImage} resizeMode="contain" />
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noDriver: { fontSize: 16, color: '#6b7280', marginBottom: 16 },
  back: { marginBottom: 16 },
  backText: { fontSize: 16, color: '#2563eb', fontWeight: '600' },
  backBtn: { paddingVertical: 12, paddingHorizontal: 20, backgroundColor: '#2563eb', borderRadius: 10 },
  backBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20, lineHeight: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  docRowDisabled: { opacity: 0.7 },
  docLeft: { flex: 1 },
  docLabel: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  docStatusOk: { fontSize: 13, color: '#059669' },
  docStatusPending: { fontSize: 13, color: '#d97706' },
  thumb: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f3f4f6' },
  uploadBadge: { backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  uploadBadgeText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  warningBox: { backgroundColor: '#fef3c7', padding: 14, borderRadius: 12, marginBottom: 20 },
  warningText: { fontSize: 13, color: '#92400e' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 6 },
  sectionSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  uberCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  uberGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  uberThumb: { width: 72, height: 72, borderRadius: 12, backgroundColor: '#f3f4f6' },
  uberAddBtn: { backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  uberAddBtnDisabled: { opacity: 0.7 },
  uberAddBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  previewButton: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  previewButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  previewTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  previewClose: { fontSize: 16, fontWeight: '600', color: '#2563eb' },
  previewScroll: {},
  previewScrollContent: { padding: 16, paddingBottom: 40 },
  previewItem: { marginBottom: 24 },
  previewLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  previewImage: { width: '100%', height: 180, backgroundColor: '#f3f4f6', borderRadius: 12 },
  previewEmpty: { fontSize: 15, color: '#6b7280', textAlign: 'center', paddingVertical: 24 },
});
