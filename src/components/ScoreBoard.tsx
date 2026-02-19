'use client';

import { motion } from 'framer-motion';

interface ScoreBoardProps {
  score: number;
  highScore?: number;
  level?: number;
  lives?: number;
  timer?: number;
  moves?: number;
}

export default function ScoreBoard({
  score,
  highScore = 0,
  level,
  lives,
  timer,
  moves,
}: ScoreBoardProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-4">
      {/* Score */}
      <motion.div
        key={score}
        initial={{ scale: 1.3 }}
        animate={{ scale: 1 }}
        className="bg-yellow-400 text-purple-900 px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2"
      >
        <span className="text-xl">⭐</span>
        <span className="text-xl">{score}</span>
      </motion.div>

      {/* High Score */}
      {highScore > 0 && (
        <div className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
          Best: {highScore}
        </div>
      )}

      {/* Level */}
      {level !== undefined && (
        <motion.div
          key={level}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="bg-purple-500 text-white px-4 py-2 rounded-full font-bold"
        >
          Level {level}
        </motion.div>
      )}

      {/* Lives */}
      {lives !== undefined && (
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <motion.span
              key={i}
              animate={i < lives ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 0.3 }}
              className={`text-2xl ${i < lives ? '' : 'opacity-30 grayscale'}`}
            >
              ❤️
            </motion.span>
          ))}
        </div>
      )}

      {/* Timer */}
      {timer !== undefined && (
        <motion.div
          key={timer}
          initial={{ scale: timer <= 10 ? 1.1 : 1 }}
          className={`px-4 py-2 rounded-full font-bold ${
            timer <= 10
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-white/20 text-white'
          }`}
        >
          ⏱️ {timer}s
        </motion.div>
      )}

      {/* Moves */}
      {moves !== undefined && (
        <div className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
          Moves: {moves}
        </div>
      )}
    </div>
  );
}
