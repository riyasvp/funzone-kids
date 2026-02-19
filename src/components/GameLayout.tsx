'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

interface GameLayoutProps {
  title: string;
  emoji: string;
  children: React.ReactNode;
  score?: number;
  highScore?: number;
  lives?: number;
  level?: number;
  showScore?: boolean;
}

export default function GameLayout({
  title,
  emoji,
  children,
  score = 0,
  highScore = 0,
  lives,
  level,
  showScore = true,
}: GameLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 bg-purple-700/95 backdrop-blur-sm shadow-lg"
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Back Button */}
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full font-bold transition-colors"
            >
              <span className="text-xl">←</span>
              <span className="hidden sm:inline">Home</span>
            </motion.button>
          </Link>

          {/* Game Title */}
          <motion.h1
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2"
          >
            <span className="text-2xl sm:text-3xl">{emoji}</span>
            <span className="hidden sm:inline">{title}</span>
          </motion.h1>

          {/* Score Display */}
          {showScore && (
            <div className="flex items-center gap-3">
              {lives !== undefined && (
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`text-xl ${i < lives ? 'opacity-100' : 'opacity-30'}`}
                    >
                      ❤️
                    </motion.span>
                  ))}
                </div>
              )}
              {level !== undefined && (
                <div className="bg-white/20 px-3 py-1 rounded-full text-white font-bold text-sm">
                  Lv.{level}
                </div>
              )}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="bg-yellow-400 text-purple-900 px-4 py-2 rounded-full font-bold shadow-lg"
              >
                ⭐ {score}
              </motion.div>
              {highScore > 0 && (
                <div className="hidden sm:flex bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Best: {highScore}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.header>

      {/* Game Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-3xl p-4 sm:p-6 shadow-xl"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-white/60 text-sm">
        Safe for Kids • Free Forever • No Ads
      </footer>
    </div>
  );
}
