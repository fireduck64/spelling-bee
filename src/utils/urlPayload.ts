import { ListPayload } from '../types';
import { gzipSync, gunzipSync, inflateSync, strToU8, strFromU8 } from 'fflate';

// Convert Uint8Array to URL-safe Base64
function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Convert URL-safe Base64 to Uint8Array
function fromBase64Url(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encodes a word list payload using Gzip compression + URL-safe Base64.
 * Yields ~50% smaller URLs compared to uncompressed JSON.
 */
export function encodeListPayload(payload: ListPayload): string {
  try {
    const jsonStr = JSON.stringify(payload);
    const uncompressedBytes = strToU8(jsonStr);

    // Gzip with maximum compression level
    const gzipped = gzipSync(uncompressedBytes, { level: 9 });
    return toBase64Url(gzipped);
  } catch (err) {
    console.error('Failed to encode list payload with gzip:', err);
    // Fallback to basic base64
    try {
      return toBase64Url(strToU8(JSON.stringify(payload)));
    } catch {
      return '';
    }
  }
}

/**
 * Decodes a payload from URL query string.
 * Supports:
 * 1. Gzip compressed payloads (default modern format, 0x1f 0x8b magic number)
 * 2. Deflate compressed payloads
 * 3. Legacy uncompressed Base64 payloads (backwards-compatible with older URLs)
 */
export function decodeListPayload(encoded: string): ListPayload | null {
  try {
    if (!encoded) return null;

    const bytes = fromBase64Url(encoded);
    let jsonStr = '';

    // 1. Check for Gzip magic bytes (0x1f, 0x8b)
    if (bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
      try {
        jsonStr = strFromU8(gunzipSync(bytes));
      } catch (gzErr) {
        console.warn('Gunzip error, trying inflate:', gzErr);
      }
    }

    // 2. If not gzip or if gunzip failed, attempt inflate (raw deflate/zlib)
    if (!jsonStr) {
      try {
        jsonStr = strFromU8(inflateSync(bytes));
      } catch {
        // Not deflate
      }
    }

    // 3. Fallback: try raw uncompressed UTF-8 or legacy URI-encoded format
    if (!jsonStr) {
      const rawText = strFromU8(bytes);
      try {
        jsonStr = decodeURIComponent(rawText);
      } catch {
        jsonStr = rawText;
      }
    }

    const parsed = JSON.parse(jsonStr);

    // Handle standard schema: { title, words, benchmark }
    // Or compact schema: { t, w, b }
    const rawWords = parsed.words || parsed.w;
    if (!parsed || !Array.isArray(rawWords) || rawWords.length === 0) {
      return null;
    }

    const cleanWords = rawWords
      .map((w: any) => String(w).trim())
      .filter(Boolean);

    if (cleanWords.length === 0) return null;

    const rawTitle = parsed.title || parsed.t;
    const rawBench = parsed.benchmark || parsed.b;

    let targetAccuracy = 80;
    let requireAllAttempted = true;
    let requireAllMastered = true;

    if (Array.isArray(rawBench)) {
      // Compact array format [targetAccuracy, requireAllAttempted, requireAllMastered]
      if (typeof rawBench[0] === 'number') targetAccuracy = rawBench[0];
      if (typeof rawBench[1] === 'number' || typeof rawBench[1] === 'boolean') {
        requireAllAttempted = Boolean(rawBench[1]);
      }
      if (typeof rawBench[2] === 'number' || typeof rawBench[2] === 'boolean') {
        requireAllMastered = Boolean(rawBench[2]);
      }
    } else if (rawBench && typeof rawBench === 'object') {
      if (typeof rawBench.targetAccuracy === 'number') targetAccuracy = rawBench.targetAccuracy;
      if (typeof rawBench.requireAllAttempted === 'boolean') requireAllAttempted = rawBench.requireAllAttempted;
      if (typeof rawBench.requireAllMastered === 'boolean') requireAllMastered = rawBench.requireAllMastered;
    }

    return {
      title: rawTitle ? String(rawTitle).trim() : 'Spelling Bee Practice',
      words: cleanWords,
      benchmark: {
        targetAccuracy,
        requireAllAttempted,
        requireAllMastered,
      },
    };
  } catch (err) {
    console.error('Failed to decode list payload:', err);
    return null;
  }
}
