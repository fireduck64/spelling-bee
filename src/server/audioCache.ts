import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// 2-Year retention lifecycle in milliseconds (730 days)
export const RETENTION_TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;

const CACHE_DIR = path.resolve(process.cwd(), 'cache', 'audio');

// Ensure cache directory exists
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Failed to initialize audio cache directory:', err);
}

// Generate deterministic SHA-256 hash
export function computeAudioHash(voice: string, text: string): string {
  const normalized = `gemini:${voice.toLowerCase()}:${text.trim().toLowerCase()}`;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export interface CachedAudioResult {
  audio: string; // base64
  mimeType: string;
  cached: boolean;
  hash: string;
}

// Retrieve audio from server cache if present
export function getCachedAudio(voice: string, text: string): CachedAudioResult | null {
  try {
    const hash = computeAudioHash(voice, text);
    const wavPath = path.join(CACHE_DIR, `${hash}.wav`);

    if (!fs.existsSync(wavPath)) {
      return null;
    }

    const stats = fs.statSync(wavPath);
    const now = Date.now();

    // Check if expired past 2 years
    if (now - stats.mtimeMs > RETENTION_TWO_YEARS_MS) {
      deleteCacheEntry(hash);
      return null;
    }

    const buffer = fs.readFileSync(wavPath);
    const base64Audio = buffer.toString('base64');

    // Update last access time asynchronously
    fs.utimes(wavPath, new Date(), stats.mtime, () => {});

    return {
      audio: base64Audio,
      mimeType: 'audio/wav',
      cached: true,
      hash,
    };
  } catch (err) {
    console.warn('Error reading from audio cache:', err);
    return null;
  }
}

// Save synthesized audio to disk cache with metadata sidecar
export function saveCachedAudio(
  voice: string,
  text: string,
  base64Audio: string
): void {
  try {
    const hash = computeAudioHash(voice, text);
    const wavPath = path.join(CACHE_DIR, `${hash}.wav`);
    const metaPath = path.join(CACHE_DIR, `${hash}.json`);

    const buffer = Buffer.from(base64Audio, 'base64');
    fs.writeFileSync(wavPath, buffer);

    const metadata = {
      hash,
      voice,
      textSnippet: text.slice(0, 120),
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      sizeBytes: buffer.length,
    };
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
  } catch (err) {
    console.warn('Error writing to audio cache:', err);
  }
}

// Delete cache entry and metadata
export function deleteCacheEntry(hash: string): void {
  try {
    const wavPath = path.join(CACHE_DIR, `${hash}.wav`);
    const metaPath = path.join(CACHE_DIR, `${hash}.json`);
    if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
    if (fs.existsSync(metaPath)) fs.unlinkSync(metaPath);
  } catch {}
}

// Automated 2-Year Lifecycle Cleanup Routine
export function runLifecycleCleanup(maxAgeMs = RETENTION_TWO_YEARS_MS): {
  inspectedCount: number;
  deletedCount: number;
} {
  let inspectedCount = 0;
  let deletedCount = 0;

  try {
    if (!fs.existsSync(CACHE_DIR)) return { inspectedCount, deletedCount };

    const files = fs.readdirSync(CACHE_DIR);
    const now = Date.now();

    for (const file of files) {
      if (!file.endsWith('.wav')) continue;

      inspectedCount++;
      const filePath = path.join(CACHE_DIR, file);

      try {
        const stats = fs.statSync(filePath);
        const ageMs = now - stats.mtimeMs;

        if (ageMs > maxAgeMs) {
          const hash = file.replace(/\.wav$/, '');
          deleteCacheEntry(hash);
          deletedCount++;
        }
      } catch (e) {
        console.warn(`Error inspecting cache file ${file}:`, e);
      }
    }

    if (deletedCount > 0) {
      console.log(
        `[Audio Cache Lifecycle] Cleaned up ${deletedCount} expired audio files older than 2 years.`
      );
    }
  } catch (err) {
    console.error('Error during audio cache lifecycle cleanup:', err);
  }

  return { inspectedCount, deletedCount };
}

// Get cache statistics
export function getCacheStats() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      return { fileCount: 0, totalSizeBytes: 0, totalSizeMB: '0.00', retentionDays: 730 };
    }

    const files = fs.readdirSync(CACHE_DIR);
    let wavCount = 0;
    let totalSizeBytes = 0;

    for (const file of files) {
      if (file.endsWith('.wav')) {
        wavCount++;
        const stats = fs.statSync(path.join(CACHE_DIR, file));
        totalSizeBytes += stats.size;
      }
    }

    return {
      fileCount: wavCount,
      totalSizeBytes,
      totalSizeMB: (totalSizeBytes / (1024 * 1024)).toFixed(2),
      retentionDays: 730, // 2 years
    };
  } catch {
    return { fileCount: 0, totalSizeBytes: 0, totalSizeMB: '0.00', retentionDays: 730 };
  }
}

// Clear entire audio cache directory
export function clearAllAudioCache(): { deletedCount: number } {
  let deletedCount = 0;
  try {
    if (fs.existsSync(CACHE_DIR)) {
      const files = fs.readdirSync(CACHE_DIR);
      for (const file of files) {
        fs.unlinkSync(path.join(CACHE_DIR, file));
        deletedCount++;
      }
    }
  } catch (err) {
    console.error('Error clearing audio cache:', err);
  }
  return { deletedCount };
}

// Start daily automated lifecycle cleaner
export function startAudioCacheLifecycleTimer(): void {
  // Run on startup
  setTimeout(() => {
    runLifecycleCleanup();
  }, 2000);

  // Run every 24 hours
  setInterval(() => {
    runLifecycleCleanup();
  }, 24 * 60 * 60 * 1000);
}
