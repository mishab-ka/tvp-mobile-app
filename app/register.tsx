import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { uploadDriverDocument } from '../lib/upload';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

type ImageAsset = { uri: string } | null;

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, refreshDriver } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [alternativePhone, setAlternativePhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<ImageAsset>(null);
  const [aadharFront, setAadharFront] = useState<ImageAsset>(null);
  const [aadharBack, setAadharBack] = useState<ImageAsset>(null);
  const [licenseFront, setLicenseFront] = useState<ImageAsset>(null);
  const [licenseBack, setLicenseBack] = useState<ImageAsset>(null);
  const [uberPhotos, setUberPhotos] = useState<ImageAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pickImage = async (callback: (asset: ImageAsset) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to photos to upload images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      callback({ uri: result.assets[0].uri });
    }
  };

  const pickImageNoCrop = async (callback: (asset: ImageAsset) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to photos to upload images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      callback({ uri: result.assets[0].uri });
    }
  };

  const addUberPhoto = () => {
    pickImageNoCrop((asset) => {
      if (asset) setUberPhotos((p) => [...p, asset]);
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = 'Name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email';
    if (!phone.trim()) next.phone = 'Phone is required';
    if (!profilePhoto) next.profilePhoto = 'Profile photo is required';
    if (!aadharFront) next.aadharFront = 'Aadhar front is required';
    if (!aadharBack) next.aadharBack = 'Aadhar back is required';
    if (!licenseFront) next.licenseFront = 'Licence front is required';
    if (!licenseBack) next.licenseBack = 'Licence back is required';
    if (uberPhotos.length === 0) next.uberPhotos = 'At least one Uber profile photo is required';
    if (!password) next.password = 'Password is required';
    else if (password.length < 6) next.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    try {
      const { error: authError } = await signUp(email.trim(), password);
      if (authError) {
        setLoading(false);
        Alert.alert('Registration failed', authError.message);
        return;
      }

      const tasks: Array<() => Promise<{ type: string; url: string }>> = [];
      if (profilePhoto) {
        tasks.push(async () => ({
          type: 'profile',
          url: await uploadDriverDocument(email.trim(), 'profile', profilePhoto.uri),
        }));
      }
      if (aadharFront) {
        tasks.push(async () => ({
          type: 'aadhar_front',
          url: await uploadDriverDocument(email.trim(), 'aadhar_front', aadharFront.uri),
        }));
      }
      if (aadharBack) {
        tasks.push(async () => ({
          type: 'aadhar_back',
          url: await uploadDriverDocument(email.trim(), 'aadhar_back', aadharBack.uri),
        }));
      }
      if (licenseFront) {
        tasks.push(async () => ({
          type: 'license_front',
          url: await uploadDriverDocument(email.trim(), 'license_front', licenseFront.uri),
        }));
      }
      if (licenseBack) {
        tasks.push(async () => ({
          type: 'license_back',
          url: await uploadDriverDocument(email.trim(), 'license_back', licenseBack.uri),
        }));
      }
      uberPhotos.forEach((p, i) => {
        tasks.push(async () => ({
          type: 'uber',
          url: await uploadDriverDocument(email.trim(), 'uber', p.uri, i),
        }));
      });

      const results = await Promise.all(tasks.map((t) => t()));
      const profile_photo_url = results.find((r) => r.type === 'profile')?.url ?? null;
      const aadhar_front_url = results.find((r) => r.type === 'aadhar_front')?.url ?? null;
      const aadhar_back_url = results.find((r) => r.type === 'aadhar_back')?.url ?? null;
      const license_front_url = results.find((r) => r.type === 'license_front')?.url ?? null;
      const license_back_url = results.find((r) => r.type === 'license_back')?.url ?? null;
      const uber_driver_photos = results.filter((r) => r.type === 'uber').map((r) => r.url);

      const { error: insertError } = await supabase.from('tvp_drivers').insert({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        alternative_phone_1: alternativePhone.trim() || null,
        profile_photo_url,
        aadhar_front_url,
        aadhar_back_url,
        license_front_url,
        license_back_url,
        uber_driver_photos,
        status: 'active',
      });

      if (insertError) {
        setLoading(false);
        Alert.alert('Registration failed', insertError.message);
        return;
      }

      await refreshDriver();
      router.replace('/home');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const ImageButton = ({
    label,
    errorKey,
    value,
    onPick,
  }: {
    label: string;
    errorKey: string;
    value: ImageAsset;
    onPick: () => void;
  }) => (
    <View style={styles.imageField}>
      <Text style={styles.imageLabel}>{label}</Text>
      <TouchableOpacity style={styles.imageButton} onPress={onPick}>
        {value ? (
          <Image source={{ uri: value.uri }} style={styles.thumb} />
        ) : (
          <Text style={styles.imageButtonText}>Tap to add</Text>
        )}
      </TouchableOpacity>
      {errors[errorKey] ? <Text style={styles.errorText}>{errors[errorKey]}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Register as a driver</Text>

        <Input
          label="Full name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Your name"
          error={errors.fullName}
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
        <Input
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="Phone number"
          keyboardType="phone-pad"
          error={errors.phone}
        />
        <Input
          label="Alternative phone (optional)"
          value={alternativePhone}
          onChangeText={setAlternativePhone}
          placeholder="Optional"
          keyboardType="phone-pad"
        />

        <ImageButton label="Profile photo" errorKey="profilePhoto" value={profilePhoto} onPick={() => pickImage(setProfilePhoto)} />
        <ImageButton label="Aadhar card (front)" errorKey="aadharFront" value={aadharFront} onPick={() => pickImageNoCrop(setAadharFront)} />
        <ImageButton label="Aadhar card (back)" errorKey="aadharBack" value={aadharBack} onPick={() => pickImageNoCrop(setAadharBack)} />
        <ImageButton label="Driving licence (front)" errorKey="licenseFront" value={licenseFront} onPick={() => pickImageNoCrop(setLicenseFront)} />
        <ImageButton label="Driving licence (back)" errorKey="licenseBack" value={licenseBack} onPick={() => pickImageNoCrop(setLicenseBack)} />

        <View style={styles.imageField}>
          <Text style={styles.imageLabel}>Uber profile photo(s)</Text>
          <TouchableOpacity style={styles.imageButton} onPress={addUberPhoto}>
            <Text style={styles.imageButtonText}>+ Add photo</Text>
          </TouchableOpacity>
          {uberPhotos.length > 0 && (
            <View style={styles.uberList}>
              {uberPhotos.map((p, i) => (
                <View key={i} style={styles.uberThumbWrap}>
                  <Image source={{ uri: p.uri }} style={styles.thumbSmall} />
                  <TouchableOpacity
                    style={styles.removeUber}
                    onPress={() => setUberPhotos((prev) => prev.filter((_, j) => j !== i))}
                  >
                    <Text style={styles.removeUberText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          {errors.uberPhotos ? <Text style={styles.errorText}>{errors.uberPhotos}</Text> : null}
        </View>

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="Min 6 characters"
          secureTextEntry
          error={errors.password}
        />
        <Input
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repeat password"
          secureTextEntry
          error={errors.confirmPassword}
        />

        <Button title="Register" onPress={handleRegister} loading={loading} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.signUpLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  back: { marginBottom: 16 },
  backText: { fontSize: 16, color: '#2563eb', fontWeight: '500' },
  title: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 24 },
  imageField: { marginBottom: 16 },
  imageLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333' },
  imageButton: {
    height: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageButtonText: { color: '#666', fontSize: 14 },
  thumb: { width: '100%', height: '100%', borderRadius: 8 },
  thumbSmall: { width: 56, height: 56, borderRadius: 8 },
  uberList: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 },
  uberThumbWrap: { position: 'relative' },
  removeUber: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeUberText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: { fontSize: 12, color: '#c00', marginTop: 4 },
  footer: { flexDirection: 'row', marginTop: 24, justifyContent: 'center', alignItems: 'center' },
  footerText: { fontSize: 15, color: '#666' },
  signUpLink: { fontSize: 15, color: '#2563eb', fontWeight: '600' },
});
