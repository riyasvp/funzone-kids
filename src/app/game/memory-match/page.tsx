'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import WinScreen from '@/components/WinScreen';
import { playSound, playWinFanfare } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const THEMES = [
  {
    name: 'Animals',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'],
    bgGradient: 'from-green-400 to-emerald-600',
    cardBg: 'from-green-500 to-teal-600',
  },
  {
    name: 'Nature',
    emojis: ['🎋', '🌸', '🌺', '🌻', '🌹', '🌷', '🍀', '🍁', '🍂', '🌾', '🌵', '🌴', '🎄', '🌲', '🍃', '🪴'],
    bgGradient: 'from-teal-400 to-cyan-600',
    cardBg: 'from-teal-500 to-cyan-600',
  },
  {
    name: 'Space',
    emojis: ['🚀', '🛸', '🌍', '🌙', '⭐', '☄️', '🪐', '👽', '🛰️', '🌌', '🔭', '🌠', '🌑', '🌕', '🌗', '🌖'],
    bgGradient: 'from-indigo-400 to-purple-600',
    cardBg: 'from-indigo-500 to-purple-600',
  },
  {
    name: 'Food',
    emojis: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧁', '🍩', '🍪', '🎂', '🍰', '🍫', '🍬', '🍭', '🍮', '🍯', '🍓'],
    bgGradient: 'from-orange-400 to-red-500',
    cardBg: 'from-orange-500 to-red-600',
  },
  {
    name: 'Ocean',
    emojis: ['🐙', '🐬', '🐳', '🦈', '🦀', '🦞', '🦐', '🐠', '🐟', '🐡', '🦑', '🐚', '🌊', '🐢', '🐊', '🐅'],
    bgGradient: 'from-blue-400 to-indigo-600',
    cardBg: 'from-blue-500 to-indigo-600',
  },
  {
    name: 'Dinosaurs',
    emojis: ['🦖', '🦕', '🦎', '🐉', '🦕', '🦖', '🦎', '🐉', '🦕', '🦖', '🦎', '🐉', '🦕', '🦖', '🦎', '🐉'],
    bgGradient: 'from-amber-400 to-orange-600',
    cardBg: 'from-amber-500 to-orange-600',
  },
];

type Card = {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
};

const DIFFICULTIES = [
  { name: 'Easy', cols: 4, rows: 4, pairs: 8 },
  { name: 'Medium', cols: 6, rows: 4, pairs: 12 },
  { name: 'Hard', cols: 6, rows: 6, pairs: 18 },
];

