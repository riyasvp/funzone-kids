'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import WinScreen from '@/components/WinScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const GRID_SIZE = 4;

type Grid = number[][];

const getEmptyCells = (grid: Grid): [number, number][] => {
  const empty: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) empty.push([r, c]);
    }
  }
  return empty;
};

const addRandomTile = (grid: Grid): Grid => {
  const empty = getEmptyCells(grid);
  if (empty.length === 0) return grid;

  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const newGrid = grid.map(row => [...row]);
  newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
};

const initGrid = (): Grid => {
  let grid: Grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
};

const rotateGrid = (grid: Grid): Grid => {
  const newGrid: Grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      newGrid[r][c] = grid[GRID_SIZE - 1 - c][r];
    }
  }
  return newGrid;
};

const slideLeft = (grid: Grid): { grid: Grid; score: number } => {
  let score = 0;
  const newGrid = grid.map(row => {
    const filtered = row.filter(cell => cell !== 0);
    const merged: number[] = [];

    for (let i = 0; i < filtered.length; i++) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        merged.push(filtered[i] * 2);
        score += filtered[i] * 2;
        i++;
      } else {
        merged.push(filtered[i]);
      }
    }

    while (merged.length < GRID_SIZE) merged.push(0);
    return merged;
  });

  return { grid: newGrid, score };
};

const moveGrid = (grid: Grid, direction: 'up' | 'down' | 'left' | 'right'): { grid: Grid; score: number } => {
  let currentGrid = grid.map(row => [...row]);
  let rotations = 0;

  switch (direction) {
    case 'up': rotations = 1; break;
    case 'right': rotations = 2; break;
    case 'down': rotations = 3; break;
    default: rotations = 0;
  }

  for (let i = 0; i < rotations; i++) {
    currentGrid = rotateGrid(currentGrid);
  }

  const { grid: slidGrid, score } = slideLeft(currentGrid);
  currentGrid = slidGrid;

  for (let i = 0; i < (4 - rotations) % 4; i++) {
    currentGrid = rotateGrid(currentGrid);
  }

  return { grid: currentGrid, score };
};

const gridsEqual = (a: Grid, b: Grid): boolean => {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
};

const canMove = (grid: Grid): boolean => {
  // Check for empty cells
  if (getEmptyCells(grid).length > 0) return true;

  // Check for possible merges
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (
        (r < GRID_SIZE - 1 && grid[r][c] === grid[r + 1][c]) ||
        (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c + 1])
      ) {
        return true;
      }
    }
  }
  return false;
};

const hasWon = (grid: Grid): boolean => {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 2048) return true;
    }
  }
  return false;
};

const getTileColor = (value: number): string => {
  const colors: { [key: number]: string } = {
    2: 'bg-gray-100 text-gray-700',
    4: 'bg-gray-200 text-gray-700',
    8: 'bg-orange-300 text-white',
    16: 'bg-orange-400 text-white',
    32: 'bg-orange-500 text-white',
    64: 'bg-orange-600 text-white',
    128: 'bg-yellow-400 text-white',
    256: 'bg-yellow-500 text-white',
    512: 'bg-yellow-600 text-white',
    1024: 'bg-yellow-700 text-white',
    2048: 'bg-yellow-500 text-white',
  };
  return colors[value] || 'bg-purple-600 text-white';
};

export default function NumberPuzzle() {
  const [grid, setGrid] = useState<Grid>(initGrid);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [continueAfterWin, setContinueAfterWin] = useState(false);

  const highScore = getHighScore('number-puzzle');

  const initGame = useCallback(() => {
    setGrid(initGrid());
    setScore(0);
    setGameOver(false);
    setWon(false);
    setContinueAfterWin(false);
  }, []);

  const handleMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameOver) return;

    const { grid: newGrid, score: moveScore } = moveGrid(grid, direction);

    if (!gridsEqual(grid, newGrid)) {
      playSound(moveScore > 0 ? 'score' : 'click');
      const gridWithTile = addRandomTile(newGrid);
      setGrid(gridWithTile);
      setScore(prev => prev + moveScore);

      if (!continueAfterWin && hasWon(gridWithTile)) {
        playSound('win');
        setWon(true);
      } else if (!canMove(gridWithTile)) {
        playSound('lose');
        setGameOver(true);
        setHighScore('number-puzzle', score + moveScore);
      }
    }
  }, [grid, gameOver, score, continueAfterWin]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          handleMove('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleMove('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleMove('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleMove('right');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  return (
    <GameLayout title="2048 Puzzle" emoji="🔢" score={score} highScore={highScore}>
      <div className="flex flex-col items-center">
        {/* Controls */}
        <div className="flex gap-2 mb-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleMove('left')}
            className="bg-purple-500 text-white p-3 rounded-xl text-xl"
          >
            ⬅️
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleMove('up')}
            className="bg-purple-500 text-white p-3 rounded-xl text-xl"
          >
            ⬆️
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

        {/* Grid */}
        <div className="bg-purple-700 p-2 rounded-xl">
          <div className="grid grid-cols-4 gap-2">
            {grid.map((row, r) =>
              row.map((cell, c) => (
                <motion.div
                  key={`${r}-${c}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center font-bold text-lg sm:text-xl ${getTileColor(cell)}`}
                >
                  {cell || ''}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* New Game Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={initGame}
          className="mt-4 bg-green-500 text-white font-bold py-2 px-4 rounded-full"
        >
          🔄 New Game
        </motion.button>

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-center text-sm">
          <p>Use Arrow Keys or Buttons to slide tiles</p>
          <p>Merge same numbers to reach 2048!</p>
        </div>
      </div>

      <WinScreen
        show={won && !continueAfterWin}
        score={score}
        message="🎉 You got 2048!"
        isNewHighScore={score > highScore}
        onPlayAgain={() => {
          setContinueAfterWin(true);
          setWon(false);
        }}
      />

      <WinScreen
        show={gameOver}
        score={score}
        message="Game Over!"
        isNewHighScore={score > highScore && score > 0}
        onPlayAgain={initGame}
      />
    </GameLayout>
  );
}
