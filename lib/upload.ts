import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

const BUCKET = 'driver-documents';

function sanitizePathSegment(email: string): string {
  return email.replace(/[^a-zA-Z0-9@._-]/g, '_');
}

/**
 * Read local file URI to Uint8Array for Supabase upload.
 */
async function uriToUint8Array(uri: string): Promise<{ data: Uint8Array; mime: string }> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  return { data: bytes, mime };
}

export async function uploadDriverDocument(
  email: string,
  type: string,
  uri: string,
  index?: number
): Promise<string> {
  const prefix = sanitizePathSegment(email);
  const suffix = index !== undefined ? `_${index}` : '';
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${prefix}/${type}${suffix}.${ext}`;

  const { data, mime } = await uriToUint8Array(uri);
  const { data: uploadData, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, data, { contentType: mime, upsert: true });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(uploadData.path);
  return urlData.publicUrl;
}
