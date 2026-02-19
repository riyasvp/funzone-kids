'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface WinScreenProps {
  show: boolean;
  score: number;
  isNewHighScore?: boolean;
  onPlayAgain: () => void;
  message?: string;
}

export default function WinScreen({
  show,
  score,
  isNewHighScore = false,
  onPlayAgain,
  message = 'You Win!',
}: WinScreenProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number; color: string }>>([]);

  useEffect(() => {
    if (show) {
      const newConfetti = [...Array(50)].map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 2,
        color: ['#FFD700', '#FF69B4', '#00CED1', '#98FB98', '#DDA0DD', '#FF6347'][Math.floor(Math.random() * 6)],
      }));
      setConfetti(newConfetti);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          {/* Confetti */}
          {confetti.map((c) => (
            <motion.div
              key={c.id}
              initial={{ y: -20, x: `${c.x}vw`, rotate: 0, opacity: 1 }}
              animate={{
                y: '110vh',
                rotate: Math.random() * 720 - 360,
                opacity: [1, 1, 0],
              }}
              transition={{ duration: 3, delay: c.delay, ease: 'linear' }}
              className="fixed w-3 h-3 rounded-sm"
              style={{ backgroundColor: c.color }}
            />
          ))}

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-8 sm:p-12 
                       text-center shadow-2xl border-4 border-white/50 max-w-sm mx-4"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
              className="text-6xl sm:text-8xl mb-4"
            >
              🎉
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl font-bold text-white mb-4 drop-shadow-lg"
            >
              {message}
            </motion.h2>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="bg-white/30 rounded-2xl p-4 mb-6"
            >
              <p className="text-white text-xl font-bold">
                Score: <span className="text-3xl">{score}</span> ⭐
              </p>
              {isNewHighScore && (
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="text-yellow-200 font-bold mt-2 text-lg"
                >
                  🏆 NEW HIGH SCORE! 🏆
                </motion.p>
              )}
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPlayAgain}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 
                           rounded-full shadow-lg transition-colors text-lg"
              >
                🔄 Play Again
              </motion.button>

              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 
                             rounded-full shadow-lg transition-colors text-lg w-full"
                >
                  🏠 Home
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
