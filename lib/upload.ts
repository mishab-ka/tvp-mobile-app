import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

const BUCKET = 'driver-documents';

function sanitizePathSegment(email: string): string {
  return email.replace(/[^a-zA-Z0-9@._-]/g, '_');
}

function getMime(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  return ext === 'png' ? 'image/png' : 'image/jpeg';
}

/**
 * Read local file URI to Uint8Array.
 * Uses XMLHttpRequest (reliable for file:// and content:// in RN), then FileSystem base64 as fallback.
 */
function readUriAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', uri, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response) resolve(xhr.response);
      else reject(new Error('XHR failed'));
    };
    xhr.onerror = () => reject(new Error('XHR error'));
    xhr.send(null);
  });
}

async function uriToUint8Array(uri: string): Promise<{ data: Uint8Array; mime: string }> {
  const mime = getMime(uri);

  try {
    const arrayBuffer = await readUriAsArrayBuffer(uri);
    const data = new Uint8Array(arrayBuffer);
    return { data, mime };
  } catch {
    // Fallback: FileSystem base64 (handle string or object with .base64)
    const result = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const base64 =
      result == null
        ? ''
        : typeof result === 'string'
          ? result
          : typeof result === 'object' && result !== null && 'base64' in result
            ? (result as { base64: string }).base64
            : '';
    if (!base64) throw new Error('Could not read file');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { data: bytes, mime };
  }
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
