'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound, playWinFanfare } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const GRID_SIZE = 20;
const CELL_SIZE = 18;
const INITIAL_SPEED = 150;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };
type PowerUpType = 'speed' | 'shield' | 'double' | 'shrink';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface PowerUp {
  position: Position;
  type: PowerUpType;
  expiresAt: number;
}

const POWER_UP_EMOJIS: Record<PowerUpType, string> = {
  speed: '⚡',
  shield: '🛡️',
  double: '✨',
  shrink: '📉',
};

const POWER_UP_COLORS: Record<PowerUpType, string> = {
  speed: '#fbbf24',
  shield: '#60a5fa',
  double: '#c084fc',
  shrink: '#f87171',
};

const FOOD_EMOJIS = ['🍎', '🍓', '🍇', '🍊', '🍒', '🥝', '🍑', '🍉', '🫐', '🥭'];

const BG_COLORS = [
  'from-green-900 via-green-800 to-emerald-900',
  'from-blue-900 via-blue-800 to-cyan-900',
  'from-purple-900 via-purple-800 to-pink-900',
  'from-orange-900 via-red-800 to-yellow-900',
];

export default function SnakeGame() {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [powerUp, setPowerUp] = useState<PowerUp | null>(null);
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [activePowerUp, setActivePowerUp] = useState<PowerUpType | null>(null);
  const [powerUpTimer, setPowerUpTimer] = useState(0);
  const [foodEmoji, setFoodEmoji] = useState('🍎');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [bgIndex, setBgIndex] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  
  const directionRef = useRef(direction);
  const scoreRef = useRef(score);

  const highScore = getHighScore('snake');

  const generateParticles = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x: x * CELL_SIZE + CELL_SIZE / 2,
        y: y * CELL_SIZE + CELL_SIZE / 2,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 20 + Math.random() * 10,
        color,
        size: 3 + Math.random() * 3,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }, []);

  const generateFood = useCallback((snakeBody: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snakeBody.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const generatePowerUp = useCallback((snakeBody: Position[]): PowerUp | null => {
    if (Math.random() > 0.15) return null;
    
    const types: PowerUpType[] = ['speed', 'shield', 'double', 'shrink'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let position: Position;
    do {
      position = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snakeBody.some(segment => segment.x === position.x && segment.y === position.y));
    
    return {
      position,
      type,
      expiresAt: Date.now() + 6000,
    };
  }, []);

  const resetGame = useCallback(() => {
    setSnake([{ x: 10, y: 10 }]);
    setFood({ x: 15, y: 10 });
    setPowerUp(null);
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setActivePowerUp(null);
    setPowerUpTimer(0);
    setFoodEmoji('🍎');
    setParticles([]);
    setCombo(0);
    setBgIndex(Math.floor(Math.random() * BG_COLORS.length));
    setIsPlaying(true);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const particleInterval = setInterval(() => {
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.2,
            life: p.life - 1,
            size: p.size * 0.95,
          }))
          .filter(p => p.life > 0)
      );
    }, 30);

    return () => clearInterval(particleInterval);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const moveSnake = () => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        const currentDir = directionRef.current;

        switch (currentDir) {
          case 'UP':
            head.y -= 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
          case 'RIGHT':
            head.x += 1;
            break;
        }

        // Wall collision
        if (activePowerUp !== 'shield' && (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE)) {
          playSound('explosion');
          generateParticles(head.x, head.y, '#ef4444', 20);
          setGameOver(true);
          setIsPlaying(false);
          setHighScore('snake', scoreRef.current);
          return prevSnake;
        }

        // Wrap around if shield is active
        if (activePowerUp === 'shield') {
          if (head.x < 0) head.x = GRID_SIZE - 1;
          if (head.x >= GRID_SIZE) head.x = 0;
          if (head.y < 0) head.y = GRID_SIZE - 1;
          if (head.y >= GRID_SIZE) head.y = 0;
        }

        // Self collision
        if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          playSound('explosion');
          generateParticles(head.x, head.y, '#ef4444', 20);
          setGameOver(true);
          setIsPlaying(false);
          setHighScore('snake', scoreRef.current);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Food collision
        if (head.x === food.x && head.y === food.y) {
          playSound('score');
          generateParticles(food.x, food.y, '#fbbf24', 12);
          
          const points = activePowerUp === 'double' ? 4 : 2;
          const newCombo = combo + 1;
          setCombo(newCombo);
          setShowCombo(true);
          setTimeout(() => setShowCombo(false), 500);
          
          setScore(prev => {
            const newScore = prev + points + Math.floor(newCombo / 3);
            scoreRef.current = newScore;
            if (newScore % 10 === 0) {
              setSpeed(s => Math.max(50, s - 15));
            }
            return newScore;
          });
          
          setFood(generateFood(newSnake));
          setFoodEmoji(FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)]);
          
          // Spawn power-up
          const newPowerUp = generatePowerUp(newSnake);
          if (newPowerUp) setPowerUp(newPowerUp);
        } else {
          newSnake.pop();
        }

        // Power-up collision
        if (powerUp && head.x === powerUp.position.x && head.y === powerUp.position.y) {
          playSound('powerup');
          generateParticles(powerUp.position.x, powerUp.position.y, POWER_UP_COLORS[powerUp.type], 15);
          setActivePowerUp(powerUp.type);
          setPowerUpTimer(6);
          setPowerUp(null);
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [isPlaying, gameOver, food, speed, generateFood, score, powerUp, activePowerUp, generatePowerUp, combo, generateParticles]);

  // Power-up timer
  useEffect(() => {
    if (activePowerUp && powerUpTimer > 0) {
      const timer = setInterval(() => {
        setPowerUpTimer(prev => {
          if (prev <= 1) {
            setActivePowerUp(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activePowerUp, powerUpTimer]);

  // Clean up expired power-ups
  useEffect(() => {
    if (!isPlaying) return;
    const cleanup = setInterval(() => {
      setPowerUp(prev => {
        if (prev && Date.now() > prev.expiresAt) {
          return null;
        }
        return prev;
      });
    }, 100);
    return () => clearInterval(cleanup);
  }, [isPlaying]);

  const handleControlClick = (dir: Direction) => {
    const currentDir = directionRef.current;
    if (
      (dir === 'UP' && currentDir !== 'DOWN') ||
      (dir === 'DOWN' && currentDir !== 'UP') ||
      (dir === 'LEFT' && currentDir !== 'RIGHT') ||
      (dir === 'RIGHT' && currentDir !== 'LEFT')
    ) {
      setDirection(dir);
      directionRef.current = dir;
      playSound('click');
    }
  };

  return (
    <GameLayout title="Snake" emoji="🐍" score={score} highScore={highScore}>
      <div className="flex flex-col items-center">
        {/* Power-up & Combo indicators */}
        <div className="mb-3 flex items-center gap-3">
          {activePowerUp && (
            <motion.div
              initial={{ scale: 0, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0 }}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-white shadow-lg"
              style={{ backgroundColor: POWER_UP_COLORS[activePowerUp] }}
            >
              <span className="text-xl animate-pulse">{POWER_UP_EMOJIS[activePowerUp]}</span>
              <span className="capitalize">{activePowerUp}</span>
              <span className="text-yellow-200">{powerUpTimer}s</span>
            </motion.div>
          )}
          {showCombo && combo > 1 && (
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full font-bold shadow-lg"
            >
              🔥 {combo}x COMBO!
            </motion.div>
          )}
        </div>

        {/* Game Canvas */}
        <div
          className={`relative rounded-2xl overflow-hidden border-4 shadow-2xl ${
            activePowerUp === 'shield' 
              ? 'border-blue-400 bg-blue-950' 
              : `bg-gradient-to-br ${BG_COLORS[bgIndex]}`
          }`}
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
          }}
        >
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
            }}
          />

          {/* Particles */}
          {particles.map((p, i) => (
            <motion.div
              key={i}
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 0, opacity: 0 }}
              className="absolute rounded-full"
              style={{
                left: p.x - p.size / 2,
                top: p.y - p.size / 2,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              }}
            />
          ))}

          {/* Snake */}
          {snake.map((segment, index) => (
            <motion.div
              key={index}
              initial={false}
              animate={{
                x: segment.x * CELL_SIZE,
                y: segment.y * CELL_SIZE,
              }}
              transition={{ duration: 0.05, ease: 'linear' }}
              className={`absolute rounded-lg ${
                index === 0 
                  ? activePowerUp === 'shield' 
                    ? 'bg-blue-300 ring-4 ring-blue-400/50' 
                    : 'bg-emerald-300 ring-4 ring-emerald-400/50'
                  : activePowerUp === 'shield'
                    ? 'bg-blue-400'
                    : 'bg-emerald-500'
              }`}
              style={{
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
                left: 1,
                top: 1,
                boxShadow: index === 0 
                  ? (activePowerUp === 'shield' ? '0 0 15px #60a5fa' : '0 0 10px #34d399')
                  : 'none',
              }}
            >
              {/* Eyes for head */}
              {index === 0 && (
                <div className="absolute top-1 left-1 right-1 flex justify-between">
                  <div className="w-2 h-2 bg-black rounded-full" />
                  <div className="w-2 h-2 bg-black rounded-full" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Food with glow effect */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="absolute drop-shadow-lg"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE,
              fontSize: CELL_SIZE - 2,
              lineHeight: `${CELL_SIZE}px`,
              textAlign: 'center',
              filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))',
            }}
          >
            {foodEmoji}
          </motion.div>

          {/* Power-up */}
          <AnimatePresence>
            {powerUp && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="absolute drop-shadow-lg"
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  left: powerUp.position.x * CELL_SIZE,
                  top: powerUp.position.y * CELL_SIZE,
                  fontSize: CELL_SIZE - 2,
                  lineHeight: `${CELL_SIZE}px`,
                  textAlign: 'center',
                  filter: `drop-shadow(0 0 10px ${POWER_UP_COLORS[powerUp.type]})`,
                }}
              >
                {POWER_UP_EMOJIS[powerUp.type]}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Start Screen */}
          {!isPlaying && !gameOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl"
            >
              <motion.div
                initial={{ scale: 0.5, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  🐍
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={resetGame}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-xl"
                >
                  🎮 Start Game
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </div>

        {/* Mobile Controls - Enhanced */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          <div />
          <motion.button
            whileTap={{ scale: 0.85, backgroundColor: '#7c3aed' }}
            onClick={() => handleControlClick('UP')}
            className="bg-gradient-to-b from-violet-500 to-violet-700 hover:from-violet-600 hover:to-violet-800 text-white font-bold py-4 px-6 rounded-2xl text-2xl shadow-lg active:shadow-inner"
          >
            ⬆️
          </motion.button>
          <div />
          <motion.button
            whileTap={{ scale: 0.85, backgroundColor: '#7c3aed' }}
            onClick={() => handleControlClick('LEFT')}
            className="bg-gradient-to-b from-violet-500 to-violet-700 hover:from-violet-600 hover:to-violet-800 text-white font-bold py-4 px-6 rounded-2xl text-2xl shadow-lg active:shadow-inner"
          >
            ⬅️
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85, backgroundColor: '#7c3aed' }}
            onClick={() => handleControlClick('DOWN')}
            className="bg-gradient-to-b from-violet-500 to-violet-700 hover:from-violet-600 hover:to-violet-800 text-white font-bold py-4 px-6 rounded-2xl text-2xl shadow-lg active:shadow-inner"
          >
            ⬇️
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85, backgroundColor: '#7c3aed' }}
            onClick={() => handleControlClick('RIGHT')}
            className="bg-gradient-to-b from-violet-500 to-violet-700 hover:from-violet-600 hover:to-violet-800 text-white font-bold py-4 px-6 rounded-2xl text-2xl shadow-lg active:shadow-inner"
          >
            ➡️
          </motion.button>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-center text-sm bg-white/10 px-4 py-2 rounded-full">
          <p>Use Arrow Keys or Buttons to move</p>
          <p className="mt-1">Eat food to grow • Collect power-ups! {Object.values(POWER_UP_EMOJIS).join('')}</p>
        </div>
      </div>

      <GameOverScreen
        show={gameOver}
        score={score}
        highScore={highScore}
        isNewHighScore={score > highScore && score > 0}
        onPlayAgain={resetGame}
      />
    </GameLayout>
  );
}
