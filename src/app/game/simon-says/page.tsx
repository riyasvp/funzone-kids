'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSimonTone, playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

type Color = 'red' | 'blue' | 'green' | 'yellow';

const COLORS: { name: Color; bg: string; activeBg: string }[] = [
  { name: 'red', bg: 'bg-red-500', activeBg: 'bg-red-300' },
  { name: 'blue', bg: 'bg-blue-500', activeBg: 'bg-blue-300' },
  { name: 'green', bg: 'bg-green-500', activeBg: 'bg-green-300' },
  { name: 'yellow', bg: 'bg-yellow-400', activeBg: 'bg-yellow-200' },
];

export default function SimonSays() {
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [level, setLevel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [canClick, setCanClick] = useState(false);

  const sequenceRef = useRef<Color[]>([]);

  const highScore = getHighScore('simon-says');

  // Play sequence function
  const playSequence = useCallback(async (seq: Color[]) => {
    setIsPlayingSequence(true);
    setCanClick(false);

    for (let i = 0; i < seq.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600));
      setActiveColor(seq[i]);
      playSimonTone(seq[i]);
      await new Promise(resolve => setTimeout(resolve, 400));
      setActiveColor(null);
    }

    setIsPlayingSequence(false);
    setCanClick(true);
    setPlayerIndex(0);
  }, []);

  // Add to sequence function
  const addToSequence = useCallback((currentSequence: Color[]) => {
    const newColor = COLORS[Math.floor(Math.random() * 4)].name;
    const newSequence = [...currentSequence, newColor];
    setSequence(newSequence);
    sequenceRef.current = newSequence;
    setLevel(newSequence.length);
    playSequence(newSequence);
  }, [playSequence]);

  // Start game
  const startGame = useCallback(() => {
    setSequence([]);
    sequenceRef.current = [];
    setLevel(0);
    setPlayerIndex(0);
    setIsPlaying(true);
    setGameOver(false);
    setCanClick(false);

    // Start first round
    setTimeout(() => {
      addToSequence([]);
    }, 500);
  }, [addToSequence]);

  const handleColorClick = (color: Color) => {
    if (!canClick || isPlayingSequence) return;

    playSimonTone(color);
    setActiveColor(color);
    setTimeout(() => setActiveColor(null), 200);

    const currentSequence = sequenceRef.current;

    if (color === currentSequence[playerIndex]) {
      // Correct!
      playSound('click');

      if (playerIndex === currentSequence.length - 1) {
        // Completed sequence
        setCanClick(false);
        setTimeout(() => {
          addToSequence(currentSequence);
        }, 1000);
      } else {
        setPlayerIndex(prev => prev + 1);
      }
    } else {
      // Wrong!
      playSound('lose');
      setIsPlaying(false);
      setGameOver(true);
      setHighScore('simon-says', level);
    }
  };

  return (
    <GameLayout title="Simon Says" emoji="🔴" score={level} highScore={highScore}>
      <div className="flex flex-col items-center">
        {/* Status */}
        <div className="mb-6 text-xl text-white font-bold">
          {isPlayingSequence ? 'Watch the pattern...' : canClick ? 'Your turn!' : 'Get ready...'}
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-2 gap-4">
          {COLORS.map(color => (
            <motion.button
              key={color.name}
              whileHover={canClick ? { scale: 1.05 } : {}}
              whileTap={canClick ? { scale: 0.95 } : {}}
              onClick={() => handleColorClick(color.name)}
              disabled={!canClick || isPlayingSequence}
              className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl shadow-lg transition-all duration-150 ${
                activeColor === color.name ? color.activeBg : color.bg
              } ${canClick ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
              style={{
                boxShadow: activeColor === color.name ? `0 0 30px ${color.name === 'yellow' ? '#FFD700' : color.name === 'red' ? '#FF0000' : color.name === 'blue' ? '#0000FF' : '#00FF00'}` : undefined,
              }}
            />
          ))}
        </div>

        {/* Start Button */}
        {!isPlaying && !gameOver && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={startGame}
            className="mt-8 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-xl shadow-lg"
          >
            🎮 Start Game
          </motion.button>
        )}

        {/* Instructions */}
        <div className="mt-6 text-white/80 text-center text-sm">
          <p>Watch the pattern, then repeat it!</p>
          <p>Each round adds one more color to remember.</p>
        </div>
      </div>

      <GameOverScreen
        show={gameOver}
        score={level}
        highScore={highScore}
        isNewHighScore={level > highScore && level > 0}
        onPlayAgain={startGame}
        message={`Game Over at Level ${level}!`}
      />
    </GameLayout>
  );
}
