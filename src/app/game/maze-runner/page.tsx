'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import WinScreen from '@/components/WinScreen';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const CELL_SIZE = 25;

type Cell = {
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
};

const generateMaze = (width: number, height: number): Cell[][] => {
  // Initialize grid
  const grid: Cell[][] = Array(height).fill(null).map(() =>
    Array(width).fill(null).map(() => ({
      walls: { top: true, right: true, bottom: true, left: true },
      visited: false,
    }))
  );

  // DFS maze generation
  const stack: [number, number][] = [];
  const startX = 0;
  const startY = 0;

  grid[startY][startX].visited = true;
  stack.push([startX, startY]);

  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1];
    const neighbors: [number, number, string][] = [];

    // Check neighbors
    if (cy > 0 && !grid[cy - 1][cx].visited) neighbors.push([cx, cy - 1, 'top']);
    if (cx < width - 1 && !grid[cy][cx + 1].visited) neighbors.push([cx + 1, cy, 'right']);
    if (cy < height - 1 && !grid[cy + 1][cx].visited) neighbors.push([cx, cy + 1, 'bottom']);
    if (cx > 0 && !grid[cy][cx - 1].visited) neighbors.push([cx - 1, cy, 'left']);

    if (neighbors.length > 0) {
      const [nx, ny, direction] = neighbors[Math.floor(Math.random() * neighbors.length)];

      // Remove walls
      switch (direction) {
        case 'top':
          grid[cy][cx].walls.top = false;
          grid[ny][nx].walls.bottom = false;
          break;
        case 'right':
          grid[cy][cx].walls.right = false;
          grid[ny][nx].walls.left = false;
          break;
        case 'bottom':
          grid[cy][cx].walls.bottom = false;
          grid[ny][nx].walls.top = false;
          break;
        case 'left':
          grid[cy][cx].walls.left = false;
          grid[ny][nx].walls.right = false;
          break;
      }

      grid[ny][nx].visited = true;
      stack.push([nx, ny]);
    } else {
      stack.pop();
    }
  }

  return grid;
};

const DIFFICULTIES = [
  { name: 'Easy', width: 8, height: 6 },
  { name: 'Medium', width: 12, height: 8 },
  { name: 'Hard', width: 16, height: 10 },
  { name: 'Expert', width: 20, height: 12 },
  { name: 'Master', width: 24, height: 14 },
];

