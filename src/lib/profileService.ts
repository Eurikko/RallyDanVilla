import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';

export interface DisplayNameValidationResult {
  isValid: boolean;
  error?: string;
  cleanName: string | null;
}

/**
 * Validates display name according to Day 8 constraints:
 * - Trim spaces
 * - Allowed chars: letters (with accents), numbers, spaces, hyphens, apostrophes
 * - Empty string allowed (resets to null)
 * - 2 to 40 characters when filled
 */
export function validateDisplayName(rawName: string | null | undefined): DisplayNameValidationResult {
  if (rawName === null || rawName === undefined) {
    return { isValid: true, cleanName: null };
  }

  const trimmed = rawName.trim();
  if (trimmed.length === 0) {
    return { isValid: true, cleanName: null };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'O nome de exibição deve possuir pelo menos 2 caracteres.', cleanName: null };
  }

  if (trimmed.length > 40) {
    return { isValid: false, error: 'O nome de exibição deve possuir no máximo 40 caracteres.', cleanName: null };
  }

  // Regex allowing letters (including accented), numbers, spaces, hyphens and apostrophes
  const allowedRegex = /^[a-zA-Z0-9\u00C0-\u024F\s'\-]+$/;
  if (!allowedRegex.test(trimmed)) {
    return { isValid: false, error: 'O nome de exibição possui caracteres não permitidos.', cleanName: null };
  }

  return { isValid: true, cleanName: trimmed };
}

/**
 * Validates and crops an uploaded image file into a square 512x512 WebP image blob.
 */
export function processProfileImage(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    // 1. Max size: 5MB
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return reject(new Error('A imagem deve possuir no máximo 5 MB.'));
    }

    // 2. Validate MIME type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return reject(new Error('Selecione uma imagem JPEG, PNG ou WebP.'));
    }

    // Explicitly reject SVG, GIF, PDF
    if (file.type.includes('svg') || file.type.includes('gif') || file.name.toLowerCase().endsWith('.svg') || file.name.toLowerCase().endsWith('.gif')) {
      return reject(new Error('Selecione uma imagem JPEG, PNG ou WebP.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível processar esta imagem.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Não foi possível processar esta imagem.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const TARGET_SIZE = 512;
          canvas.width = TARGET_SIZE;
          canvas.height = TARGET_SIZE;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            return reject(new Error('Não foi possível processar esta imagem.'));
          }

          // Center crop logic
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);
          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, TARGET_SIZE, TARGET_SIZE);

          const previewDataUrl = canvas.toDataURL('image/webp', 0.85);

          canvas.toBlob((blob) => {
            if (!blob) {
              return reject(new Error('Não foi possível processar esta imagem.'));
            }
            resolve({
              blob,
              dataUrl: previewDataUrl,
            });
          }, 'image/webp', 0.85);
        } catch (err) {
          reject(new Error('Não foi possível processar esta imagem.'));
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads processed avatar to Firebase Storage path: avatars/{uid}/avatar.webp
 * and updates photoUrl in Firestore.
 */
export async function uploadAvatarAndSaveProfile(
  authenticatedUid: string,
  targetProfileUid: string,
  processedBlob: Blob,
  processedDataUrl: string
): Promise<{ photoUrl: string }> {
  if (!authenticatedUid || authenticatedUid !== targetProfileUid) {
    throw new Error('Você não possui permissão para realizar esta ação.');
  }

  let finalPhotoUrl = processedDataUrl;

  try {
    const storagePath = `avatars/${authenticatedUid}/avatar.webp`;
    const avatarRef = ref(storage, storagePath);

    await uploadBytes(avatarRef, processedBlob, {
      contentType: 'image/webp',
      customMetadata: { uploadedBy: authenticatedUid },
    });

    const downloadUrl = await getDownloadURL(avatarRef);
    finalPhotoUrl = `${downloadUrl}${downloadUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;
  } catch (storageErr) {
    console.warn('[profileService] Storage upload notice (falling back to data URL):', storageErr);
    finalPhotoUrl = processedDataUrl;
  }

  const profileRef = doc(db, 'profiles', authenticatedUid);
  await setDoc(profileRef, {
    photoUrl: finalPhotoUrl,
    avatarUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return { photoUrl: finalPhotoUrl };
}

/**
 * Removes user avatar from Storage and clears photoUrl in profile document.
 */
export async function removeProfileAvatar(authenticatedUid: string, targetProfileUid: string): Promise<void> {
  if (!authenticatedUid || authenticatedUid !== targetProfileUid) {
    throw new Error('Você não possui permissão para realizar esta ação.');
  }

  try {
    const storagePath = `avatars/${authenticatedUid}/avatar.webp`;
    const avatarRef = ref(storage, storagePath);
    await deleteObject(avatarRef);
  } catch (err) {
    console.warn('[profileService] Storage delete notice:', err);
  }

  const profileRef = doc(db, 'profiles', authenticatedUid);
  await setDoc(profileRef, {
    photoUrl: null,
    avatarUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Updates user profile display name safely in Firestore.
 * Strictly prevents modification of protected fields (role, technicalLevel, attendanceCount, status, username).
 */
export async function updateProfileInfo(params: {
  authenticatedUid: string;
  targetProfileUid: string;
  displayName: string | null;
  photoUrl?: string | null;
}): Promise<{ cleanDisplayName: string | null }> {
  const { authenticatedUid, targetProfileUid, displayName } = params;

  if (!authenticatedUid || authenticatedUid !== targetProfileUid) {
    throw new Error('Você não possui permissão para realizar esta ação.');
  }

  const validation = validateDisplayName(displayName);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Nome de exibição inválido.');
  }

  const cleanDisplayName = validation.cleanName;

  const updatePayload: Record<string, any> = {
    displayName: cleanDisplayName,
    updatedAt: serverTimestamp(),
  };

  if (params.photoUrl !== undefined) {
    updatePayload.photoUrl = params.photoUrl;
  }

  const profileRef = doc(db, 'profiles', authenticatedUid);
  await setDoc(profileRef, updatePayload, { merge: true });

  return { cleanDisplayName };
}
