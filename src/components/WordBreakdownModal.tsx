import React from 'react';
import { WordStats, VoiceSettings } from '../types';
import { X, CheckCircle2, AlertCircle, Clock, Volume2, RotateCcw } from 'lucide-react';
import { speakSpeech } from '../utils/audio';
import { getEffectiveSentence } from '../utils/sentenceCache';

interface WordBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  words: string[];
  statsMap: Map<string, WordStats>;
  sentences: Record<string, string>;
  voiceSettings: VoiceSettings;
  onResetStats: () => void;
}

export const WordBreakdownModal: React.FC<WordBreakdownModalProps> = ({
  isOpen,
  onClose,
  words,
  statsMap,
  sentences,
  voiceSettings,
  onResetStats,
}) => {
  if (!isOpen) return null;

  const handleSpeakWord = (word: string) => {
    const sentence = getEffectiveSentence(word, sentences);
    const promptText = `${word}. ${sentence} ${word}.`;
    speakSpeech(promptText, voiceSettings, `prompt:${word}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-purple-950/40 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div>
            <h3 className="text-lg font-bold text-white">Word Mastery Breakdown</h3>
            <p className="text-xs text-slate-400">Detailed per-word accuracy and practice history</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto space-y-3">
          {words.map((word) => {
            const stat = statsMap.get(word);
            const attempts = stat?.attempts || 0;
            const correct = stat?.correctCount || 0;
            const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
            const isMastered = correct >= 1;
            const sentence = getEffectiveSentence(word, sentences);

            return (
              <div
                key={word}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80 hover:border-slate-700 transition gap-3"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleSpeakWord(word)}
                    title="Hear word & silly sentence"
                    className="p-2 rounded-lg bg-purple-900/30 text-purple-400 border border-purple-800/50 hover:bg-purple-600 hover:text-white transition shrink-0 mt-0.5"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-white tracking-wide">{word}</span>
                      {isMastered ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                          <CheckCircle2 className="w-3 h-3" /> Mastered
                        </span>
                      ) : attempts > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/50">
                          <AlertCircle className="w-3 h-3" /> Practicing
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/50">
                          <Clock className="w-3 h-3" /> Unseen
                        </span>
                      )}
                    </div>
                    {sentence && (
                      <p className="text-xs text-slate-400 italic mt-1 line-clamp-2">
                        "{sentence}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Accuracy & Counts */}
                <div className="flex items-center gap-4 shrink-0 sm:border-l sm:border-slate-800/80 sm:pl-4 self-end sm:self-center">
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-slate-200">
                      {attempts > 0 ? `${accuracy}%` : '—'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {correct}/{attempts} correct
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            onClick={() => {
              if (window.confirm('Reset all scores and practice history for this session?')) {
                onResetStats();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/40 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Session Stats
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-500 shadow-md shadow-purple-600/30 transition"
          >
            Back to Drill
          </button>
        </div>
      </div>
    </div>
  );
};
