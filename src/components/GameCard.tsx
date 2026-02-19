'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Game } from '@/lib/games-list';

interface GameCardProps {
  game: Game;
  index: number;
}

export default function GameCard({ game, index }: GameCardProps) {
  const difficultyStars = '⭐'.repeat(game.difficulty);

  return (
    <Link href={`/game/${game.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.98 }}
        className={`${game.color} rounded-2xl p-4 sm:p-6 shadow-lg cursor-pointer 
                    border-4 border-white/30 hover:border-white/60 
                    transition-all duration-200 h-full flex flex-col
                    items-center justify-center text-center min-h-[140px]`}
      >
        <motion.span
          className="text-4xl sm:text-5xl mb-2"
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          {game.emoji}
        </motion.span>
        <h3 className="text-white font-bold text-lg sm:text-xl drop-shadow-md">
          {game.name}
        </h3>
        <div className="text-white/80 text-sm mt-1">{difficultyStars}</div>
      </motion.div>
    </Link>
  );
}
