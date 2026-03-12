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
  },
  {
    name: 'Nature',
    emojis: ['🎈', '🌟', '🌈', '🦋', '🌸', '🍎', '🌺', '🌻', '🌹', '🌷', '🍀', '🍁', '🍂', '🌾', '🌵', '🌴'],
  },
  {
    name: 'Space',
    emojis: ['🚀', '🛸', '🌍', '🌙', '⭐', '☄️', '🪐', '👽', '🛰️', '🌌', '🔭', '🌠', '🌑', '🌕', '🌗', '🌖'],
  },
  {
    name: 'Food',
    emojis: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧁', '🍩', '🍪', '🎂', '🍰', '🍫', '🍬', '🍭', '🍮', '🍯', '🍓'],
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

  useEffect(() => {
    const saved = localStorage.getItem('memory-match-best');
    if (saved) setBestMoves(JSON.parse(saved));
  }, []);

  const initGame = (diffIndex: number) => {
    const diff = DIFFICULTIES[diffIndex];
    const theme = THEMES[themeIndex];
    const selectedEmojis = theme.emojis.slice(0, diff.pairs);
    const cardEmojis = [...selectedEmojis, ...selectedEmojis];

    // Shuffle
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
        playSound('score');
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === first || c.id === second ? { ...c, isMatched: true } : c
            )
          );
          setFlippedCards([]);
        }, 300);
      } else {
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
    if (hintsLeft <= 0 || isPlaying === false) return;
    
    // Find two unmatched cards
    const unmatched = cards.filter(c => !c.isMatched && !c.isFlipped);
    if (unmatched.length < 2) return;
    
    // Find a matching pair
    const firstCard = unmatched[0];
    const matchingCard = unmatched.find(c => c.emoji === firstCard.emoji && c.id !== firstCard.id);
    
    if (matchingCard) {
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

  const diff = DIFFICULTIES[difficulty];
  const theme = THEMES[themeIndex];

  return (
    <GameLayout title="Memory Match" emoji="🃏" score={moves} showScore={true}>
      <div className="flex flex-col items-center">
        {/* Theme Selection */}
        {!isPlaying && !gameWon && (
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-white mb-2">Choose Theme</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {THEMES.map((t, i) => (
                <motion.button
                  key={t.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setThemeIndex(i)}
                  className={`px-4 py-2 rounded-full text-sm font-bold ${
                    i === themeIndex
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {t.emojis[0]} {t.name}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Difficulty Selection */}
        {!isPlaying && !gameWon && (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Choose Difficulty</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {DIFFICULTIES.map((d, i) => (
                <motion.button
                  key={d.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => initGame(i)}
                  className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg ${
                    i === 0 ? 'bg-green-500 hover:bg-green-600' :
                    i === 1 ? 'bg-yellow-500 hover:bg-yellow-600 text-purple-900' :
                    'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {d.name}
                  <span className="block text-xs opacity-75">{d.cols}x{d.rows}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Game Stats */}
        {isPlaying && (
          <div className="flex flex-wrap gap-3 mb-4 text-white justify-center">
            <div className="bg-white/20 px-4 py-2 rounded-full">
              Moves: {moves}
            </div>
            <div className="bg-white/20 px-4 py-2 rounded-full">
              ⏱️ {formatTime(timer)}
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={useHint}
              disabled={hintsLeft <= 0}
              className={`px-4 py-2 rounded-full font-bold ${
                hintsLeft > 0
                  ? 'bg-yellow-400 text-purple-900 hover:bg-yellow-300'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              💡 Hint ({hintsLeft})
            </motion.button>
          </div>
        )}

        {/* Card Grid */}
        {isPlaying && (
          <div
            className="grid gap-2 sm:gap-3"
            style={{
              gridTemplateColumns: `repeat(${diff.cols}, minmax(0, 1fr))`,
              maxWidth: `${diff.cols * 70}px`,
            }}
          >
            <AnimatePresence>
              {cards.map(card => (
                <motion.button
                  key={card.id}
                  initial={{ scale: 0, rotateY: 180 }}
                  animate={{ scale: 1, rotateY: card.isFlipped || card.isMatched ? 0 : 180 }}
                  whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCardClick(card.id)}
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl text-2xl sm:text-3xl flex items-center justify-center shadow-lg transition-all ${
                    card.isMatched
                      ? 'bg-green-400 border-2 border-green-300'
                      : card.isFlipped
                      ? 'bg-white'
                      : hintedCards.includes(card.id)
                      ? 'bg-yellow-300 border-4 border-yellow-500 animate-pulse'
                      : 'bg-gradient-to-br from-purple-500 to-pink-500'
                  }`}
                >
                  {(card.isFlipped || card.isMatched) ? card.emoji : '❓'}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
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
