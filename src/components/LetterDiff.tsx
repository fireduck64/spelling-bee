import React from 'react';

interface LetterDiffProps {
  typed: string;
  target: string;
}

export const LetterDiff: React.FC<LetterDiffProps> = ({ typed, target }) => {
  const typedChars = typed.toLowerCase().split('');
  const targetChars = target.toLowerCase().split('');

  // Compute character by character matching
  // For each typed character, is it matching the target at this position?
  return (
    <div className="flex flex-col gap-3 py-2">
      {/* Student Attempt */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider mr-2 min-w-[70px]">
          You typed:
        </span>
        <div className="flex flex-wrap gap-1 font-mono text-lg font-bold">
          {typedChars.map((char, index) => {
            const isMatch = targetChars[index] === char;
            return (
              <span
                key={index}
                className={`inline-flex items-center justify-center w-7 h-8 rounded border text-center ${
                  isMatch
                    ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                    : 'bg-rose-950/80 border-rose-500/80 text-rose-200 line-through'
                }`}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>

      {/* Target Word Spelled Out */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mr-2 min-w-[70px]">
          Correct:
        </span>
        <div className="flex flex-wrap gap-1.5 font-mono text-xl font-black tracking-widest text-emerald-300">
          {targetChars.map((char, index) => {
            const isMatched = typedChars[index] === char;
            return (
              <span
                key={index}
                className={`inline-flex items-center justify-center w-8 h-9 rounded-lg border-2 text-center shadow-sm ${
                  isMatched
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                    : 'bg-emerald-500/20 border-emerald-400 text-white font-extrabold ring-2 ring-emerald-400/40 animate-pulse'
                }`}
              >
                {char.toUpperCase()}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
