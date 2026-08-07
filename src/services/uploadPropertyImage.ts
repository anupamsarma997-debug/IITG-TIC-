import { ref, deleteObject } from 'firebase/storage';
import { storage, auth } from '../lib/firebase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = (e) => reject(e);
    r.readAsDataURL(file);
  });
}

export async function uploadPropertyPhoto(
  file: File,
  ownerUid: string,
  propertyId: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (!file) throw new Error('No file selected for upload.');
  if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
    throw new Error('Invalid file format.');
  }
  if (file.size > MAX_FILE_SIZE) throw new Error('File too large.');

  // Get Firebase ID token for server verification
  const currentUser = auth?.currentUser;
  if (!currentUser) throw new Error('User must be signed in to upload images.');
  const idToken = await currentUser.getIdToken(true);

  // Read file as base64 data URL
  const dataUrl = await readFileAsDataUrl(file);
  const name = `${ownerUid}_${propertyId}_${Date.now()}`;

  const resp = await fetch('/api/upload-imgbb', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ imageBase64: dataUrl, name }),
  });

  const json = await resp.json();
  if (!resp.ok || !json.success) {
    throw new Error(json.error || 'Upload failed');
  }

  const data = json.data;
  const displayUrl = data.display_url || data.url || (data.image && data.image.url);
  const deleteUrl = data.delete_url || null;

  if (!displayUrl) throw new Error('ImgBB did not return a usable image URL.');

  // Return display URL (append delete token as fragment for backward compatibility)
  return deleteUrl ? `${displayUrl}#delete=${encodeURIComponent(deleteUrl)}` : displayUrl;
}

export async function deletePropertyPhoto(downloadUrl: string): Promise<void> {
  if (!downloadUrl) return;

  // If ImgBB fragment present, call serverless delete endpoint with id token
  const idx = downloadUrl.indexOf('#delete=');
  if (idx !== -1) {
    const encoded = downloadUrl.substring(idx + '#delete='.length);
    const deleteUrl = decodeURIComponent(encoded);

    const currentUser = auth?.currentUser;
    if (!currentUser) {
      console.warn('User not signed in; cannot call delete proxy.');
      return;
    }
    const idToken = await currentUser.getIdToken(true);

    const resp = await fetch('/api/delete-imgbb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ deleteUrl }),
    });
    if (!resp.ok) {
      const json = await resp.json().catch(() => ({}));
      console.warn('ImgBB delete proxy failed:', json);
    }
    return;
  }

  // Fallback: Firebase deletion logic if it's a Firebase storage URL
  if ((downloadUrl.includes('firebasestorage.googleapis.com') || downloadUrl.includes('firebasestorage')) && storage) {
    const getStoragePathFromDownloadUrl = (url: string): string | null => {
      try {
        if (url.startsWith('gs://')) {
          const withoutScheme = url.replace('gs://', '');
          const idx = withoutScheme.indexOf('/');
          if (idx === -1) return null;
          return withoutScheme.substring(idx + 1);
        }
        const match = url.match(/\/o\/([^?]+)/);
        if (match && match[1]) return decodeURIComponent(match[1]);
        try {
          const u = new URL(url);
          const path = u.pathname.split('/o/')[1];
          if (path) return decodeURIComponent(path.split('?')[0]);
        } catch (e) {}
        return null;
      } catch (e) {
        return null;
      }
    };

    try {
      const storagePath = getStoragePathFromDownloadUrl(downloadUrl);
      if (!storagePath) {
        console.warn('unable to determine storage path from URL', downloadUrl);
        return;
      }
      const photoRef = ref(storage, storagePath);
      await deleteObject(photoRef);
    } catch (err: any) {
      console.warn('Could not delete storage object:', err?.message || err);
    }
    return;
  }

  console.warn('Unknown provider or missing delete token for URL:', downloadUrl);
}
