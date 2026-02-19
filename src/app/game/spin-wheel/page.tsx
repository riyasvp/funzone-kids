'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import { playSound, playWinFanfare } from '@/lib/sounds';

const PRIZES = [
  { emoji: '🌟', name: 'Star', color: '#FFD700' },
  { emoji: '🎁', name: 'Gift', color: '#FF6B6B' },
  { emoji: '💎', name: 'Diamond', color: '#00CED1' },
  { emoji: '🎈', name: 'Balloon', color: '#FF69B4' },
  { emoji: '🏆', name: 'Trophy', color: '#FFA500' },
  { emoji: '🌈', name: 'Rainbow', color: '#9370DB' },
  { emoji: '🦋', name: 'Butterfly', color: '#98FB98' },
  { emoji: '🍭', name: 'Lollipop', color: '#FFB6C1' },
];

export default function SpinWheel() {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState<typeof PRIZES[0] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [collectedPrizes, setCollectedPrizes] = useState<typeof PRIZES>([]);
  const [spinCount, setSpinCount] = useState(0);

  const spin = useCallback(() => {
    if (isSpinning) return;

    playSound('click');
    setIsSpinning(true);
    setShowResult(false);
    setPrize(null);

    // Random spin (5-10 full rotations + random position)
    const spins = 5 + Math.random() * 5;
    const randomAngle = Math.random() * 360;
    const totalRotation = rotation + spins * 360 + randomAngle;

    setRotation(totalRotation);
    setSpinCount(prev => prev + 1);

    // Calculate prize after spin
    setTimeout(() => {
      // Determine which section the wheel landed on
      const normalizedAngle = totalRotation % 360;
      const sectionAngle = 360 / PRIZES.length;
      const prizeIndex = Math.floor((360 - normalizedAngle + sectionAngle / 2) / sectionAngle) % PRIZES.length;

      const wonPrize = PRIZES[prizeIndex];
      setPrize(wonPrize);
      setCollectedPrizes(prev => [...prev, wonPrize]);
      setIsSpinning(false);
      setShowResult(true);
      playWinFanfare();
    }, 4000);
  }, [isSpinning, rotation]);

  const resetPrizes = () => {
    setCollectedPrizes([]);
    setSpinCount(0);
  };

  return (
    <GameLayout title="Spin the Wheel" emoji="🎡" score={spinCount} showScore={false}>
      <div className="flex flex-col items-center">
        {/* Wheel Container */}
        <div className="relative mb-8">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 text-4xl">
            ▼
          </div>

          {/* Wheel */}
          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: 'easeOut' }}
            className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full shadow-2xl border-8 border-yellow-400"
            style={{
              background: `conic-gradient(${PRIZES.map((p, i) =>
                `${p.color} ${i * (360 / PRIZES.length)}deg ${(i + 1) * (360 / PRIZES.length)}deg`
              ).join(', ')})`,
            }}
          >
            {/* Prize sections */}
            {PRIZES.map((p, i) => {
              const angle = (i * (360 / PRIZES.length) + (360 / PRIZES.length) / 2) * (Math.PI / 180);
              const radius = 90;
              const x = Math.cos(angle - Math.PI / 2) * radius;
              const y = Math.sin(angle - Math.PI / 2) * radius;

              return (
                <div
                  key={i}
                  className="absolute text-3xl"
                  style={{
                    left: `calc(50% + ${x}px - 20px)`,
                    top: `calc(50% + ${y}px - 20px)`,
                  }}
                >
                  {p.emoji}
                </div>
              );
            })}

            {/* Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-3xl border-4 border-yellow-400">
              🎡
            </div>
          </motion.div>
        </div>

        {/* Spin Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={spin}
          disabled={isSpinning}
          className={`font-bold py-4 px-8 rounded-full text-xl shadow-lg ${
            isSpinning
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white'
          }`}
        >
          {isSpinning ? '🎰 Spinning...' : '🎰 SPIN!'}
        </motion.button>

        {/* Result */}
        <AnimatePresence>
          {showResult && prize && (
            <motion.div
              initial={{ scale: 0, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0 }}
              className="mt-6 bg-white rounded-2xl p-6 text-center shadow-xl"
            >
              <p className="text-gray-500 mb-2">You won:</p>
              <p className="text-6xl mb-2">{prize.emoji}</p>
              <p className="text-2xl font-bold" style={{ color: prize.color }}>
                {prize.name}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collected Prizes */}
        {collectedPrizes.length > 0 && (
          <div className="mt-6 bg-white/10 rounded-2xl p-4 max-w-xs">
            <div className="flex justify-between items-center mb-2">
              <p className="text-white font-bold">Your Prizes ({collectedPrizes.length})</p>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={resetPrizes}
                className="text-white/60 text-sm hover:text-white"
              >
                Reset
              </motion.button>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {collectedPrizes.slice(-10).map((p, i) => (
                <motion.span
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-2xl"
                >
                  {p.emoji}
                </motion.span>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-white/80 text-center text-sm">
          <p>Tap SPIN to spin the wheel!</p>
          <p>Collect prizes and see what you get! 🎁</p>
        </div>
      </div>
    </GameLayout>
  );
}
