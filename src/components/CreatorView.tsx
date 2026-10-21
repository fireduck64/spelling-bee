import React, { useState, useMemo } from 'react';
import { ListPayload, BenchmarkConfig } from '../types';
import { encodeListPayload } from '../utils/urlPayload';
import {
  Sparkles,
  Link,
  Copy,
  Check,
  Play,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  BookOpen,
} from 'lucide-react';

interface CreatorViewProps {
  initialPayload?: ListPayload | null;
  onStartDrill: (payload: ListPayload) => void;
}

const PRESETS: Array<{ name: string; title: string; words: string[] }> = [
  {
    name: 'Silent Letter Traps',
    title: 'Silent Letter Traps',
    words: [
      'knight',
      'subtle',
      'doubt',
      'rhythm',
      'island',
      'autumn',
      'column',
      'gnome',
      'wrestle',
      'receipt',
      'knuckle',
      'whistle',
    ],
  },
  {
    name: 'Grade 5 Champions',
    title: 'Grade 5 Champions List',
    words: [
      'accommodate',
      'camouflage',
      'mischievous',
      'restaurant',
      'embarrass',
      'guarantee',
      'cemetery',
      'definitely',
      'neighbor',
      'foreign',
      'curiosity',
      'calendar',
    ],
  },
  {
    name: 'Double Trouble',
    title: 'Double Consonant Demons',
    words: [
      'occurrence',
      'recommend',
      'committee',
      'necessary',
      'parallel',
      'accessible',
      'aggressive',
      'millennium',
      'possession',
      'disappoint',
    ],
  },
  {
    name: 'Everyday Essentials',
    title: 'Tricky Everyday Spelling',
    words: [
      'separate',
      'February',
      'Wednesday',
      'tomorrow',
      'surprise',
      'believe',
      'receive',
      'bizarre',
      'jewelry',
      'license',
    ],
  },
];

