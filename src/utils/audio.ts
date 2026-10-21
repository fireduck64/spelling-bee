import { VoiceSettings } from '../types';

let audioCtx: AudioContext | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(console.error);
  }
  return audioCtx;
}

// Memory cache for synthesized AudioBuffers: key -> AudioBuffer
const audioBufferCache = new Map<string, AudioBuffer>();
const inFlightRequests = new Map<string, Promise<AudioBuffer | null>>();

// Stop any currently playing audio immediately
export function stopAllAudio(): void {
  if (currentSourceNode) {
    try {
      currentSourceNode.stop();
    } catch {}
    currentSourceNode.disconnect();
    currentSourceNode = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

// Convert base64 string to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Check if buffer starts with 'RIFF' header
function isWav(bytes: Uint8Array): boolean {
  return (
    bytes.length > 4 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46    // F
  );
}

// Decode raw 16-bit PCM (24000 Hz) into an AudioBuffer
function decodeRawPCM(ctx: AudioContext, bytes: Uint8Array, sampleRate = 24000): AudioBuffer {
  // Ensure 2-byte alignment with clean ArrayBuffer
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const int16 = new Int16Array(copy.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  const audioBuffer = ctx.createBuffer(1, float32.length, sampleRate);
  audioBuffer.getChannelData(0).set(float32);
  return audioBuffer;
}

// Synthesize or fetch AudioBuffer for a given text
export async function getSynthesizedAudio(
  text: string,
  settings: VoiceSettings,
  cacheKey?: string
): Promise<AudioBuffer | null> {
  const key = cacheKey || `${settings.engine}:${settings.geminiVoice}:${settings.elevenLabsVoiceId}:${text}`;

  if (audioBufferCache.has(key)) {
    return audioBufferCache.get(key)!;
  }

  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)!;
  }

  const promise = (async () => {
    const ctx = getAudioContext();

    // 1. ElevenLabs TTS option
    if (settings.engine === 'elevenlabs' && settings.elevenLabsKey) {
      try {
        const voiceId = settings.elevenLabsVoiceId || '21m00Tcm4TlvDq8ikWAM'; // Rachel default
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': settings.elevenLabsKey,
          },
          body: JSON.stringify({
            text,
            model_id: settings.elevenLabsModel || 'eleven_turbo_v2_5',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        });
        if (res.ok) {
          const arrayBuffer = await res.arrayBuffer();
          const decoded = await ctx.decodeAudioData(arrayBuffer);
          audioBufferCache.set(key, decoded);
          return decoded;
        }
      } catch (e) {
        console.warn('ElevenLabs TTS failed, falling back to Gemini/WebSpeech:', e);
      }
    }

    // 2. Gemini TTS option (Default)
    if (settings.engine === 'gemini' || settings.engine === 'elevenlabs') {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voice: settings.geminiVoice,
          }),
        });
        const data = await res.json();
        if (data.audio) {
          const bytes = base64ToUint8Array(data.audio);
          let audioBuf: AudioBuffer;
          if (isWav(bytes)) {
            // Unary WAV file
            const copy = new Uint8Array(bytes.byteLength);
            copy.set(bytes);
            audioBuf = await ctx.decodeAudioData(copy.buffer);
          } else {
            // Raw PCM 24kHz
            audioBuf = decodeRawPCM(ctx, bytes, 24000);
          }
          audioBufferCache.set(key, audioBuf);
          return audioBuf;
        }
      } catch (e) {
        console.warn('Gemini TTS failed, falling back to WebSpeech:', e);
      }
    }

    // Fallback indicator: returns null so caller uses Web Speech API
    return null;
  })();

  inFlightRequests.set(key, promise);
  try {
    const result = await promise;
    return result;
  } finally {
    inFlightRequests.delete(key);
  }
}

// Play an AudioBuffer with duration promise
export function playAudioBuffer(buffer: AudioBuffer, volume = 1.0): Promise<void> {
  return new Promise((resolve) => {
    stopAllAudio();
    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.value = Math.max(0, Math.min(1, volume));

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    currentSourceNode = source;

    source.onended = () => {
      if (currentSourceNode === source) {
        currentSourceNode = null;
      }
      resolve();
    };

    source.start(0);
  });
}

// Speak via Web Speech API fallback
export function speakWebSpeech(text: string, settings: VoiceSettings): Promise<void> {
  return new Promise((resolve) => {
    stopAllAudio();
    if (!('speechSynthesis' in window)) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = settings.volume;
    utterance.rate = settings.speechRate || 0.95;
    utterance.pitch = 1.0;

    // Pick best English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')));
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    activeUtterance = utterance;

    utterance.onend = () => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
      }
      resolve();
    };

    utterance.onerror = (e) => {
      console.warn('WebSpeech error:', e);
      if (activeUtterance === utterance) {
        activeUtterance = null;
      }
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

// High-level speak function (checks cache / Gemini / ElevenLabs -> falls back to WebSpeech)
export async function speakSpeech(
  text: string,
  settings: VoiceSettings,
  cacheKey?: string
): Promise<void> {
  if (settings.engine === 'webspeech') {
    return speakWebSpeech(text, settings);
  }

  try {
    const buffer = await getSynthesizedAudio(text, settings, cacheKey);
    if (buffer) {
      return playAudioBuffer(buffer, settings.volume);
    }
  } catch (err) {
    console.warn('Audio playback error, falling back to Web Speech:', err);
  }

  // Fallback
  return speakWebSpeech(text, settings);
}

// Pleasant Web Audio Success Chime
export function playSuccessChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Two-note harmonic chime (C5 = 523.25, E5 = 659.25, G5 = 783.99)
      const notes = [
        { freq: 523.25, start: 0, dur: 0.28 },
        { freq: 659.25, start: 0.08, dur: 0.35 },
        { freq: 783.99, start: 0.16, dur: 0.45 },
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);

        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });

      setTimeout(resolve, 450);
    } catch {
      resolve();
    }
  });
}

// Format word into distinct spoken letter sequence (e.g. "B, I, C, Y, C, L, E")
export function formatLettersForTTS(word: string): string {
  return word
    .toUpperCase()
    .split('')
    .filter(c => /[A-Z0-9'-]/.test(c))
    .join(', ');
}
