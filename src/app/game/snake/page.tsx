'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const GRID_SIZE = 20;
const CELL_SIZE = 15;
const INITIAL_SPEED = 150;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };
type PowerUpType = 'speed' | 'shield' | 'double' | 'shrink';

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

const FOOD_EMOJIS = ['🍎', '🍓', '🍇', '🍊', '🍒', '🥝', '🍑', '🍉'];

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
  const directionRef = useRef(direction);
  const scoreRef = useRef(score);

  const highScore = getHighScore('snake');

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
    // 20% chance to spawn a power-up
    if (Math.random() > 0.2) return null;
    
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
      expiresAt: Date.now() + 5000, // 5 seconds to collect
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
    setIsPlaying(true);
  }, []);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    const currentDir = directionRef.current;
    switch (e.key) {
      case 'ArrowUp':
        if (currentDir !== 'DOWN') {
          setDirection('UP');
          directionRef.current = 'UP';
        }
        break;
      case 'ArrowDown':
        if (currentDir !== 'UP') {
          setDirection('DOWN');
          directionRef.current = 'DOWN';
        }
        break;
      case 'ArrowLeft':
        if (currentDir !== 'RIGHT') {
          setDirection('LEFT');
          directionRef.current = 'LEFT';
        }
        break;
      case 'ArrowRight':
        if (currentDir !== 'LEFT') {
          setDirection('RIGHT');
          directionRef.current = 'RIGHT';
        }
        break;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

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

        // Check wall collision (unless shield is active)
        if (activePowerUp !== 'shield' && (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE)) {
          playSound('lose');
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

        // Check self collision
        if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
          playSound('lose');
          setGameOver(true);
          setIsPlaying(false);
          setHighScore('snake', scoreRef.current);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
          playSound('score');
          const points = activePowerUp === 'double' ? 2 : 1;
          setScore(prev => {
            const newScore = prev + points;
            scoreRef.current = newScore;
            if (newScore % 5 === 0) {
              setSpeed(s => Math.max(50, s - 10));
            }
            return newScore;
          });
          setFood(generateFood(newSnake));
          setFoodEmoji(FOOD_EMOJIS[Math.floor(Math.random() * FOOD_EMOJIS.length)]);
          
          // Spawn power-up occasionally
          const newPowerUp = generatePowerUp(newSnake);
          if (newPowerUp) setPowerUp(newPowerUp);
        } else {
          newSnake.pop();
        }

        // Check power-up collision
        if (powerUp && head.x === powerUp.position.x && head.y === powerUp.position.y) {
          playSound('score');
          setActivePowerUp(powerUp.type);
          setPowerUpTimer(5); // 5 seconds
          setPowerUp(null);
        }

        return newSnake;
      });
    };

    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [isPlaying, gameOver, food, speed, generateFood, score, powerUp, activePowerUp, generatePowerUp]);

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
        {/* Power-up indicator */}
        {activePowerUp && (
          <motion.div
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            className="mb-3 flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full text-white"
          >
            <span className="text-xl">{POWER_UP_EMOJIS[activePowerUp]}</span>
            <span className="font-bold capitalize">{activePowerUp}</span>
            <span className="text-yellow-300">{powerUpTimer}s</span>
          </motion.div>
        )}

        {/* Game Canvas */}
        <div
          className={`rounded-lg border-4 shadow-lg ${
            activePowerUp === 'shield' ? 'bg-blue-900 border-blue-500' : 'bg-green-800 border-green-600'
          }`}
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
            position: 'relative',
          }}
        >
          {/* Snake */}
          {snake.map((segment, index) => (
            <motion.div
              key={index}
              initial={false}
              animate={{
                x: segment.x * CELL_SIZE,
                y: segment.y * CELL_SIZE,
              }}
              transition={{ duration: 0.05 }}
              className={`absolute rounded-sm ${
                index === 0 
                  ? activePowerUp === 'shield' ? 'bg-blue-300' : 'bg-green-400'
                  : activePowerUp === 'shield' ? 'bg-blue-400' : 'bg-green-500'
              }`}
              style={{
                width: CELL_SIZE - 1,
                height: CELL_SIZE - 1,
              }}
            />
          ))}

          {/* Food */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="absolute text-center"
            style={{
              width: CELL_SIZE,
              height: CELL_SIZE,
              left: food.x * CELL_SIZE,
              top: food.y * CELL_SIZE,
              fontSize: CELL_SIZE - 2,
              lineHeight: `${CELL_SIZE}px`,
            }}
          >
            {foodEmoji}
          </motion.div>

          {/* Power-up */}
          <AnimatePresence>
            {powerUp && (
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                exit={{ scale: 0 }}
                className="absolute text-center"
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  left: powerUp.position.x * CELL_SIZE,
                  top: powerUp.position.y * CELL_SIZE,
                  fontSize: CELL_SIZE - 2,
                  lineHeight: `${CELL_SIZE}px`,
                }}
              >
                {POWER_UP_EMOJIS[powerUp.type]}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Start Screen */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={resetGame}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-xl shadow-lg"
              >
                🎮 Start Game
              </motion.button>
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          <div />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleControlClick('UP')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-xl text-2xl shadow-lg active:scale-95"
          >
            ⬆️
          </motion.button>
          <div />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleControlClick('LEFT')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-xl text-2xl shadow-lg active:scale-95"
          >
            ⬅️
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleControlClick('DOWN')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-xl text-2xl shadow-lg active:scale-95"
          >
            ⬇️
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleControlClick('RIGHT')}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-6 rounded-xl text-2xl shadow-lg active:scale-95"
          >
            ➡️
          </motion.button>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-center text-sm">
          <p>Use Arrow Keys or Buttons to move</p>
          <p>Eat food to grow • Collect power-ups! ⚡🛡️✨📉</p>
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
