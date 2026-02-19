'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const GAME_WIDTH = 600;
const GAME_HEIGHT = 300;
const GROUND_HEIGHT = 40;
const DINO_SIZE = 40;
const GRAVITY = 0.8;
const JUMP_FORCE = -14;

type Obstacle = {
  x: number;
  type: 'cactus' | 'bird';
  width: number;
  height: number;
};

export default function DinoJump() {
  const [dinoY, setDinoY] = useState(0);
  const [dinoVelocity, setDinoVelocity] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(6);
  const [isNight, setIsNight] = useState(false);
  const animationRef = useRef<number>();
  const gameStateRef = useRef({ dinoY, obstacles, score, speed, isJumping });

  const highScore = getHighScore('dino-jump');

  useEffect(() => {
    gameStateRef.current = { dinoY, obstacles, score, speed, isJumping };
  }, [dinoY, obstacles, score, speed, isJumping]);

  const startGame = useCallback(() => {
    setDinoY(0);
    setDinoVelocity(0);
    setIsJumping(false);
    setObstacles([]);
    setScore(0);
    setSpeed(6);
    setIsPlaying(true);
    setGameOver(false);
    setIsNight(false);
  }, []);

  const jump = useCallback(() => {
    if (!isPlaying || gameOver) return;
    if (!gameStateRef.current.isJumping) {
      setDinoVelocity(JUMP_FORCE);
      setIsJumping(true);
      playSound('jump');
    }
  }, [isPlaying, gameOver]);

  // Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (!isPlaying && !gameOver) {
          startGame();
        } else {
          jump();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameOver, jump, startGame]);

  // Game loop
  useEffect(() => {
    if (!isPlaying) return;

    let frameCount = 0;

    const update = () => {
      const state = gameStateRef.current;
      frameCount++;

      // Update dino physics
      let newY = state.dinoY;
      let newVelocity = dinoVelocity + GRAVITY;
      newY += newVelocity;

      if (newY >= 0) {
        newY = 0;
        newVelocity = 0;
        setIsJumping(false);
      }

      setDinoY(newY);
      setDinoVelocity(newVelocity);

      // Spawn obstacles
      if (frameCount % Math.max(60, 120 - Math.floor(state.score / 50)) === 0) {
        const type = Math.random() > 0.7 ? 'bird' : 'cactus';
        const newObstacle: Obstacle = {
          x: GAME_WIDTH,
          type,
          width: type === 'cactus' ? 25 : 35,
          height: type === 'cactus' ? 50 : 30,
        };
        setObstacles(prev => [...prev, newObstacle]);
      }

      // Move obstacles
      setObstacles(prev =>
        prev
          .map(obs => ({ ...obs, x: obs.x - state.speed }))
          .filter(obs => obs.x > -50)
      );

      // Check collision
      const dinoRect = {
        x: 60,
        y: GAME_HEIGHT - GROUND_HEIGHT - DINO_SIZE - newY,
        width: DINO_SIZE,
        height: DINO_SIZE,
      };

      for (const obs of state.obstacles) {
        const obsRect = {
          x: obs.x,
          y: obs.type === 'bird' ? GAME_HEIGHT - GROUND_HEIGHT - 80 : GAME_HEIGHT - GROUND_HEIGHT - obs.height,
          width: obs.width,
          height: obs.height,
        };

        if (
          dinoRect.x < obsRect.x + obsRect.width &&
          dinoRect.x + dinoRect.width > obsRect.x &&
          dinoRect.y < obsRect.y + obsRect.height &&
          dinoRect.y + dinoRect.height > obsRect.y
        ) {
          playSound('lose');
          setIsPlaying(false);
          setGameOver(true);
          setHighScore('dino-jump', state.score);
          return;
        }
      }

      // Update score
      setScore(prev => {
        const newScore = prev + 1;
        if (newScore % 100 === 0) {
          setSpeed(s => Math.min(15, s + 0.5));
        }
        if (newScore === 500) {
          setIsNight(true);
        }
        return newScore;
      });

      animationRef.current = requestAnimationFrame(update);
    };

    animationRef.current = requestAnimationFrame(update);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, dinoVelocity]);

  return (
    <GameLayout title="Dino Jump" emoji="🦕" score={score} highScore={highScore}>
      <div className="flex flex-col items-center">
        {/* Game Canvas */}
        <div
          className="relative rounded-2xl overflow-hidden border-4 border-gray-600 shadow-lg cursor-pointer"
          style={{
            width: '100%',
            maxWidth: GAME_WIDTH,
            height: GAME_HEIGHT,
            background: isNight
              ? 'linear-gradient(to bottom, #1a1a2e, #16213e)'
              : 'linear-gradient(to bottom, #87CEEB, #E0F7FA)',
          }}
          onClick={jump}
          onTouchStart={jump}
        >
          {/* Clouds */}
          {!isNight && (
            <>
              <div className="absolute top-8 left-10 text-4xl opacity-70">☁️</div>
              <div className="absolute top-12 right-20 text-3xl opacity-70">☁️</div>
            </>
          )}

          {/* Stars (night) */}
          {isNight && (
            <>
              <div className="absolute top-4 left-8 text-xl">⭐</div>
              <div className="absolute top-8 left-24 text-sm">⭐</div>
              <div className="absolute top-6 right-16 text-lg">⭐</div>
              <div className="absolute top-12 right-8 text-xl">🌙</div>
            </>
          )}

          {/* Ground */}
          <div
            className="absolute bottom-0 left-0 right-0"
            style={{
              height: GROUND_HEIGHT,
              background: isNight ? '#2d4a22' : '#8B4513',
            }}
          />

          {/* Dino */}
          <motion.div
            className="absolute text-4xl"
            style={{
              left: 60,
              bottom: GROUND_HEIGHT + DINO_SIZE / 2 - dinoY,
            }}
            animate={{ scaleX: [1, 1.1, 1] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            🦕
          </motion.div>

          {/* Obstacles */}
          {obstacles.map((obs, index) => (
            <div
              key={index}
              className="absolute text-3xl"
              style={{
                left: obs.x,
                bottom: obs.type === 'bird' ? 100 : GROUND_HEIGHT,
              }}
            >
              {obs.type === 'cactus' ? '🌵' : '🦅'}
            </div>
          ))}

          {/* Start Screen */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🦕</div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); startGame(); }}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-xl shadow-lg"
                >
                  🎮 Start Game
                </motion.button>
                <p className="text-white mt-4 text-sm">Press SPACE or tap to jump!</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-center text-sm">
          <p>Press SPACE or tap to jump!</p>
          <p>Speed increases over time. Night mode at 500+!</p>
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
