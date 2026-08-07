import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

/**
 * Uploads a property image to Firebase Storage under `properties/{ownerUid}/{propertyId}/...`
 * Returns the public HTTPS download URL.
 */
export async function uploadPropertyPhoto(
  file: File,
  ownerUid: string,
  propertyId: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  if (!file) {
    throw new Error('No file selected for upload.');
  }

  // Validate File Type
  if (!ALLOWED_MIME_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
    throw new Error(`Invalid file format (${file.type || 'unknown'}). Please upload a JPEG, PNG, WEBP, AVIF, or GIF image.`);
  }

  // Validate File Size
  if (file.size > MAX_FILE_SIZE) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    throw new Error(`File "${file.name}" (${sizeInMB} MB) exceeds the maximum allowed size of 5 MB.`);
  }

  // ImgBB API Key check
  const imgbbApiKey = import.meta.env.VITE_IMGBB_API_KEY || (typeof window !== 'undefined' && (window as any).IMGBB_API_KEY);

  // 1. Try ImgBB if key is available
  if (imgbbApiKey) {
    try {
      if (onProgress) onProgress(30);
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
        method: 'POST',
        body: formData,
      });
      if (onProgress) onProgress(80);
      const data = await res.json();
      if (data && data.success && data.data && data.data.url) {
        if (onProgress) onProgress(100);
        return data.data.url as string;
      }
    } catch (e) {
      console.warn('ImgBB upload error, falling back:', e);
    }
  }

  // 2. Try Firebase Storage if initialized
  if (storage) {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${cleanFileName}`;
    const storagePath = `properties/${ownerUid}/${propertyId}/${uniqueName}`;
    const storageRef = ref(storage, storagePath);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || 'image/jpeg',
        customMetadata: {
          ownerUid,
          propertyId,
          originalName: file.name
        }
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (onProgress && snapshot.totalBytes > 0) {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Firebase Storage upload error:', error);
          // Fall back to base64 Data URL
          const reader = new FileReader();
          reader.onloadend = () => {
            if (onProgress) onProgress(100);
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (err: any) {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (onProgress) onProgress(100);
              resolve(reader.result as string);
            };
            reader.readAsDataURL(file);
          }
        }
      );
    });
  }

  // 3. Fallback to base64 Data URL if neither ImgBB nor Firebase Storage is available
  return new Promise((resolve, reject) => {
    if (onProgress) onProgress(50);
    const reader = new FileReader();
    reader.onloadend = () => {
      if (onProgress) onProgress(100);
      resolve(reader.result as string);
    };
    reader.onerror = (err) => reject(new Error('Failed to read file: ' + String(err)));
    reader.readAsDataURL(file);
  });
}

/**
 * Deletes a property photo from Firebase Storage given its HTTPS download URL.
 */
export async function deletePropertyPhoto(downloadUrl: string): Promise<void> {
  if (!storage || !downloadUrl) return;

  // Only attempt deletion for Firebase Storage URLs
  if (!downloadUrl.includes('firebasestorage.googleapis.com') && !downloadUrl.includes('firebasestorage')) {
    return;
  }

  try {
    const photoRef = ref(storage, downloadUrl);
    await deleteObject(photoRef);
  } catch (err: any) {
    console.warn(`Could not delete storage object at ${downloadUrl}:`, err?.message || err);
  }
}
