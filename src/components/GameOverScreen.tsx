'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface GameOverScreenProps {
  show: boolean;
  score: number;
  highScore?: number;
  isNewHighScore?: boolean;
  onPlayAgain: () => void;
  message?: string;
}

export default function GameOverScreen({
  show,
  score,
  highScore = 0,
  isNewHighScore = false,
  onPlayAgain,
  message = 'Game Over!',
}: GameOverScreenProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 50 }}
            transition={{ type: 'spring', damping: 15 }}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-8 sm:p-12 
                       text-center shadow-2xl border-4 border-red-500/50 max-w-sm mx-4"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-6xl sm:text-8xl mb-4"
            >
              💀
            </motion.div>

            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-4xl font-bold text-red-400 mb-4"
            >
              {message}
            </motion.h2>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 rounded-2xl p-4 mb-4"
            >
              <p className="text-white text-xl font-bold">
                Score: <span className="text-3xl text-yellow-400">{score}</span> ⭐
              </p>
            </motion.div>

            {highScore > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="bg-white/5 rounded-xl p-3 mb-6"
              >
                {isNewHighScore ? (
                  <motion.p
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="text-yellow-400 font-bold text-lg"
                  >
                    🏆 NEW HIGH SCORE: {highScore}! 🏆
                  </motion.p>
                ) : (
                  <p className="text-gray-400">
                    High Score: <span className="text-white font-bold">{highScore}</span>
                  </p>
                )}
              </motion.div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onPlayAgain}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 
                           rounded-full shadow-lg transition-colors text-lg"
              >
                🔄 Try Again
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
