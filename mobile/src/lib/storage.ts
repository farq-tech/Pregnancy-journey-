/**
 * Uploads for the pregnancy file: ultrasound scans and reports, lab results,
 * prescriptions, journal photos.
 *
 * The `pregnancy-media` bucket is private. Objects are namespaced `<user_id>/…`
 * and the storage policies check that first path segment against `auth.uid()`,
 * so one user's scans are unreachable to another even with a valid session.
 * Nothing is rendered from a public URL — every read goes through a short-lived
 * signed URL.
 */

import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { supabase } from './supabase';

export const MEDIA_BUCKET = 'pregnancy-media';

/** How long a signed URL stays valid. Long enough to scroll, short enough to leak little. */
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type AttachmentOwner = 'record' | 'journal' | 'appointment';
export type AttachmentKind = 'photo' | 'document';

/** A file chosen in the UI but not yet uploaded. */
export type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  kind: AttachmentKind;
  size?: number;
};

export type Attachment = {
  id: string;
  ownerType: AttachmentOwner;
  ownerId: string;
  path: string;
  mimeType: string;
  kind: AttachmentKind;
  caption: string;
  sizeBytes: number | null;
};

/** Mirrors the bucket's `file_size_limit`, so we can fail before the round trip. */
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
  'application/pdf',
] as const;

function extensionFor(name: string, mimeType: string): string {
  const fromName = name.includes('.') ? name.split('.').pop() : null;
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return mimeType === 'application/pdf' ? 'pdf' : 'jpg';
}

/**
 * Object keys are generated rather than taken from the picked filename: two
 * scans really are often both called `IMG_0001.jpg`, and the path is unique in
 * the database.
 */
function objectPath(userId: string, ownerType: AttachmentOwner, picked: PickedFile): string {
  const unique = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${userId}/${ownerType}/${unique}.${extensionFor(picked.name, picked.mimeType)}`;
}

export class UploadError extends Error {}

/**
 * The picked file's bytes.
 *
 * On a device the picker hands back a `file://` path, which `expo-file-system`
 * reads directly. In a browser it hands back a `blob:` URL that only `fetch`
 * can resolve — and `expo-file-system`'s `File` has no web implementation, so
 * asking it would throw on the first upload.
 */
async function readPickedFile(picked: PickedFile): Promise<ArrayBuffer> {
  if (Platform.OS === 'web') {
    const response = await fetch(picked.uri);
    return await response.arrayBuffer();
  }
  return await new File(picked.uri).arrayBuffer();
}

/** Uploads one file and indexes it in `attachments`. */
export async function uploadAttachment(
  userId: string,
  ownerType: AttachmentOwner,
  ownerId: string,
  picked: PickedFile,
): Promise<Attachment> {
  if (!ALLOWED_MIME_TYPES.includes(picked.mimeType as (typeof ALLOWED_MIME_TYPES)[number])) {
    throw new UploadError('نوع الملف غير مدعوم — الصور و PDF فقط.');
  }

  const bytes = await readPickedFile(picked);

  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new UploadError('حجم الملف أكبر من 20 ميغابايت.');
  }

  const path = objectPath(userId, ownerType, picked);
  const upload = await supabase.storage.from(MEDIA_BUCKET).upload(path, bytes, {
    contentType: picked.mimeType,
    upsert: false,
  });
  if (upload.error) throw upload.error;

  const row = await supabase
    .from('attachments')
    .insert({
      user_id: userId,
      owner_type: ownerType,
      owner_id: ownerId,
      path,
      mime_type: picked.mimeType,
      kind: picked.kind,
      size_bytes: bytes.byteLength,
    })
    .select()
    .single();

  if (row.error) {
    // Don't leave the object behind if indexing failed — it would be invisible
    // to the app but still count against her storage.
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    throw row.error;
  }

  return toAttachment(row.data);
}

export async function removeAttachment(attachment: Attachment): Promise<void> {
  // Storage first: an orphaned row is visible and fixable, an orphaned object is
  // neither.
  const removed = await supabase.storage.from(MEDIA_BUCKET).remove([attachment.path]);
  if (removed.error) throw removed.error;
  const { error } = await supabase.from('attachments').delete().eq('id', attachment.id);
  if (error) throw error;
}

/** Signed URLs for a batch of paths, keyed by path. Missing entries are skipped. */
export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;

  const out: Record<string, string> = {};
  for (const entry of data ?? []) {
    if (entry.signedUrl && entry.path) out[entry.path] = entry.signedUrl;
  }
  return out;
}

export function toAttachment(row: {
  id: string;
  owner_type: string;
  owner_id: string;
  path: string;
  mime_type: string;
  kind: string;
  caption: string;
  size_bytes: number | null;
}): Attachment {
  return {
    id: row.id,
    ownerType: row.owner_type as AttachmentOwner,
    ownerId: row.owner_id,
    path: row.path,
    mimeType: row.mime_type,
    kind: row.kind as AttachmentKind,
    caption: row.caption,
    sizeBytes: row.size_bytes,
  };
}
