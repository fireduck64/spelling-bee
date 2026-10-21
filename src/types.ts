export interface BenchmarkConfig {
  targetAccuracy: number; // e.g. 80 (%)
  requireAllAttempted: boolean; // default true
  requireAllMastered: boolean; // default true
}

export interface ListPayload {
  title: string;
  words: string[];
  benchmark: BenchmarkConfig;
}

export interface WordStats {
  word: string;
  attempts: number;
  correctCount: number;
  incorrectCount: number;
  lastResult: 'correct' | 'incorrect' | null;
  history: Array<{
    timestamp: number;
    input: string;
    isCorrect: boolean;
  }>;
}

export type VoiceEngine = 'gemini' | 'elevenlabs' | 'webspeech';

export interface VoiceSettings {
  engine: VoiceEngine;
  geminiVoice: 'Kore' | 'Puck' | 'Zephyr' | 'Charon' | 'Fenrir';
  elevenLabsKey: string;
  elevenLabsVoiceId: string;
  elevenLabsModel: string;
  volume: number; // 0.0 - 1.0
  speechRate: number; // 0.8 - 1.3
  soundFx: boolean;
}

export type DrillPhase = 'READY_TO_START' | 'WAITING_FOR_INPUT' | 'FEEDBACK';
