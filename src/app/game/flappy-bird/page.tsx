'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const GAME_WIDTH = 320;
const GAME_HEIGHT = 450;
const BIRD_SIZE = 35;
const PIPE_WIDTH = 60;
const PIPE_GAP = 140;
const GRAVITY = 0.45;
const JUMP_FORCE = -8;

type Pipe = {
  x: number;
  topHeight: number;
  passed: boolean;
  hasStar?: boolean;
};

type Coin = {
  x: number;
  y: number;
  collected: boolean;
};

type BackgroundTheme = 'day' | 'night' | 'sunset' | 'space';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
};

const THEMES: Record<BackgroundTheme, { 
  bgGradient: string; 
  groundColor: string; 
  birdColor: string;
  cloudColor: string;
}> = {
  day: {
    bgGradient: 'from-sky-400 via-sky-300 to-sky-200',
    groundColor: 'from-green-600 to-green-400',
    birdColor: '#fbbf24',
    cloudColor: 'rgba(255,255,255,0.9)',
  },
  night: {
    bgGradient: 'from-indigo-900 via-purple-900 to-slate-900',
    groundColor: 'from-emerald-800 to-emerald-600',
    birdColor: '#fcd34d',
    cloudColor: 'rgba(200,200,255,0.3)',
  },
  sunset: {
    bgGradient: 'from-orange-500 via-pink-500 to-purple-500',
    groundColor: 'from-amber-700 to-amber-500',
    birdColor: '#fef3c7',
    cloudColor: 'rgba(255,220,200,0.8)',
  },
  space: {
    bgGradient: 'from-black via-purple-950 to-indigo-950',
    groundColor: 'from-gray-700 to-gray-500',
    birdColor: '#60a5fa',
    cloudColor: 'rgba(200,200,255,0.2)',
  },
};