export default function MemoryMatch() {
  const [difficulty, setDifficulty] = useState(0);
  const [themeIndex, setThemeIndex] = useState(0);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [bestMoves, setBestMoves] = useState<{ [key: number]: number }>({});
  const [hintsLeft, setHintsLeft] = useState(3);
  const [hintedCards, setHintedCards] = useState<number[]>([]);
  const [matchAnimation, setMatchAnimation] = useState<number[]>([]);

  const theme = THEMES[themeIndex];
  const diff = DIFFICULTIES[difficulty];

  useEffect(() => {
    const saved = localStorage.getItem('memory-match-best');
    if (saved) setBestMoves(JSON.parse(saved));
  }, []);

  const initGame = (diffIndex: number) => {
    const diff = DIFFICULTIES[diffIndex];
    const selectedEmojis = theme.emojis.slice(0, diff.pairs);
    const cardEmojis = [...selectedEmojis, ...selectedEmojis];

    // Shuffle with Fisher-Yates
    for (let i = cardEmojis.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardEmojis[i], cardEmojis[j]] = [cardEmojis[j], cardEmojis[i]];
    }

    setCards(
      cardEmojis.map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }))
    );
    setFlippedCards([]);
    setMoves(0);
    setTimer(0);
    setDifficulty(diffIndex);
    setIsPlaying(true);
    setGameWon(false);
    setHintsLeft(3);
    setHintedCards([]);
    setMatchAnimation([]);
  };

  // Timer
  useEffect(() => {
    if (!isPlaying || gameWon) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isPlaying, gameWon]);

  const handleCardClick = (id: number) => {
    if (!isPlaying || gameWon) return;
    if (flippedCards.length === 2) return;

    const card = cards.find(c => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    playSound('click');
    const newCards = cards.map(c =>
      c.id === id ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      const firstCard = newCards.find(c => c.id === first)!;
      const secondCard = newCards.find(c => c.id === second)!;

      if (firstCard.emoji === secondCard.emoji) {
        playSound('win');
        setMatchAnimation([first, second]);
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === first || c.id === second ? { ...c, isMatched: true } : c
            )
          );
          setFlippedCards([]);
          setMatchAnimation([]);
        }, 500);
      } else {
        playSound('wrong');
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === first || c.id === second ? { ...c, isFlipped: false } : c
            )
          );
          setFlippedCards([]);
        }, 800);
      }
    }
  };

  // Check win
  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.isMatched) && isPlaying) {
      playWinFanfare();
      setGameWon(true);
      setIsPlaying(false);

      const newBest = { ...bestMoves };
      if (!newBest[difficulty] || moves < newBest[difficulty]) {
        newBest[difficulty] = moves;
        setBestMoves(newBest);
        localStorage.setItem('memory-match-best', JSON.stringify(newBest));
      }
    }
  }, [cards, isPlaying, moves, difficulty, bestMoves]);

  const useHint = () => {
    if (hintsLeft <= 0 || !isPlaying) return;
    
    const unmatched = cards.filter(c => !c.isMatched && !c.isFlipped);
    if (unmatched.length < 2) return;
    
    const firstCard = unmatched[0];
    const matchingCard = unmatched.find(c => c.emoji === firstCard.emoji && c.id !== firstCard.id);
    
    if (matchingCard) {
      playSound('bonus');
      setHintedCards([firstCard.id, matchingCard.id]);
      setHintsLeft(prev => prev - 1);
      
      setTimeout(() => {
        setHintedCards([]);
      }, 2000);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <GameLayout title="Memory Match" emoji="🃏" score={moves} showScore={true}>
      <div className="flex flex-col items-center">
        {/* Theme Selection */}
        {!isPlaying && !gameWon && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4"
          >
            <h2 className="text-xl font-bold text-white mb-3">Choose Theme</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {THEMES.map((t, i) => (
                <motion.button
                  key={t.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setThemeIndex(i)}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                    i === themeIndex
                      ? `bg-gradient-to-r ${t.bgGradient} text-white shadow-lg`
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {t.emojis[0]} {t.name}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Difficulty Selection */}
        {!isPlaying && !gameWon && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-6"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Choose Difficulty</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {DIFFICULTIES.map((d, i) => (
                <motion.button
                  key={d.name}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => initGame(i)}
                  className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg ${
                    i === 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' :
                    i === 1 ? 'bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700' :
                    'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
                  }`}
                >
                  {d.name}
                  <span className="block text-xs opacity-75">{d.cols}x{d.rows}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Game Stats */}
        {isPlaying && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-wrap gap-3 mb-4 text-white justify-center"
          >
            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2">
              <span>🔄</span>
              <span className="font-bold">{moves}</span>
            </div>
            <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-full flex items-center gap-2">
              <span>⏱️</span>
              <span className="font-bold">{formatTime(timer)}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={useHint}
              disabled={hintsLeft <= 0}
              className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${
                hintsLeft > 0
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-purple-900 hover:from-yellow-500 hover:to-orange-600'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              💡 {hintsLeft}
            </motion.button>
          </motion.div>
        )}

        {/* Card Grid */}
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid gap-2 sm:gap-3"
            style={{
              gridTemplateColumns: `repeat(${diff.cols}, minmax(0, 1fr))`,
              maxWidth: `${diff.cols * 70}px`,
            }}
          >
            <AnimatePresence mode='popLayout'>
              {cards.map(card => (
                <motion.button
                  key={card.id}
                  layout
                  initial={{ scale: 0, rotateY: 180 }}
                  animate={{ 
                    scale: 1, 
                    rotateY: card.isFlipped || card.isMatched ? 0 : 180,
                    backgroundColor: matchAnimation.includes(card.id) 
                      ? ['#22c55e', '#4ade80', '#22c55e'] 
                      : undefined,
                  }}
                  whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  onClick={() => handleCardClick(card.id)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl text-2xl sm:text-3xl flex items-center justify-center shadow-lg transition-all ${
                    card.isMatched
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500 border-4 border-green-300'
                      : card.isFlipped
                      ? `bg-gradient-to-br ${theme.cardBg}`
                      : hintedCards.includes(card.id)
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 border-4 border-yellow-300 animate-pulse'
                      : `bg-gradient-to-br ${theme.bgGradient}`
                  }`}
                  style={{
                    boxShadow: card.isMatched 
                      ? '0 0 20px rgba(34, 197, 94, 0.5)' 
                      : hintedCards.includes(card.id)
                      ? '0 0 20px rgba(234, 179, 8, 0.5)'
                      : '0 4px 15px rgba(0,0,0,0.2)',
                  }}
                >
                  {(card.isFlipped || card.isMatched) ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                    >
                      {card.emoji}
                    </motion.span>
                  ) : (
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-white/50"
                    >
                      ❓
                    </motion.span>
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Win Screen */}
        <WinScreen
          show={gameWon}
          score={moves}
          message={`Matched in ${moves} moves!`}
          isNewHighScore={bestMoves[difficulty] === moves}
          onPlayAgain={() => initGame(difficulty)}
        />
      </div>
    </GameLayout>
  );
}
