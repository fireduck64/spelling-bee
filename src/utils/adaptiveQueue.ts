import { WordStats } from '../types';

export function selectNextWord(
  words: string[],
  statsMap: Map<string, WordStats>,
  lastWord: string | null,
  recentHistory: string[] = [] // last few words presented
): string {
  if (words.length === 0) return '';
  if (words.length === 1) return words[0];

  // Candidates excluding the immediate last word
  const eligible = words.filter(w => w !== lastWord);
  const pool = eligible.length > 0 ? eligible : words;

  // 1. Priority 1: Unseen words (attempts === 0)
  const unseen = pool.filter(w => {
    const s = statsMap.get(w);
    return !s || s.attempts === 0;
  });

  if (unseen.length > 0) {
    const randomIndex = Math.floor(Math.random() * unseen.length);
    return unseen[randomIndex];
  }

  // 2. Priority 2: Unmastered words (attempts > 0 && correctCount === 0)
  const unmastered = pool.filter(w => {
    const s = statsMap.get(w);
    return s && s.attempts > 0 && s.correctCount === 0;
  });

  if (unmastered.length > 0) {
    // Sort or weight by least recently seen
    const sorted = [...unmastered].sort((a, b) => {
      const idxA = recentHistory.lastIndexOf(a);
      const idxB = recentHistory.lastIndexOf(b);
      return idxA - idxB; // words seen longest ago or not in recent history come first
    });
    // Pick from the top unmastered candidates
    const topCandidates = sorted.slice(0, Math.min(3, sorted.length));
    return topCandidates[Math.floor(Math.random() * topCandidates.length)];
  }

  // 3. Priority 3: Weakest / Least Recently Seen words
  // Calculate a score where lower accuracy and older last-seen get higher priority
  const scored = pool.map(word => {
    const s = statsMap.get(word);
    const attempts = s ? s.attempts : 0;
    const correct = s ? s.correctCount : 0;
    const accuracy = attempts > 0 ? correct / attempts : 0;

    // Recency penalty: if in recent history, penalize based on how recent it is
    const historyIndex = recentHistory.lastIndexOf(word);
    const recencyDistance = historyIndex === -1 ? 99 : recentHistory.length - 1 - historyIndex;

    // Weight score: lower accuracy increases score, higher recencyDistance increases score
    // Priority score = (1.5 - accuracy) * 10 + Math.min(recencyDistance, 5) * 2 + Math.random() * 1.5;
    const score = (1.2 - accuracy) * 10 + Math.min(recencyDistance, 6) * 3 + Math.random() * 2;
    return { word, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].word;
}