export default function MazeRunner() {
  const [difficulty, setDifficulty] = useState(0);
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [level, setLevel] = useState(1);

  const highScore = getHighScore('maze-runner');

  const initGame = useCallback((diffIndex: number, currentLevel: number) => {
    const diff = DIFFICULTIES[diffIndex];
    const newMaze = generateMaze(diff.width, diff.height);
    setMaze(newMaze);
    setPlayerPos({ x: 0, y: 0 });
    setTimer(0);
    setDifficulty(diffIndex);
    setLevel(currentLevel);
    setIsPlaying(true);
    setGameWon(false);
  }, []);

  // Timer
  useEffect(() => {
    if (!isPlaying || gameWon) return;
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isPlaying, gameWon]);

  // Keyboard controls
  useEffect(() => {
    if (!isPlaying || gameWon) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const { x, y } = playerPos;
      const cell = maze[y]?.[x];
      if (!cell) return;

      let newX = x;
      let newY = y;
      let moved = false;

      switch (e.key) {
        case 'ArrowUp':
          if (!cell.walls.top) { newY = y - 1; moved = true; }
          break;
        case 'ArrowDown':
          if (!cell.walls.bottom) { newY = y + 1; moved = true; }
          break;
        case 'ArrowLeft':
          if (!cell.walls.left) { newX = x - 1; moved = true; }
          break;
        case 'ArrowRight':
          if (!cell.walls.right) { newX = x + 1; moved = true; }
          break;
      }

      if (moved && maze[newY]?.[newX] !== undefined) {
        playSound('click');
        setPlayerPos({ x: newX, y: newY });

        // Check win
        const diff = DIFFICULTIES[difficulty];
        if (newX === diff.width - 1 && newY === diff.height - 1) {
          playSound('win');
          setGameWon(true);
          setIsPlaying(false);
          setHighScore('maze-runner', Math.max(1000 - timer, 0));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, gameWon, playerPos, maze, difficulty, timer]);

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!isPlaying || gameWon) return;

    const { x, y } = playerPos;
    const cell = maze[y]?.[x];
    if (!cell) return;

    let newX = x;
    let newY = y;

    if (direction === 'up' && !cell.walls.top) newY = y - 1;
    else if (direction === 'down' && !cell.walls.bottom) newY = y + 1;
    else if (direction === 'left' && !cell.walls.left) newX = x - 1;
    else if (direction === 'right' && !cell.walls.right) newX = x + 1;
    else return;

    if (maze[newY]?.[newX] !== undefined) {
      playSound('click');
      setPlayerPos({ x: newX, y: newY });

      const diff = DIFFICULTIES[difficulty];
      if (newX === diff.width - 1 && newY === diff.height - 1) {
        playSound('win');
        setGameWon(true);
        setIsPlaying(false);
      }
    }
  };

  const diff = DIFFICULTIES[difficulty];
  const timeBonus = Math.max(1000 - timer * 5, 0);

  return (
    <GameLayout title="Maze Runner" emoji="🌀" score={timeBonus} highScore={highScore}>
      <div className="flex flex-col items-center">
        {/* Difficulty Selection */}
        {!isPlaying && !gameWon && (
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">Level {level}</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => initGame(Math.min(level - 1, DIFFICULTIES.length - 1), level)}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-xl shadow-lg"
            >
              🎮 Start Level {level}
            </motion.button>
          </div>
        )}

        {/* Timer */}
        {isPlaying && (
          <div className="mb-4 bg-white/20 text-white px-4 py-2 rounded-full font-bold">
            ⏱️ {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
          </div>
        )}

        {/* Maze */}
        {isPlaying && maze.length > 0 && (
          <div
            className="relative bg-white rounded-lg overflow-hidden"
            style={{
              width: diff.width * CELL_SIZE,
              height: diff.height * CELL_SIZE,
            }}
          >
            {/* Draw cells */}
            {maze.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${x}-${y}`}
                  className="absolute"
                  style={{
                    left: x * CELL_SIZE,
                    top: y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    borderTop: cell.walls.top ? '2px solid #6B21A8' : 'none',
                    borderRight: cell.walls.right ? '2px solid #6B21A8' : 'none',
                    borderBottom: cell.walls.bottom ? '2px solid #6B21A8' : 'none',
                    borderLeft: cell.walls.left ? '2px solid #6B21A8' : 'none',
                  }}
                />
              ))
            )}

            {/* Exit */}
            <div
              className="absolute text-xl flex items-center justify-center"
              style={{
                left: (diff.width - 1) * CELL_SIZE,
                top: (diff.height - 1) * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
            >
              🚪
            </div>

            {/* Player */}
            <motion.div
              className="absolute text-xl flex items-center justify-center"
              style={{
                left: playerPos.x * CELL_SIZE,
                top: playerPos.y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              😊
            </motion.div>
          </div>
        )}

        {/* Mobile Controls */}
        {isPlaying && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleMove('up')}
              className="bg-purple-500 text-white p-3 rounded-xl text-xl"
            >
              ⬆️
            </motion.button>
            <div />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleMove('left')}
              className="bg-purple-500 text-white p-3 rounded-xl text-xl"
            >
              ⬅️
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleMove('down')}
              className="bg-purple-500 text-white p-3 rounded-xl text-xl"
            >
              ⬇️
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => handleMove('right')}
              className="bg-purple-500 text-white p-3 rounded-xl text-xl"
            >
              ➡️
            </motion.button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-center text-sm">
          <p>Use Arrow Keys or Buttons to navigate</p>
          <p>Find the exit 🚪 as fast as you can!</p>
        </div>
      </div>

      <WinScreen
        show={gameWon}
        score={timeBonus}
        isNewHighScore={timeBonus > highScore}
        message={`Level ${level} Complete!`}
        onPlayAgain={() => {
          if (level < 5) {
            initGame(level, level + 1);
          } else {
            initGame(0, 1);
          }
        }}
      />
    </GameLayout>
  );
}
