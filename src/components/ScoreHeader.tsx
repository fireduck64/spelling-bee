import React from 'react';
import { BenchmarkConfig, WordStats } from '../types';
import { Trophy, CheckCircle, Target, Award, ListChecks } from 'lucide-react';

interface ScoreHeaderProps {
  totalWords: number;
  statsMap: Map<string, WordStats>;
  benchmark: BenchmarkConfig;
  onOpenBreakdown: () => void;
}

export const ScoreHeader: React.FC<ScoreHeaderProps> = ({
  totalWords,
  statsMap,
  benchmark,
  onOpenBreakdown,
}) => {
  // Aggregate stats
  let totalAttempts = 0;
  let totalCorrect = 0;
  let attemptedUnique = 0;
  let masteredUnique = 0;

  statsMap.forEach((s) => {
    totalAttempts += s.attempts;
    totalCorrect += s.correctCount;
    if (s.attempts > 0) attemptedUnique += 1;
    if (s.correctCount > 0) masteredUnique += 1;
  });

  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  const isAccuracyMet = accuracy >= benchmark.targetAccuracy;
  const isAttemptedMet = !benchmark.requireAllAttempted || attemptedUnique >= totalWords;
  const isMasteredMet = !benchmark.requireAllMastered || masteredUnique >= totalWords;

  const isBenchmarkAchieved =
    totalAttempts > 0 && isAccuracyMet && isAttemptedMet && isMasteredMet;

  return (
    <div className="w-full space-y-2">
      {/* Benchmark Achieved Banner (High visibility celebratory callout) */}
      {isBenchmarkAchieved && (
        <div className="w-full bg-gradient-to-r from-emerald-600 via-purple-600 to-indigo-600 p-0.5 rounded-2xl shadow-xl shadow-emerald-950/40 animate-in zoom-in-95 duration-300">
          <div className="bg-slate-950/90 rounded-[14px] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                <Trophy className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm sm:text-base font-black text-white tracking-wide uppercase">
                    Goal Reached! Benchmark Complete
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950">
                    VERIFIED
                  </span>
                </div>
                <p className="text-xs text-emerald-200">
                  Congratulations! All benchmark mastery requirements have been satisfied.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-300">
                  Accuracy: <span className="text-emerald-400 font-mono font-bold">{accuracy}%</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {masteredUnique}/{totalWords} Words Mastered
                </div>
              </div>
              <button
                onClick={onOpenBreakdown}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-slate-950 transition"
              >
                Inspect Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Scoreboard Bar */}
      <div className="w-full bg-slate-900/90 backdrop-blur border border-purple-500/20 rounded-2xl p-3 sm:p-4 shadow-lg shadow-black/40">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
          {/* 1. Accuracy */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div
              className={`p-2 rounded-lg border shrink-0 ${
                isAccuracyMet && totalAttempts > 0
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              }`}
            >
              <Target className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`text-lg sm:text-xl font-mono font-extrabold ${
                    isAccuracyMet && totalAttempts > 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {totalAttempts > 0 ? `${accuracy}%` : '—'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  ({totalCorrect}/{totalAttempts})
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
                Goal: <span className="font-semibold text-slate-300">≥{benchmark.targetAccuracy}%</span>
              </div>
            </div>
          </div>

          {/* 2. Completed / Attempted Words */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div
              className={`p-2 rounded-lg border shrink-0 ${
                attemptedUnique >= totalWords
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-purple-500/15 border-purple-500/30 text-purple-400'
              }`}
            >
              <ListChecks className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-mono font-extrabold text-white">
                  {attemptedUnique} <span className="text-sm font-normal text-slate-500">/ {totalWords}</span>
                </span>
                {attemptedUnique >= totalWords && (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                Words Attempted
              </div>
            </div>
          </div>

          {/* 3. Mastered Words */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div
              className={`p-2 rounded-lg border shrink-0 ${
                masteredUnique >= totalWords
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
              }`}
            >
              <Award className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-mono font-extrabold text-white">
                  {masteredUnique} <span className="text-sm font-normal text-slate-500">/ {totalWords}</span>
                </span>
                {masteredUnique >= totalWords && (
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                Words Mastered
              </div>
            </div>
          </div>

          {/* 4. Action / Breakdown link */}
          <div className="flex sm:justify-end items-center col-span-2 sm:col-span-1">
            <button
              onClick={onOpenBreakdown}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600/20 text-purple-300 border border-purple-500/40 hover:bg-purple-600 hover:text-white transition flex items-center justify-center gap-2"
            >
              <span>Word Breakdown</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
