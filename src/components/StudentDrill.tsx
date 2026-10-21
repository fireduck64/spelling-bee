import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ListPayload, WordStats, VoiceSettings, DrillPhase } from '../types';
import { ScoreHeader } from './ScoreHeader';
import { LetterDiff } from './LetterDiff';
import { WordBreakdownModal } from './WordBreakdownModal';
import { selectNextWord } from '../utils/adaptiveQueue';
import { fetchSillySentencesForWords, getEffectiveSentence } from '../utils/sentenceCache';
import {
  speakSpeech,
  playSuccessChime,
  formatLettersForTTS,
  stopAllAudio,
  getSynthesizedAudio,
  getAudioContext,
} from '../utils/audio';
import {
  Volume2,
  VolumeX,
  Play,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

interface StudentDrillProps {
  payload: ListPayload;
  voiceSettings: VoiceSettings;
  onOpenSettings: () => void;
  onBackToCreator: () => void;
}

export const StudentDrill: React.FC<StudentDrillProps> = ({
  payload,
  voiceSettings,
  onOpenSettings,
  onBackToCreator,
}) => {
  const { title, words, benchmark } = payload;

  const [phase, setPhase] = useState<DrillPhase>('READY_TO_START');
  const [currentWord, setCurrentWord] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [lastAttempt, setLastAttempt] = useState<{ typed: string; target: string; isCorrect: boolean } | null>(null);

  // Per-word stats
  const [statsMap, setStatsMap] = useState<Map<string, WordStats>>(() => {
    const map = new Map<string, WordStats>();
    words.forEach((w) => {
      map.set(w, {
        word: w,
        attempts: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastResult: null,
        history: [],
      });
    });
    return map;
  });

  const [recentHistory, setRecentHistory] = useState<string[]>([]);
  const [sentences, setSentences] = useState<Record<string, string>>({});
  const [isLoadingSentences, setIsLoadingSentences] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const turnTimeoutRef = useRef<any>(null);
  const audioPlayTokenRef = useRef(0);

  // Initialize sentences on mount
  useEffect(() => {
    setIsLoadingSentences(true);
    fetchSillySentencesForWords(words)
      .then((res) => {
        setSentences(res);
      })
      .finally(() => {
        setIsLoadingSentences(false);
      });
  }, [words]);

  // Keep focus locked during WAITING_FOR_INPUT
  useEffect(() => {
    if (phase === 'WAITING_FOR_INPUT') {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);

      const handleGlobalClickOrKey = (e: MouseEvent | KeyboardEvent) => {
        // If clicking inside another interactive element (like modal or button), let it be
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'SELECT')) {
          return;
        }
        if (phase === 'WAITING_FOR_INPUT') {
          inputRef.current?.focus();
        }
      };

      window.addEventListener('click', handleGlobalClickOrKey);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('click', handleGlobalClickOrKey);
      };
    }
  }, [phase]);

  // Background audio prefetch for next likely candidates
  const prefetchAudioForWord = useCallback(
    (word: string) => {
      if (!word) return;
      const sentence = getEffectiveSentence(word, sentences);
      const promptText = `${word}. ${sentence} ${word}.`;
      const spelledLetters = formatLettersForTTS(word);
      const correctionText = `Incorrect. ${word} is spelled: ${spelledLetters}. ${word}.`;

      getSynthesizedAudio(promptText, voiceSettings, `prompt:${word}`).catch(() => {});
      getSynthesizedAudio(correctionText, voiceSettings, `correction:${word}`).catch(() => {});
    },
    [sentences, voiceSettings]
  );

  // Play Prompt Audio for current word
  const playPromptAudio = useCallback(
    async (word: string) => {
      if (!word) return;
      const currentToken = ++audioPlayTokenRef.current;
      setIsPlayingAudio(true);
      try {
        const sentence = getEffectiveSentence(word, sentences);
        const promptText = `${word}. ${sentence} ${word}.`;
        await speakSpeech(promptText, voiceSettings, `prompt:${word}`);
      } catch (err) {
        console.warn('Error playing prompt audio:', err);
      } finally {
        if (audioPlayTokenRef.current === currentToken) {
          setIsPlayingAudio(false);
        }
      }
    },
    [sentences, voiceSettings]
  );

  // Advance to next word
  const advanceToNextWord = useCallback(
    (prevWord: string) => {
      clearTimeout(turnTimeoutRef.current);
      stopAllAudio();

      const next = selectNextWord(words, statsMap, prevWord, recentHistory);
      setCurrentWord(next);
      setUserInput('');
      setLastAttempt(null);
      setPhase('WAITING_FOR_INPUT');

      // Update recent history
      setRecentHistory((prev) => {
        const updated = [...prev, next];
        return updated.slice(-6);
      });

      // Speak prompt for new word
      setTimeout(() => {
        playPromptAudio(next);
      }, 100);

      // Prefetch upcoming candidate
      const candidate = selectNextWord(words, statsMap, next, [...recentHistory, next]);
      if (candidate) {
        prefetchAudioForWord(candidate);
      }
    },
    [words, statsMap, recentHistory, playPromptAudio, prefetchAudioForWord]
  );

  // Start Session (User Gesture unlocks audio)
  const handleStartSession = useCallback(() => {
    getAudioContext(); // unlocks audio context
    const initialWord = selectNextWord(words, statsMap, null, []);
    setCurrentWord(initialWord);
    setUserInput('');
    setLastAttempt(null);
    setPhase('WAITING_FOR_INPUT');
    setRecentHistory([initialWord]);

    setTimeout(() => {
      playPromptAudio(initialWord);
    }, 150);

    // Prefetch next candidate
    const nextCandidate = selectNextWord(words, statsMap, initialWord, [initialWord]);
    if (nextCandidate) {
      prefetchAudioForWord(nextCandidate);
    }
  }, [words, statsMap, playPromptAudio, prefetchAudioForWord]);

  // Handle global keyboard shortcuts (SPACE / ENTER on Start screen)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === 'READY_TO_START') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartSession();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, handleStartSession]);

  // Submit Answer
  const handleSubmitAnswer = useCallback(async () => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput || phase !== 'WAITING_FOR_INPUT') return;

    setPhase('FEEDBACK');
    stopAllAudio();

    const isMatch = trimmedInput.toLowerCase() === currentWord.toLowerCase();

    // Record stats
    setStatsMap((prevMap) => {
      const nextMap = new Map(prevMap);
      const curr = nextMap.get(currentWord) || {
        word: currentWord,
        attempts: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastResult: null,
        history: [],
      };

      const updated: WordStats = {
        ...curr,
        attempts: curr.attempts + 1,
        correctCount: isMatch ? curr.correctCount + 1 : curr.correctCount,
        incorrectCount: isMatch ? curr.incorrectCount : curr.incorrectCount + 1,
        lastResult: isMatch ? 'correct' : 'incorrect',
        history: [
          ...curr.history,
          {
            timestamp: Date.now(),
            input: trimmedInput,
            isCorrect: isMatch,
          },
        ],
      };

      nextMap.set(currentWord, updated);
      return nextMap;
    });

    setLastAttempt({
      typed: trimmedInput,
      target: currentWord,
      isCorrect: isMatch,
    });

    if (isMatch) {
      // Correct!
      if (voiceSettings.soundFx) {
        await playSuccessChime();
      }
      // Brief pause then auto advance
      turnTimeoutRef.current = setTimeout(() => {
        advanceToNextWord(currentWord);
      }, 1200);
    } else {
      // Incorrect!
      // Speak letter-by-letter correction aloud:
      // "Incorrect. [Word] is spelled: [L, E, T, T, E, R, S]. [Word]."
      const spelledLetters = formatLettersForTTS(currentWord);
      const correctionSentence = `Incorrect. ${currentWord} is spelled: ${spelledLetters}. ${currentWord}.`;

      setIsPlayingAudio(true);
      try {
        await speakSpeech(correctionSentence, voiceSettings, `correction:${currentWord}`);
      } catch (err) {
        console.warn('Error playing correction audio:', err);
      } finally {
        setIsPlayingAudio(false);
        // Once correction ends, brief 0.6s pause then advance
        turnTimeoutRef.current = setTimeout(() => {
          advanceToNextWord(currentWord);
        }, 600);
      }
    }
  }, [userInput, phase, currentWord, voiceSettings, advanceToNextWord]);

  // Handle input field keydowns
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ') {
      // SPACE: Replay prompt audio
      e.preventDefault();
      playPromptAudio(currentWord);
      return;
    }

    if (e.key === 'Enter') {
      // ENTER: Submit
      e.preventDefault();
      handleSubmitAnswer();
      return;
    }
  };

  // Reset Session
  const handleResetStats = () => {
    const map = new Map<string, WordStats>();
    words.forEach((w) => {
      map.set(w, {
        word: w,
        attempts: 0,
        correctCount: 0,
        incorrectCount: 0,
        lastResult: null,
        history: [],
      });
    });
    setStatsMap(map);
    setRecentHistory([]);
    setIsBreakdownOpen(false);
    advanceToNextWord('');
  };

  const currentSentence = getEffectiveSentence(currentWord, sentences);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center">
      {/* 1. Top Scoreboard & Benchmark Tracking (Persistent across drill) */}
      <div className="w-full mb-6">
        <ScoreHeader
          totalWords={words.length}
          statsMap={statsMap}
          benchmark={benchmark}
          onOpenBreakdown={() => setIsBreakdownOpen(true)}
        />
      </div>

      {/* 2. Mode: READY TO START Screen */}
      {phase === 'READY_TO_START' && (
        <div className="w-full bg-slate-900/90 border border-purple-500/30 rounded-3xl p-8 sm:p-12 text-center shadow-2xl shadow-purple-950/50 flex flex-col items-center">
          <div className="inline-flex p-4 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 mb-6 shadow-inner animate-pulse">
            <Sparkles className="w-10 h-10 text-purple-400" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            Ready to Spell?
          </h2>
          <p className="text-purple-300 font-semibold text-lg mb-6">
            {title || 'Spelling Bee Challenge'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg mb-6 text-left">
            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold uppercase">Word Pool</span>
              <div className="text-xl font-mono font-bold text-white mt-0.5">{words.length} Words</div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold uppercase">Goal Accuracy</span>
              <div className="text-xl font-mono font-bold text-emerald-400 mt-0.5">≥{benchmark.targetAccuracy}%</div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold uppercase">Mastery Rule</span>
              <div className="text-xs font-semibold text-purple-300 mt-1">Every word correct ≥1x</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-purple-300/80 mb-6">
            {isLoadingSentences ? (
              <span className="flex items-center gap-1.5 animate-pulse text-purple-300">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                Gemini AI is chronicling sentences from The Margin of the Map...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sentences from The Margin of the Map ready!
              </span>
            )}
          </div>

          {/* Prominent CTA */}
          <button
            type="button"
            onClick={handleStartSession}
            className="w-full max-w-md py-4 px-8 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-lg sm:text-xl shadow-xl shadow-purple-600/40 transform hover:-translate-y-0.5 active:translate-y-0 transition flex items-center justify-center gap-3 cursor-pointer group"
          >
            <span>Press ENTER or SPACE to Begin</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition" />
          </button>

          <p className="text-xs text-slate-400 mt-4 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
            100% keyboard-driven: type your answers and press Space anytime to replay.
          </p>
        </div>
      )}

      {/* 3. Mode: ACTIVE DRILL (WAITING_FOR_INPUT or FEEDBACK) */}
      {phase !== 'READY_TO_START' && (
        <div className="w-full bg-slate-900/90 border border-purple-500/25 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-purple-950/40 relative flex flex-col items-center">
          {/* Audio Announcer Indicator */}
          <div className="flex items-center gap-3 mb-6">
            <button
              type="button"
              onClick={() => playPromptAudio(currentWord)}
              className={`p-3.5 rounded-2xl border transition flex items-center gap-3 font-semibold text-sm shadow-md ${
                isPlayingAudio
                  ? 'bg-purple-600 text-white border-purple-400 shadow-purple-600/50 ring-4 ring-purple-600/30 animate-pulse'
                  : 'bg-slate-800/80 text-purple-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Volume2 className={`w-5 h-5 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
              <span>{isPlayingAudio ? 'Speaking Prompt...' : 'Replay Audio'}</span>
              <kbd className="px-2 py-0.5 rounded-md bg-black/40 text-[11px] font-mono border border-white/20 text-purple-200">
                SPACE
              </kbd>
            </button>
          </div>

          {/* SPOILER-FREE PROMPT PHASE */}
          {phase === 'WAITING_FOR_INPUT' && (
            <div className="w-full flex flex-col items-center mb-6">
              <div className="h-14 flex items-center justify-center">
                <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping mr-1"></span>
                  Listen closely and spell the spoken word
                </div>
              </div>

              {/* Central Typing Input */}
              <div className="w-full max-w-lg relative mt-2">
                <input
                  ref={inputRef}
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Type your spelling here..."
                  className="w-full bg-slate-950 border-2 border-purple-500/50 rounded-2xl px-6 py-4 text-center text-2xl sm:text-3xl font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:border-purple-400 focus:ring-4 focus:ring-purple-500/30 shadow-inner transition tracking-wider"
                />

                {/* Submit button indicator */}
                <div className="flex items-center justify-between text-xs text-slate-400 mt-3 px-2">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300 border border-slate-700">
                      ENTER
                    </kbd>{' '}
                    to submit
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300 border border-slate-700">
                      SPACE
                    </kbd>{' '}
                    to hear again
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* FEEDBACK PHASE */}
          {phase === 'FEEDBACK' && lastAttempt && (
            <div className="w-full max-w-xl animate-in zoom-in-95 duration-200">
              {lastAttempt.isCorrect ? (
                /* Correct View */
                <div className="bg-emerald-950/40 border-2 border-emerald-500/60 rounded-2xl p-6 sm:p-8 text-center shadow-xl shadow-emerald-950/60">
                  <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mb-3">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-emerald-300 tracking-wide uppercase mb-1">
                    Correct!
                  </h3>
                  <div className="text-3xl sm:text-4xl font-mono font-extrabold text-white tracking-widest my-3 py-1">
                    {lastAttempt.target}
                  </div>

                  {/* Silly context sentence with highlight */}
                  {currentSentence && (
                    <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-emerald-900/40 text-xs sm:text-sm text-slate-300 italic">
                      "{currentSentence}"
                    </div>
                  )}

                  <div className="text-xs text-emerald-400/80 font-medium mt-4">
                    Advancing to next word...
                  </div>
                </div>
              ) : (
                /* Incorrect View */
                <div className="bg-rose-950/40 border-2 border-rose-500/60 rounded-2xl p-6 sm:p-8 shadow-xl shadow-rose-950/60">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      <XCircle className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-rose-300 uppercase tracking-wide">
                        Incorrect
                      </h3>
                      <p className="text-xs text-rose-200/80">
                        Listen to the spoken letter-by-letter correction.
                      </p>
                    </div>
                  </div>

                  {/* Letter Diff Visualizer */}
                  <div className="bg-slate-950/80 rounded-xl p-4 border border-rose-900/50 my-3">
                    <LetterDiff typed={lastAttempt.typed} target={lastAttempt.target} />
                  </div>

                  {/* Silly sentence */}
                  {currentSentence && (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 italic">
                      "{currentSentence}"
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
                    <span className="text-purple-300 flex items-center gap-1.5 font-semibold">
                      <Volume2 className="w-4 h-4 animate-pulse" /> Speaking correction...
                    </span>
                    <button
                      type="button"
                      onClick={() => advanceToNextWord(currentWord)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                    >
                      Skip & Next &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Action Tray */}
          <div className="flex items-center justify-between w-full mt-8 pt-6 border-t border-slate-800/80 text-xs text-slate-400">
            <button
              type="button"
              onClick={onBackToCreator}
              className="hover:text-white transition flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span>Edit Word List</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="hover:text-purple-300 transition flex items-center gap-1.5 text-slate-300"
            >
              <span>Voice: <strong className="text-purple-400">{voiceSettings.engine === 'gemini' ? voiceSettings.geminiVoice : voiceSettings.engine}</strong></span>
            </button>
          </div>
        </div>
      )}

      {/* Word Breakdown Modal */}
      <WordBreakdownModal
        isOpen={isBreakdownOpen}
        onClose={() => setIsBreakdownOpen(false)}
        words={words}
        statsMap={statsMap}
        sentences={sentences}
        voiceSettings={voiceSettings}
        onResetStats={handleResetStats}
      />
    </div>
  );
};
