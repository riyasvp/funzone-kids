'use client';

import { motion } from 'framer-motion';
import GameCard from '@/components/GameCard';
import { games } from '@/lib/games-list';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 via-pink-500 to-orange-400 font-[family-name:var(--font-fredoka)]">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl opacity-20 animate-bounce">⭐</div>
        <div className="absolute top-20 right-20 text-5xl opacity-20 animate-pulse">🎈</div>
        <div className="absolute bottom-20 left-20 text-5xl opacity-20 animate-bounce" style={{ animationDelay: '0.5s' }}>🎮</div>
        <div className="absolute bottom-10 right-10 text-6xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}>🎪</div>
        <div className="absolute top-1/3 left-5 text-4xl opacity-10 animate-spin" style={{ animationDuration: '10s' }}>🌈</div>
        <div className="absolute top-1/2 right-5 text-4xl opacity-10 animate-spin" style={{ animationDuration: '8s' }}>🎡</div>
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.5 }}
        className="relative z-10 text-center py-8 md:py-12 px-4"
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-5xl md:text-7xl mb-4"
        >
          🎮
        </motion.div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg mb-3">
          <span className="text-yellow-300">Fun</span>
          <span className="text-green-300">Zone</span>
          <span className="text-white"> Kids</span>
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-2xl text-white/90 font-medium"
        >
          🎉 Play 20 FREE Fun Games! 🎉
        </motion.p>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="mt-4 flex justify-center gap-2 flex-wrap"
        >
          <span className="bg-green-400 text-green-900 px-3 py-1 rounded-full text-sm font-bold">✓ Safe for Kids</span>
          <span className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">✓ Free Forever</span>
          <span className="bg-pink-400 text-pink-900 px-3 py-1 rounded-full text-sm font-bold">✓ No Ads</span>
        </motion.div>
      </motion.header>

      {/* Games Grid */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 pb-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4"
        >
          {games.map((game, index) => (
            <GameCard key={game.id} game={game} index={index} />
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 px-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl py-4 px-6 max-w-2xl mx-auto">
          <p className="text-white/80 text-sm md:text-base">
            🌟 Safe for Kids • Free Forever • No Ads 🌟
          </p>
          <p className="text-white/60 text-xs mt-2">
            FunZone Kids © {new Date().getFullYear()} - Making Learning Fun!
          </p>
        </div>
      </footer>
    </div>
  );
}
