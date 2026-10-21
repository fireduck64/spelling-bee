# Cost Analysis & On-Demand Audio Caching Architecture

Comprehensive cost analysis and architectural plan for server-side on-demand audio caching powered by Gemini TTS, featuring a 2-year automatic lifecycle expiration policy.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Architecture & Decisions**:
> - **Primary TTS Engine**: Gemini TTS (`gemini-3.8-flash-lite-tts`) with prebuilt voice options (`Kore`, `Puck`, `Zephyr`, `Charon`, `Fenrir`).
> - **Caching Mechanism**: Server-side on-demand caching. The first time any student plays a word or letter correction, the audio is generated via Gemini TTS and stored on the server filesystem (`./cache/audio/`). All subsequent plays from any student/device are served in <15ms directly from cache with zero API calls.
> - **2-Year Lifecycle Management**: Audio cache entries have an automated 2-year expiration TTL (`730 days`). An automated background cleaner checks file metadata and purges any audio artifacts exceeding 2 years of age.

---

## 1. Cost & Reliability Breakdown (Gemini TTS)

### Economics of 15-Word Student Drills

| Metric | Without Caching | With On-Demand Caching |
| :--- | :--- | :--- |
| **API Calls per Student** | ~25 live Gemini TTS calls | 0 calls (if cached) or 1 per new word |
| **Class of 25 Students** | **~625 live API requests** | **~25 requests total** (96% reduction) |
| **Cost per 25 Students** | ~$0.15 to $0.25 | **$0.007 total** |
| **Rate Limit Risk (RPM)** | **Severe** (Exceeds 60 RPM tier limit) | **Zero** (Served locally from disk) |
| **Playback Latency** | 1,200ms – 2,200ms per word | **< 15ms (instantaneous)** |
| **Server Disk Storage** | 0 MB | ~4.2 MB total for 15 words (~$0.00001 / mo) |

**Key Takeaway**: Caching is essential starting at **2 students** to eliminate API rate-limit throttling in classrooms and provide instantaneous typing/listening cadence.

---

## 2. Technical Architecture & 2-Year Lifecycle

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Student Browsers (1..N)                         │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
             1st Student Plays                Subsequent Students
                    │                                │
                    ▼                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Express API Server (/api/tts)                      │
│                                                                        │
│   1. Compute SHA-256 Key: sha256(engine + voice + rate + text)         │
│   2. Check Cache Directory: ./cache/audio/<hash>.wav                   │
│                                                                        │
│          ┌───────────────────────────┴───────────────────────────┐     │
│          ▼ [CACHE HIT]                                           ▼     │
│   Stream from disk / memory                           [CACHE MISS]     │
│   Update access timestamp                                        │     │
│   Response: 200 OK (<15ms)                                       ▼     │
│                                                       Call Gemini TTS  │
│                                                       Save to disk     │
│                                                       Set mtime/ctime  │
│                                                       Respond to client│
├────────────────────────────────────────────────────────────────────────┤
│                   Automated 2-Year Lifecycle Manager                   │
│   - Daily sweep + startup verification                                 │
│   - Scans ./cache/audio/                                               │
│   - Deletes files where (Date.now() - mtime) > 2 years (730 days)      │
└────────────────────────────────────────────────────────────────────────┘
```

### Lifecycle & Storage Specifications
1. **Cache Location & Filename**:
   - Directory: `./cache/audio/`
   - File format: `<sha256-hash>.wav`
   - Metadata sidecar (optional / embedded): `<sha256-hash>.json` containing `createdAt`, `lastAccessed`, `voice`, and `textSnippet`.
2. **2-Year Expiration Routine**:
   - Retention Period: `2 * 365 * 24 * 60 * 60 * 1000 ms` (63,072,000,000 ms / 730 days).
   - Execution: Runs on server boot and every 24 hours via `setInterval` / scheduled check.
   - Deletion: Any `.wav` and associated metadata files older than 2 years are safely unlinked and logged.
3. **HTTP Caching Headers**:
   - `Cache-Control: public, max-age=31536000, immutable` and `ETag: "<hash>"`.
   - Allows student browsers to also retain the audio in local HTTP cache during study sessions.
4. **Cache Statistics & Management**:
   - Internal endpoint `GET /api/cache-stats` reporting:
     - Total cached files count
     - Total disk usage (in MB)
     - Oldest and newest cache entries
     - Count of expired files cleaned up by the lifecycle manager.

---

## 3. Implementation Steps

1. **Cache & Lifecycle Module (`server.ts` / `src/server/cacheManager.ts`)**:
   - Create disk cache directory if it doesn't exist.
   - Implement `getCachedAudio(key)` and `saveCachedAudio(key, buffer)`.
   - Implement `runLifecycleCleanup(maxAgeMs = 2 * 365 * 24 * 60 * 60 * 1000)`: scans directory, checks file modification timestamps, unlinks expired files.
   - Register daily lifecycle cron / interval.
2. **Endpoint Integration (`/api/tts`)**:
   - On incoming request, check cache before calling Gemini API.
   - On cache miss, fetch from `ai.models.generateContent({ model: 'gemini-3.8-flash-lite-tts' })`, write to disk, and return.
   - Add `/api/cache-stats` for monitoring.
3. **Verification**:
   - Verify initial turn writes to disk cache.
   - Verify subsequent turn serves directly from disk in <15ms.
   - Verify lifecycle cleanup accurately identifies and deletes simulated files older than 2 years without affecting active files.