export const CreatorView: React.FC<CreatorViewProps> = ({
  initialPayload,
  onStartDrill,
}) => {
  const [title, setTitle] = useState(initialPayload?.title || 'Week 5 Spelling Words');
  const [rawText, setRawText] = useState(() => {
    if (initialPayload?.words && initialPayload.words.length > 0) {
      return initialPayload.words.join('\n');
    }
    return PRESETS[0].words.join('\n');
  });

  const [benchmark, setBenchmark] = useState<BenchmarkConfig>(
    initialPayload?.benchmark || {
      targetAccuracy: 80,
      requireAllAttempted: true,
      requireAllMastered: true,
    }
  );

  const [copied, setCopied] = useState(false);

  // Sanitize words
  const parsedWords = useMemo(() => {
    const rawTokens = rawText.split(/[\n,]+/);
    const seen = new Set<string>();
    const cleaned: string[] = [];

    for (const token of rawTokens) {
      const clean = token.trim();
      // Remove punctuation except apostrophes or hyphens if needed
      const normalized = clean.toLowerCase();
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        cleaned.push(clean);
      }
    }
    return cleaned;
  }, [rawText]);

  const wordCount = parsedWords.length;
  const isTooFew = wordCount < 1;
  const isWarning = wordCount > 30;
  const isOptimal = wordCount >= 10 && wordCount <= 20;

  // Generate payload & URL
  const currentPayload: ListPayload = useMemo(
    () => ({
      title: title.trim() || 'Spelling Bee Practice',
      words: parsedWords,
      benchmark,
    }),
    [title, parsedWords, benchmark]
  );

  const shareableUrl = useMemo(() => {
    if (parsedWords.length === 0) return '';
    const encoded = encodeListPayload(currentPayload);
    const origin = window.location.origin + window.location.pathname;
    return `${origin}?list=${encoded}`;
  }, [currentPayload, parsedWords]);

  const handleCopyLink = async () => {
    if (!shareableUrl) return;
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      prompt('Copy this link:', shareableUrl);
    }
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setTitle(preset.title);
    setRawText(preset.words.join('\n'));
  };

  const handleRemoveWord = (wordToRemove: string) => {
    const remaining = parsedWords.filter(
      (w) => w.toLowerCase() !== wordToRemove.toLowerCase()
    );
    setRawText(remaining.join('\n'));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Self-Contained URL Generator</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Spelling List Builder
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
          Input 10–20 words, configure passing benchmarks, and generate a self-contained
          link for student drilling with zero database setup required.
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-semibold text-slate-400 mr-1">Curated Lists:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => handleApplyPreset(preset)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:border-purple-500/50 hover:bg-purple-950/20 transition"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Words Input & Title */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-purple-500/25 rounded-2xl p-6 shadow-xl space-y-5">
          {/* List Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-purple-400 mb-1.5">
              List Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 5 Spelling Words"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
            />
          </div>

          {/* Words Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Spelling Words (Newlines or Commas)
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                    isOptimal
                      ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      : isTooFew
                      ? 'bg-rose-950 text-rose-400 border-rose-800'
                      : isWarning
                      ? 'bg-amber-950 text-amber-400 border-amber-800'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {wordCount} words
                </span>
                {isOptimal && (
                  <span className="text-[11px] text-emerald-400 font-semibold hidden sm:inline">
                    Ideal size (10–20)
                  </span>
                )}
              </div>
            </div>

            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="knight&#10;subtle&#10;doubt&#10;rhythm&#10;island"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm font-mono text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition resize-y leading-relaxed"
            />

            {isTooFew && (
              <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Please add at least one word to practice.
              </p>
            )}
            {isWarning && (
              <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> More than 30 words may take longer to drill.
                10–20 words is recommended.
              </p>
            )}
          </div>

          {/* Words Preview Chips */}
          {parsedWords.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-2">
                Sanitized Word Pool ({parsedWords.length}):
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                {parsedWords.map((w, idx) => (
                  <span
                    key={w + idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 group"
                  >
                    <span>{w}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveWord(w)}
                      className="text-slate-500 hover:text-rose-400 transition"
                      title="Remove word"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Benchmark Goals & Share Link */}
        <div className="lg:col-span-5 space-y-6">
          {/* Benchmark Goal Settings */}
          <div className="bg-slate-900/90 border border-purple-500/25 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Benchmark Mastery Rules
              </h3>
            </div>

            {/* Target Accuracy */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-300">
                  Target Accuracy Percentage
                </span>
                <span className="text-sm font-mono font-bold text-emerald-400">
                  {benchmark.targetAccuracy}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={benchmark.targetAccuracy}
                onChange={(e) =>
                  setBenchmark({
                    ...benchmark,
                    targetAccuracy: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>50%</span>
                <span>80% (Default)</span>
                <span>100%</span>
              </div>
            </div>

            {/* Rule 1: Require All Words Attempted */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="pr-2">
                <div className="text-xs font-semibold text-slate-200">
                  Attempt Every Word
                </div>
                <div className="text-[11px] text-slate-400">
                  Student must attempt all words in the list at least once
                </div>
              </div>
              <input
                type="checkbox"
                checked={benchmark.requireAllAttempted}
                onChange={(e) =>
                  setBenchmark({
                    ...benchmark,
                    requireAllAttempted: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-purple-600 rounded bg-slate-800 border-slate-700 cursor-pointer"
              />
            </div>

            {/* Rule 2: Require Every Word Mastered */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="pr-2">
                <div className="text-xs font-semibold text-slate-200">
                  Master Every Word
                </div>
                <div className="text-[11px] text-slate-400">
                  Every word must be spelled correctly at least once
                </div>
              </div>
              <input
                type="checkbox"
                checked={benchmark.requireAllMastered}
                onChange={(e) =>
                  setBenchmark({
                    ...benchmark,
                    requireAllMastered: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-purple-600 rounded bg-slate-800 border-slate-700 cursor-pointer"
              />
            </div>
          </div>

          {/* Share & Launch Card */}
          <div className="bg-slate-900/90 border border-purple-500/25 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Shareable Student Link
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                Gzip Compressed (~50% shorter)
              </span>
            </div>

            <p className="text-xs text-slate-400">
              This self-contained URL packs the full word list and passing benchmark rules.
              Open it on any Chromebook, tablet, or laptop.
            </p>

            <div className="relative">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-purple-300 pr-24 truncate select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                disabled={!shareableUrl}
                className="absolute right-1 top-1 bottom-1 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Launch Drill Button */}
            <button
              type="button"
              disabled={parsedWords.length === 0}
              onClick={() => onStartDrill(currentPayload)}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>Start Drill Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
