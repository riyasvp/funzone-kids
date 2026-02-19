'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
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

export default function FlappyBird() {
  const [birdY, setBirdY] = useState(GAME_HEIGHT / 2);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const animationRef = useRef<number>();
  const gameStateRef = useRef({ birdY, birdVelocity, pipes, score });

  const highScore = getHighScore('flappy-bird');

  useEffect(() => {
    gameStateRef.current = { birdY, birdVelocity, pipes, score };
  }, [birdY, birdVelocity, pipes, score]);

  const startGame = useCallback(() => {
    setBirdY(GAME_HEIGHT / 2);
    setBirdVelocity(0);
    setPipes([]);
    setScore(0);
    setIsPlaying(true);
    setGameOver(false);
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
      }

      // Move pipes
      setPipes(prev =>
        prev
          .map(pipe => ({ ...pipe, x: pipe.x - 3 }))
          .filter(pipe => pipe.x > -PIPE_WIDTH)
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

      animationRef.current = requestAnimationFrame(update);
    };

    animationRef.current = requestAnimationFrame(update);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  return (
    <GameLayout title="Flappy Bird" emoji="🐦" score={score} highScore={highScore}>
      <div className="flex flex-col items-center">
        {/* Game Canvas */}
        <div
          className="relative rounded-2xl overflow-hidden border-4 border-sky-400 shadow-lg cursor-pointer"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          onClick={jump}
          onTouchStart={jump}
        >
          {/* Sky Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-sky-200" />

          {/* Clouds */}
          <div className="absolute top-8 left-10 text-4xl opacity-60">☁️</div>
          <div className="absolute top-16 right-12 text-3xl opacity-60">☁️</div>

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
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-green-600" />

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
          <p>Don&apos;t hit the pipes or ground!</p>
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
