'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const GAME_DURATION = 30;

const COLORS = [
  { name: 'RED', bg: 'bg-red-500' },
  { name: 'BLUE', bg: 'bg-blue-500' },
  { name: 'GREEN', bg: 'bg-green-500' },
  { name: 'YELLOW', bg: 'bg-yellow-400' },
  { name: 'PURPLE', bg: 'bg-purple-500' },
  { name: 'ORANGE', bg: 'bg-orange-500' },
];

const COLOR_VALUES: { [key: string]: string } = {
  RED: '#EF4444',
  BLUE: '#3B82F6',
  GREEN: '#22C55E',
  YELLOW: '#FACC15',
  PURPLE: '#A855F7',
  ORANGE: '#F97316',
};

export default function ColorMatch() {
  const [displayColor, setDisplayColor] = useState('');
  const [displayWord, setDisplayWord] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const highScore = getHighScore('color-match');

  const generateRound = useCallback(() => {
    const wordColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const textColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    setDisplayWord(wordColor.name);
    setDisplayColor(textColor.name);

    // Generate options (always include the correct text color)
    const correctAnswer = textColor.name;
    const wrongOptions = COLORS.filter(c => c.name !== correctAnswer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(c => c.name);

    setOptions([correctAnswer, ...wrongOptions].sort(() => Math.random() - 0.5));
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setStreak(0);
    setIsPlaying(true);
    setGameOver(false);
    generateRound();
  }, [generateRound]);

  // Timer
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsPlaying(false);
          setGameOver(true);
          setHighScore('color-match', score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, score]);

  const handleAnswer = (selected: string) => {
    // The correct answer is the COLOR of the text, not the word
    if (selected === displayColor) {
      playSound('correct');
      const bonus = Math.floor(streak / 3) * 2;
      setScore(prev => prev + 10 + bonus);
      setStreak(prev => prev + 1);
      setFeedback('correct');
    } else {
      playSound('wrong');
      setStreak(0);
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      generateRound();
    }, 200);
  };

  return (
    <GameLayout title="Color Match" emoji="🌈" score={score} highScore={highScore}>
      <div className="flex flex-col items-center">
        {/* Timer & Streak */}
        <div className="flex gap-4 mb-6">
          <motion.div
            key={timeLeft}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`text-2xl font-bold px-4 py-2 rounded-full ${
              timeLeft <= 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-yellow-400 text-purple-900'
            }`}
          >
            ⏱️ {timeLeft}s
          </motion.div>
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-orange-400 text-white font-bold px-4 py-2 rounded-full text-lg"
            >
              🔥 {streak} streak!
            </motion.div>
          )}
        </div>

        {/* Instructions */}
        {isPlaying && (
          <p className="text-white text-lg mb-4 text-center">
            What <strong>COLOR</strong> is the word shown in?
          </p>
        )}

        {/* Word Display */}
        {isPlaying && (
          <motion.div
            key={displayWord + displayColor}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-2xl p-8 shadow-lg mb-6 min-w-[250px] text-center"
          >
            <p
              className="text-5xl sm:text-6xl font-bold"
              style={{ color: COLOR_VALUES[displayColor] }}
            >
              {displayWord}
            </p>
          </motion.div>
        )}

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              className={`absolute font-bold text-4xl ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}
            >
              {feedback === 'correct' ? '✓ Correct!' : '✗ Wrong!'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answer Options */}
        {isPlaying && (
          <div className="grid grid-cols-2 gap-3">
            {options.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(option)}
                className="w-28 h-14 sm:w-36 sm:h-16 rounded-xl text-lg sm:text-xl font-bold text-white shadow-lg"
                style={{ backgroundColor: COLOR_VALUES[option] }}
              >
                {option}
              </motion.button>
            ))}
          </div>
        )}

        {/* Start Button */}
        {!isPlaying && !gameOver && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={startGame}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-xl shadow-lg"
          >
            🎮 Start Game
          </motion.button>
        )}

        {/* How to Play */}
        <div className="mt-6 text-white/80 text-center text-sm max-w-xs">
          <p>Match the TEXT COLOR, not the word!</p>
          <p>Example: &quot;RED&quot; written in BLUE = click BLUE</p>
        </div>
      </div>

      <GameOverScreen
        show={gameOver}
        score={score}
        highScore={highScore}
        isNewHighScore={score > highScore && score > 0}
        onPlayAgain={startGame}
        message="Time's Up!"
      />
    </GameLayout>
  );
}
