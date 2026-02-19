export interface Game {
  id: string;
  name: string;
  emoji: string;
  color: string;
  difficulty: 1 | 2 | 3;
}

export const games: Game[] = [
  { id: 'snake', name: 'Snake', emoji: '🐍', color: 'bg-green-400', difficulty: 2 },
  { id: 'whack-a-mole', name: 'Whack-a-Mole', emoji: '🐭', color: 'bg-yellow-400', difficulty: 1 },
  { id: 'memory-match', name: 'Memory Match', emoji: '🃏', color: 'bg-blue-400', difficulty: 2 },
  { id: 'bubble-pop', name: 'Bubble Pop', emoji: '🫧', color: 'bg-cyan-400', difficulty: 1 },
  { id: 'catch-fruit', name: 'Catch the Fruit', emoji: '🍎', color: 'bg-red-400', difficulty: 1 },
  { id: 'tic-tac-toe', name: 'Tic-Tac-Toe', emoji: '❌', color: 'bg-purple-400', difficulty: 1 },
  { id: 'brick-breaker', name: 'Brick Breaker', emoji: '🧱', color: 'bg-orange-400', difficulty: 2 },
  { id: 'dino-jump', name: 'Dino Jump', emoji: '🦕', color: 'bg-lime-400', difficulty: 2 },
  { id: 'simon-says', name: 'Simon Says', emoji: '🔴', color: 'bg-pink-400', difficulty: 2 },
  { id: 'balloon-pop', name: 'Balloon Pop', emoji: '🎈', color: 'bg-rose-400', difficulty: 1 },
  { id: 'math-blast', name: 'Math Blast', emoji: '🔢', color: 'bg-indigo-400', difficulty: 2 },
  { id: 'color-match', name: 'Color Match', emoji: '🌈', color: 'bg-teal-400', difficulty: 2 },
  { id: 'flappy-bird', name: 'Flappy Bird', emoji: '🐦', color: 'bg-sky-400', difficulty: 2 },
  { id: 'rock-paper-scissors', name: 'Rock Paper Scissors', emoji: '✂️', color: 'bg-violet-400', difficulty: 1 },
  { id: 'word-scramble', name: 'Word Scramble', emoji: '🔤', color: 'bg-amber-400', difficulty: 2 },
  { id: 'dot-connector', name: 'Dot Connector', emoji: '🔵', color: 'bg-emerald-400', difficulty: 2 },
  { id: 'number-puzzle', name: '2048 Puzzle', emoji: '🔢', color: 'bg-yellow-500', difficulty: 3 },
  { id: 'maze-runner', name: 'Maze Runner', emoji: '🌀', color: 'bg-fuchsia-400', difficulty: 2 },
  { id: 'spin-wheel', name: 'Spin the Wheel', emoji: '🎡', color: 'bg-green-500', difficulty: 1 },
  { id: 'drawing', name: 'Drawing Canvas', emoji: '🎨', color: 'bg-pink-500', difficulty: 1 },
];

export function getGameById(id: string): Game | undefined {
  return games.find(game => game.id === id);
}