const BIRD_EMOJIS = ['🐦', '🦅', '🦆', '🦉'];
const COIN_EMOJIS = ['🪙', '💎', '⭐', '🌟'];

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
  const [clouds, setClouds] = useState<{ x: number; y: number; size: number; speed: number }[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [birdEmoji, setBirdEmoji] = useState('🐦');
  const [isInvincible, setIsInvincible] = useState(false);
  
  const animationRef = useRef<number>();
  const gameStateRef = useRef({ birdY, birdVelocity, pipes, score, coins });

  const highScore = getHighScore('flappy-bird');

  const themeConfig = THEMES[theme];

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
    setParticles([]);
    setIsInvincible(false);
    
    const themes = Object.keys(THEMES) as BackgroundTheme[];
    setTheme(themes[Math.floor(Math.random() * themes.length)]);
    setBirdEmoji(BIRD_EMOJIS[Math.floor(Math.random() * BIRD_EMOJIS.length)]);
    
    const initialClouds = Array.from({ length: 6 }, () => ({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT * 0.5,
      size: 25 + Math.random() * 35,
      speed: 0.3 + Math.random() * 0.5,
    }));
    setClouds(initialClouds);
  }, []);

  const jump = useCallback(() => {
    if (!isPlaying && !gameOver) {
      startGame();
    } else if (isPlaying) {
      setBirdVelocity(JUMP_FORCE);
      playSound('jump');
      // Add jump particles
      const head = 60 + BIRD_SIZE / 2;
      setParticles(prev => [...prev, 
        { x: head, y: birdY + BIRD_SIZE, vx: (Math.random() - 0.5) * 4, vy: -2, life: 15, color: 'rgba(255,255,255,0.6)', size: 4 },
        { x: head, y: birdY + BIRD_SIZE, vx: (Math.random() - 0.5) * 4, vy: -3, life: 20, color: 'rgba(255,255,255,0.4)', size: 6 },
      ]);
    }
  }, [isPlaying, gameOver, startGame, birdY]);

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

      // Clamp velocity
      newVelocity = Math.max(-12, Math.min(10, newVelocity));
      
      setBirdY(newY);
      setBirdVelocity(newVelocity);

      // Check boundaries
      if (!isInvincible && (newY < 0 || newY > GAME_HEIGHT - BIRD_SIZE - 20)) {
        playSound('explosion');
        setIsPlaying(false);
        setGameOver(true);
        setHighScore('flappy-bird', state.score);
        return;
      }

      // Spawn pipes
      if (frameCount % 90 === 0) {
        const topHeight = Math.random() * (GAME_HEIGHT - PIPE_GAP - 100) + 50;
        const hasStar = Math.random() < 0.2;
        setPipes(prev => [...prev, { x: GAME_WIDTH, topHeight, passed: false, hasStar }]);
        
        // Spawn coins
        if (Math.random() > 0.4) {
          const coinY = topHeight + PIPE_GAP / 2 + (Math.random() - 0.5) * 40;
          setCoins(prev => [...prev, { x: GAME_WIDTH + PIPE_WIDTH / 2, y: coinY, collected: false }]);
        }
      }

      // Move pipes
      setPipes(prev =>
        prev
          .map(pipe => ({ ...pipe, x: pipe.x - 2.5 }))
          .filter(pipe => pipe.x > -PIPE_WIDTH)
      );

      // Move coins
      setCoins(prev =>
        prev
          .map(coin => ({ ...coin, x: coin.x - 2.5 }))
          .filter(coin => coin.x > -20)
      );

      // Check collision with pipes
      const birdRect = {
        x: 50,
        y: newY,
        width: BIRD_SIZE - 10,
        height: BIRD_SIZE - 10,
      };

      for (const pipe of state.pipes) {
        if (!isInvincible) {
          // Top pipe collision
          if (
            birdRect.x < pipe.x + PIPE_WIDTH &&
            birdRect.x + birdRect.width > pipe.x &&
            birdRect.y < pipe.topHeight
          ) {
            playSound('explosion');
            setIsPlaying(false);
            setGameOver(true);
            setHighScore('flappy-bird', state.score);
            return;
          }

          // Bottom pipe collision
          if (
            birdRect.x < pipe.x + PIPE_WIDTH &&
            birdRect.x + birdRect.width > pipe.x &&
            birdRect.y + birdRect.height > pipe.topHeight + PIPE_GAP
          ) {
            playSound('explosion');
            setIsPlaying(false);
            setGameOver(true);
            setHighScore('flappy-bird', state.score);
            return;
          }
        }

        // Score
        if (!pipe.passed && pipe.x + PIPE_WIDTH < 50) {
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
          playSound('bonus');
          setCoinCount(prev => prev + 1);
          setScore(prev => prev + 5);
          
          // Collection particles
          setParticles(prev => [...prev, 
            { x: coin.x, y: coin.y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 20, color: '#fbbf24', size: 8 },
            { x: coin.x, y: coin.y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 25, color: '#fcd34d', size: 5 },
          ]);
          
          coin.collected = true;
        }
      }

      // Update clouds
      setClouds(prev =>
        prev.map(cloud => ({
          ...cloud,
          x: cloud.x - cloud.speed,
        })).filter(cloud => cloud.x > -50)
      );

      // Spawn new clouds
      if (frameCount % 150 === 0) {
        setClouds(prev => [
          ...prev,
          { x: GAME_WIDTH, y: Math.random() * GAME_HEIGHT * 0.4, size: 25 + Math.random() * 35, speed: 0.3 + Math.random() * 0.5 },
        ]);
      }

      // Update particles
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 1,
            size: p.size * 0.95,
          }))
          .filter(p => p.life > 0)
      );

      animationRef.current = requestAnimationFrame(update);
    };

    animationRef.current = requestAnimationFrame(update);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, isInvincible]);

  return (
    <GameLayout title="Flappy Bird" emoji="🐦" score={score} highScore={highScore}>
      <div className="flex flex-col items-center">
        {/* Coin counter */}
        <div className="mb-3 flex items-center gap-2 bg-yellow-400/90 backdrop-blur px-4 py-2 rounded-full text-purple-900 font-bold shadow-lg">
          <motion.span
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            🪙
          </motion.span>
          <span>{coinCount}</span>
        </div>

        {/* Game Canvas */}
        <div
          className="relative rounded-2xl overflow-hidden border-4 border-sky-400 shadow-2xl cursor-pointer"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          onClick={jump}
          onTouchStart={jump}
        >
          {/* Background */}
          <div className={`absolute inset-0 bg-gradient-to-b ${themeConfig.bgGradient}`} />

          {/* Stars (for night/space themes) */}
          {(theme === 'night' || theme === 'space') && (
            <div className="absolute inset-0">
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute bg-white rounded-full"
                  initial={{ opacity: 0.3 }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 70}%`,
                    width: 1 + Math.random() * 2,
                    height: 1 + Math.random() * 2,
                  }}
                />
              ))}
            </div>
          )}

          {/* Clouds */}
          {clouds.map((cloud, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: cloud.x,
                top: cloud.y,
                fontSize: cloud.size,
                color: themeConfig.cloudColor,
                filter: 'blur(1px)',
              }}
            >
              ☁️
            </motion.div>
          ))}

          {/* Pipes with gradient */}
          {pipes.map((pipe, index) => (
            <div key={index}>
              {/* Top Pipe */}
              <div
                className="absolute"
                style={{
                  left: pipe.x,
                  top: 0,
                  width: PIPE_WIDTH,
                  height: pipe.topHeight,
                }}
              >
                <div className="w-full h-full bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-b-xl">
                  <div className="w-full h-3 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-t-sm" />
                </div>
                {/* Pipe cap */}
                <div className="absolute -bottom-2 -left-1 w-[calc(100%+8px)] h-6 bg-gradient-to-b from-emerald-600 to-emerald-700 rounded-lg" />
              </div>
              
              {/* Bottom Pipe */}
              <div
                className="absolute"
                style={{
                  left: pipe.x,
                  top: pipe.topHeight + PIPE_GAP,
                  width: PIPE_WIDTH,
                  height: GAME_HEIGHT - pipe.topHeight - PIPE_GAP - 20,
                }}
              >
                <div className="w-full h-full bg-gradient-to-b from-emerald-600 to-emerald-500 rounded-t-xl">
                  <div className="w-full h-3 bg-gradient-to-t from-emerald-400 to-emerald-500 rounded-b-sm" />
                </div>
                <div className="absolute -top-2 -left-1 w-[calc(100%+8px)] h-6 bg-gradient-to-t from-emerald-600 to-emerald-700 rounded-lg" />
              </div>
            </div>
          ))}

          {/* Coins */}
          <AnimatePresence>
            {coins.map((coin, index) => (
              !coin.collected && (
                <motion.div
                  key={index}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="absolute"
                  style={{
                    left: coin.x,
                    top: coin.y,
                  }}
                >
                  <motion.div
                    animate={{ rotateY: [0, 360] }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="text-2xl drop-shadow-lg"
                    style={{ filter: 'drop-shadow(0 0 8px #fbbf24)' }}
                  >
                    🪙
                  </motion.div>
                </motion.div>
              )
            ))}
          </AnimatePresence>

          {/* Particles */}
          {particles.map((p, i) => (
            <motion.div
              key={i}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 0, opacity: 0 }}
              className="absolute rounded-full"
              style={{
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
              }}
            />
          ))}

          {/* Bird */}
          <motion.div
            className="absolute drop-shadow-2xl"
            style={{
              left: 50,
              top: birdY,
              fontSize: BIRD_SIZE,
              filter: isInvincible ? 'drop-shadow(0 0 15px #60a5fa)' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            }}
            animate={{ 
              rotate: birdVelocity > 0 ? 25 : -25,
              scale: isInvincible ? [1, 1.2, 1] : 1,
            }}
            transition={{ rotate: { duration: 0.1 } }}
          >
            {birdEmoji}
            {isInvincible && (
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                style={{ backgroundColor: '#60a5fa' }}
              />
            )}
          </motion.div>

          {/* Ground with grass effect */}
          <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-green-700 to-green-500" />
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-green-800 to-green-600" />
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-amber-700 to-amber-500" />

          {/* Start Screen */}
          {!isPlaying && !gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.5, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-7xl mb-4"
                >
                  🐦
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); startGame(); }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-xl"
                >
                  🎮 Start Game
                </motion.button>
                <p className="text-white mt-4 text-sm bg-black/30 px-4 py-2 rounded-full">Tap or press SPACE to fly!</p>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-center text-sm bg-white/10 px-4 py-2 rounded-full">
          <p>Tap or press SPACE to fly through the pipes!</p>
          <p>Collect 🪙 coins for bonus points!</p>
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
