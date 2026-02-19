'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import WinScreen from '@/components/WinScreen';
import { playSound, playWinFanfare } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 450;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const BALL_SIZE = 10;
const BRICK_ROWS = 5;
const BRICK_COLS = 8;
const BRICK_WIDTH = 35;
const BRICK_HEIGHT = 15;
const BRICK_PADDING = 4;

const BRICK_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

type Ball = { x: number; y: number; dx: number; dy: number };
type Brick = { x: number; y: number; color: string; alive: boolean; hasPowerUp?: boolean };

export default function BrickBreaker() {
  const [paddleX, setPaddleX] = useState(CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [bricks, setBricks] = useState<Brick[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [paddleWidth, setPaddleWidth] = useState(PADDLE_WIDTH);
  const gameRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const gameStateRef = useRef({ balls, paddleX, bricks, lives, score, paddleWidth });

  const highScore = getHighScore('brick-breaker');

  // Keep refs updated
  useEffect(() => {
    gameStateRef.current = { balls, paddleX, bricks, lives, score, paddleWidth };
  }, [balls, paddleX, bricks, lives, score, paddleWidth]);

  const initGame = useCallback(() => {
    // Initialize bricks
    const newBricks: Brick[] = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          x: col * (BRICK_WIDTH + BRICK_PADDING) + 10,
          y: row * (BRICK_HEIGHT + BRICK_PADDING) + 40,
          color: BRICK_COLORS[row],
          alive: true,
          hasPowerUp: Math.random() < 0.1,
        });
      }
    }
    setBricks(newBricks);

    // Initialize ball
    setBalls([{
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 60,
      dx: 3,
      dy: -3,
    }]);

    setPaddleX(CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2);
    setPaddleWidth(PADDLE_WIDTH);
    setScore(0);
    setLives(3);
    setIsPlaying(true);
    setGameOver(false);
    setGameWon(false);
  }, []);

  // Mouse/touch controls
  const handleMove = useCallback((clientX: number) => {
    if (!isPlaying || !gameRef.current) return;
    const rect = gameRef.current.getBoundingClientRect();
    const x = clientX - rect.left - gameStateRef.current.paddleWidth / 2;
    setPaddleX(Math.max(0, Math.min(CANVAS_WIDTH - gameStateRef.current.paddleWidth, x)));
  }, [isPlaying]);

  // Game loop
  useEffect(() => {
    if (!isPlaying) return;

    const update = () => {
      const state = gameStateRef.current;
      let newBalls = [...state.balls];
      let newBricks = [...state.bricks];
      let newScore = state.score;
      let newLives = state.lives;
      let newPaddleWidth = state.paddleWidth;

      for (let i = 0; i < newBalls.length; i++) {
        let ball = { ...newBalls[i] };
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Wall collision
        if (ball.x <= 0 || ball.x >= CANVAS_WIDTH - BALL_SIZE) {
          ball.dx *= -1;
          playSound('click');
        }
        if (ball.y <= 0) {
          ball.dy *= -1;
          playSound('click');
        }

        // Paddle collision
        if (
          ball.y + BALL_SIZE >= CANVAS_HEIGHT - PADDLE_HEIGHT - 10 &&
          ball.y <= CANVAS_HEIGHT - 10 &&
          ball.x >= state.paddleX &&
          ball.x <= state.paddleX + newPaddleWidth
        ) {
          ball.dy = -Math.abs(ball.dy);
          // Adjust angle based on where ball hits paddle
          const hitPos = (ball.x - state.paddleX) / newPaddleWidth;
          ball.dx = (hitPos - 0.5) * 8;
          playSound('click');
        }

        // Brick collision
        for (let j = 0; j < newBricks.length; j++) {
          const brick = newBricks[j];
          if (!brick.alive) continue;

          if (
            ball.x + BALL_SIZE > brick.x &&
            ball.x < brick.x + BRICK_WIDTH &&
            ball.y + BALL_SIZE > brick.y &&
            ball.y < brick.y + BRICK_HEIGHT
          ) {
            brick.alive = false;
            ball.dy *= -1;
            newScore += 10;
            playSound('pop');

            // Power-up
            if (brick.hasPowerUp) {
              const powerUp = Math.floor(Math.random() * 2);
              if (powerUp === 0) {
                // Wider paddle
                newPaddleWidth = Math.min(150, newPaddleWidth + 20);
                playSound('bonus');
              } else {
                // Multi-ball
                newBalls.push({
                  x: ball.x,
                  y: ball.y,
                  dx: -ball.dx,
                  dy: ball.dy,
                });
                playSound('bonus');
              }
            }
          }
        }

        newBalls[i] = ball;

        // Ball lost
        if (ball.y > CANVAS_HEIGHT) {
          newBalls.splice(i, 1);
          i--;
        }
      }

      // Check if all balls lost
      if (newBalls.length === 0) {
        newLives--;
        if (newLives <= 0) {
          setIsPlaying(false);
          setGameOver(true);
          setHighScore('brick-breaker', newScore);
        } else {
          // Reset ball
          newBalls = [{
            x: CANVAS_WIDTH / 2,
            y: CANVAS_HEIGHT - 60,
            dx: 3,
            dy: -3,
          }];
          playSound('lose');
        }
      }

      // Check win
      if (newBricks.every(b => !b.alive)) {
        setIsPlaying(false);
        setGameWon(true);
        playWinFanfare();
        setHighScore('brick-breaker', newScore);
      }

      setBalls(newBalls);
      setBricks(newBricks);
      setScore(newScore);
      setLives(newLives);
      setPaddleWidth(newPaddleWidth);

      animationRef.current = requestAnimationFrame(update);
    };

    animationRef.current = requestAnimationFrame(update);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  return (
    <GameLayout title="Brick Breaker" emoji="🧱" score={score} highScore={highScore} lives={lives}>
      <div className="flex flex-col items-center">
        {/* Game Canvas */}
        <div
          ref={gameRef}
          className="relative rounded-2xl overflow-hidden border-4 border-purple-600 shadow-lg bg-gradient-to-b from-indigo-900 to-purple-800"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
          onMouseMove={(e) => handleMove(e.clientX)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        >
          {/* Bricks */}
          {bricks.map((brick, index) =>
            brick.alive && (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute rounded-sm"
                style={{
                  left: brick.x,
                  top: brick.y,
                  width: BRICK_WIDTH,
                  height: BRICK_HEIGHT,
                  backgroundColor: brick.color,
                  boxShadow: brick.hasPowerUp ? '0 0 10px gold' : undefined,
                }}
              />
            )
          )}

          {/* Balls */}
          {balls.map((ball, index) => (
            <div
              key={index}
              className="absolute rounded-full bg-white shadow-lg"
              style={{
                left: ball.x,
                top: ball.y,
                width: BALL_SIZE,
                height: BALL_SIZE,
              }}
            />
          ))}

          {/* Paddle */}
          <motion.div
            className="absolute bottom-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg"
            style={{
              left: paddleX,
              width: paddleWidth,
              height: PADDLE_HEIGHT,
            }}
          />

          {/* Start Screen */}
          {!isPlaying && !gameOver && !gameWon && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={initGame}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-xl shadow-lg"
              >
                🎮 Start Game
              </motion.button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-center text-sm">
          <p>Move mouse/finger to control paddle</p>
          <p>Break all bricks to win! ⭐ = Power-up</p>
        </div>
      </div>

      <GameOverScreen
        show={gameOver}
        score={score}
        highScore={highScore}
        isNewHighScore={score > highScore && score > 0}
        onPlayAgain={initGame}
      />

      <WinScreen
        show={gameWon}
        score={score}
        isNewHighScore={score > highScore && score > 0}
        onPlayAgain={initGame}
        message="You Win!"
      />
    </GameLayout>
  );
}
