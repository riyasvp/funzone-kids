'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const GAME_WIDTH = 320;
const GAME_HEIGHT = 450;
const BIRD_SIZE = 30;
const PIPE_WIDTH = 50;
const PIPE_GAP = 140;
const GRAVITY = 0.4;
const JUMP_FORCE = -7;

type Pipe = {
  x: number;
  topHeight: number;
  passed: boolean;
};

type Coin = {
  x: number;
  y: number;
  collected: boolean;
};

type BackgroundTheme = 'day' | 'night' | 'sunset';

export default function FlappyBird() {
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [score, setScore] = useState(0);
  const [coinCount, setCoinCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [theme, setTheme] = useState<BackgroundTheme>('day');
  const [clouds, setClouds] = useState<{ x: number; y: number; size: number }[]>([]);
  const animationRef = useRef<number>();
  const gameStateRef = useRef({ birdY, birdVelocity, pipes, score, coins });

  const highScore = getHighScore('flappy-bird');

  useEffect(() => {
    gameStateRef.current = { birdY, birdVelocity, pipes, score, coins };
  }, [birdY, birdVelocity, pipes, score, coins]);

  const startGame = useCallback(() => {
    setBirdY(GAME_HEIGHT / 2);
    setBirdVelocity(0);
    setPipes([]);
    setCoins([]);
    setScore(0);
    setCoinCount(0);
    setIsPlaying(true);
    setGameOver(false);
    setTheme(['day', 'night', 'sunset'][Math.floor(Math.random() * 3)] as BackgroundTheme);
    
    // Generate initial clouds
    const initialClouds = Array.from({ length: 5 }, () => ({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT * 0.5,
      size: 20 + Math.random() * 30,
    }));
    setClouds(initialClouds);
  }, []);

  const jump = useCallback(() => {
    if (!isPlaying && !gameOver) {
      startGame();
    } else if (isPlaying) {
      setBirdVelocity(JUMP_FORCE);
      playSound('jump');
    }
  }, [isPlaying, gameOver, startGame]);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  // Game loop
  useEffect(() => {
    if (!isPlaying) return;

    let frameCount = 0;

    const update = () => {
      const state = gameStateRef.current;
      frameCount++;

      // Update bird
      let newVelocity = state.birdVelocity + GRAVITY;
      let newY = state.birdY + newVelocity;

      setBirdY(newY);
      setBirdVelocity(newVelocity);

      // Check boundaries
      if (newY < 0 || newY > GAME_HEIGHT - BIRD_SIZE) {
        playSound('lose');
        setIsPlaying(false);
        setGameOver(true);
        setHighScore('flappy-bird', state.score);
        return;
      }

      // Spawn pipes
      if (frameCount % 100 === 0) {
        const topHeight = Math.random() * (GAME_HEIGHT - PIPE_GAP - 100) + 50;
        setPipes(prev => [...prev, { x: GAME_WIDTH, topHeight, passed: false }]);
        
        // Spawn coins between pipes
        if (Math.random() > 0.3) {
          const coinY = topHeight + PIPE_GAP / 2;
          setCoins(prev => [...prev, { x: GAME_WIDTH + PIPE_WIDTH / 2, y: coinY, collected: false }]);
        }
      }

      // Move pipes
      setPipes(prev =>
        prev
          .map(pipe => ({ ...pipe, x: pipe.x - 3 }))
          .filter(pipe => pipe.x > -PIPE_WIDTH)
      );

      // Move coins
      setCoins(prev =>
        prev
          .map(coin => ({ ...coin, x: coin.x - 3 }))
          .filter(coin => coin.x > -20)
      );

      // Check collision with pipes
      const birdRect = {
        x: 60,
        y: newY,
        width: BIRD_SIZE,
        height: BIRD_SIZE,
      };

      for (const pipe of state.pipes) {
        // Top pipe
        if (
          birdRect.x < pipe.x + PIPE_WIDTH &&
          birdRect.x + birdRect.width > pipe.x &&
          birdRect.y < pipe.topHeight
        ) {
          playSound('lose');
          setIsPlaying(false);
          setGameOver(true);
          setHighScore('flappy-bird', state.score);
          return;
        }

        // Bottom pipe
        if (
          birdRect.x < pipe.x + PIPE_WIDTH &&
          birdRect.x + birdRect.width > pipe.x &&
          birdRect.y + birdRect.height > pipe.topHeight + PIPE_GAP
        ) {
          playSound('lose');
          setIsPlaying(false);
          setGameOver(true);
          setHighScore('flappy-bird', state.score);
          return;
        }

        // Score
        if (!pipe.passed && pipe.x + PIPE_WIDTH < 60) {
          playSound('score');
          setScore(prev => prev + 1);
          pipe.passed = true;
        }
      }

      // Check coin collection
      for (const coin of state.coins) {
        if (
          !coin.collected &&
          birdRect.x < coin.x + 15 &&
          birdRect.x + birdRect.width > coin.x - 15 &&
          birdRect.y < coin.y + 15 &&
          birdRect.y + birdRect.height > coin.y - 15
        ) {
          playSound('score');
          setCoinCount(prev => prev + 1);
          setScore(prev => prev + 5);
          coin.collected = true;
        }
      }

      // Update clouds
      setClouds(prev =>
        prev.map(cloud => ({
          ...cloud,
          x: cloud.x - 0.5,
        })).filter(cloud => cloud.x > -50)
      );

      // Spawn new clouds
      if (frameCount % 200 === 0) {
        setClouds(prev => [
          ...prev,
          { x: GAME_WIDTH, y: Math.random() * GAME_HEIGHT * 0.4, size: 20 + Math.random() * 30 },
        ]);
      }

      animationRef.current = requestAnimationFrame(update);
    };

    animationRef.current = requestAnimationFrame(update);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  const getBackgroundColors = () => {
    switch (theme) {
      case 'night':
        return 'from-indigo-900 to-purple-800';
      case 'sunset':
        return 'from-orange-400 to-pink-500';
      default:
        return 'from-sky-400 to-sky-200';
    }
  };

  return (
    <GameLayout title="Flappy Bird" emoji="🐦" score={score} highScore={highScore}>
      <div className="flex flex-col items-center">
        {/* Coin counter */}
        <div className="mb-3 flex items-center gap-2 bg-yellow-400/80 px-4 py-2 rounded-full text-purple-900 font-bold">
          🪙 {coinCount}
        </div>

        {/* Game Canvas */}
        <div
          className="relative rounded-2xl overflow-hidden border-4 border-sky-400 shadow-lg cursor-pointer"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          onClick={jump}
          onTouchStart={jump}
        >
          {/* Sky Background */}
          <div className={`absolute inset-0 bg-gradient-to-b ${getBackgroundColors()}`} />

          {/* Stars (for night theme) */}
          {theme === 'night' && (
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 60}%`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Clouds */}
          {clouds.map((cloud, i) => (
            <div
              key={i}
              className="absolute text-white opacity-70"
              style={{
                left: cloud.x,
                top: cloud.y,
                fontSize: cloud.size,
              }}
            >
              ☁️
            </div>
          ))}

          {/* Pipes */}
          {pipes.map((pipe, index) => (
            <div key={index}>
              {/* Top Pipe */}
              <div
                className="absolute bg-gradient-to-r from-green-600 to-green-400 border-2 border-green-700"
                style={{
                  left: pipe.x,
                  top: 0,
                  width: PIPE_WIDTH,
                  height: pipe.topHeight,
                  borderRadius: '0 0 8px 8px',
                }}
              />
              {/* Bottom Pipe */}
              <div
                className="absolute bg-gradient-to-r from-green-600 to-green-400 border-2 border-green-700"
                style={{
                  left: pipe.x,
                  top: pipe.topHeight + PIPE_GAP,
                  width: PIPE_WIDTH,
                  height: GAME_HEIGHT - pipe.topHeight - PIPE_GAP,
                  borderRadius: '8px 8px 0 0',
                }}
              />
            </div>
          ))}

          {/* Coins */}
          <AnimatePresence>
            {coins.map((coin, index) => (
              !coin.collected && (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 360] }}
                  transition={{ rotate: { duration: 2, repeat: Infinity } }}
                  className="absolute text-xl"
                  style={{
                    left: coin.x,
                    top: coin.y,
                  }}
                >
                  🪙
                </motion.div>
              )
            ))}
          </AnimatePresence>

          {/* Bird */}
          <motion.div
            className="absolute text-3xl"
            style={{
              left: 60,
              top: birdY,
            }}
            animate={{ rotate: birdVelocity > 0 ? 30 : -20 }}
          >
            🐦
          </motion.div>

          {/* Ground */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-green-800 to-green-600" />

          {/* Start Screen */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🐦</div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); startGame(); }}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-xl shadow-lg"
                >
                  🎮 Start Game
                </motion.button>
                <p className="text-white mt-4 text-sm">Tap or press SPACE to fly!</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-center text-sm">
          <p>Tap or press SPACE to fly through the pipes!</p>
          <p>Collect 🪙 coins for bonus points! Random themes!</p>
        </div>
      </div>

      <GameOverScreen
        show={gameOver}
        score={score}
        highScore={highScore}
        isNewHighScore={score > highScore && score > 0}
        onPlayAgain={startGame}
      />
    </GameLayout>
  );
}
