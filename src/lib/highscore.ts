const HIGHSCORE_PREFIX = 'funzone_highscore_';

export function getHighScore(gameId: string): number {
  if (typeof window === 'undefined') return 0;
  const score = localStorage.getItem(`${HIGHSCORE_PREFIX}${gameId}`);
  return score ? parseInt(score, 10) : 0;
}

export function setHighScore(gameId: string, score: number): boolean {
  if (typeof window === 'undefined') return false;
  const current = getHighScore(gameId);
  if (score > current) {
    localStorage.setItem(`${HIGHSCORE_PREFIX}${gameId}`, score.toString());
    return true; // New high score!
  }
  return false;
}

export function getAllHighScores(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  const scores: Record<string, number> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(HIGHSCORE_PREFIX)) {
      const gameId = key.replace(HIGHSCORE_PREFIX, '');
      scores[gameId] = parseInt(localStorage.getItem(key) || '0', 10);
    }
  }
  return scores;
}

export function resetHighScore(gameId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${HIGHSCORE_PREFIX}${gameId}`);
}
