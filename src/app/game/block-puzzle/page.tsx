'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 25;
const GAME_WIDTH = COLS * BLOCK_SIZE;
const GAME_HEIGHT = ROWS * BLOCK_SIZE;

type Position = { x: number; y: number };
type Block = Position & { color: string };
type Piece = {
  shape: number[][];
  color: string;
  x: number;
  y: number;
};

const COLORS = [
  '#ff6b6b', // Red
  '#4ecdc4', // Teal
  '#ffe66d', // Yellow
  '#95e1d3', // Mint
  '#f38181', // Coral
  '#aa96da', // Purple
  '#fcbad3', // Pink
];

const SHAPES = [
  [[1, 1, 1, 1]], // I
  [
    [1, 1],
    [1, 1],
  ], // O
  [
    [0, 1, 0],
    [1, 1, 1],
  ], // T
  [
    [1, 0, 0],
    [1, 1, 1],
  ], // L
  [
    [0, 0, 1],
    [1, 1, 1],
  ], // J
  [
    [0, 1, 1],
    [1, 1, 0],
  ], // S
  [
    [1, 1, 0],
    [0, 1, 1],
  ], // Z
];

export default function BlockPuzzle() {
  const [board, setBoard] = useState<(string | null)[][]>(
    Array(ROWS).fill(null).map(() => Array(COLS).fill(null))
  );
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [ghostY, setGhostY] = useState(0);
  
  const animationRef = useRef<number>();
  const highScore = getHighScore('block-puzzle');

  const createPiece = useCallback((): Piece => {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    const shape = SHAPES[shapeIndex];
    const color = COLORS[shapeIndex];
    return {
      shape,
      color,
      x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    };
  }, []);

  const resetGame = useCallback(() => {
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setCurrentPiece(createPiece());
    setNextPiece(createPiece());
    setScore(0);
    setLevel(1);
    setLines(0);
    setIsPlaying(true);
    setGameOver(false);
  }, [createPiece]);

  // Calculate ghost position
  useEffect(() => {
    if (!currentPiece) return;
    
    let ghostY = currentPiece.y;
    while (canMove(currentPiece.shape, currentPiece.x, ghostY + 1)) {
      ghostY++;
    }
    setGhostY(ghostY);
  }, [currentPiece, board]);

  const canMove = useCallback((shape: number[][], newX: number, newY: number): boolean => {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const boardX = newX + col;
          const boardY = newY + row;
          
          if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return false;
          if (boardY >= 0 && board[boardY][boardX]) return false;
        }
      }
    }
    return true;
  }, [board]);

  const rotatePiece = useCallback((piece: Piece): Piece => {
    const rotated = piece.shape[0].map((_, i) =>
      piece.shape.map(row => row[i]).reverse()
    );
    return { ...piece, shape: rotated };
  }, []);

  const lockPiece = useCallback(() => {
    if (!currentPiece) return;

    const newBoard = board.map(row => [...row]);
    let pieceY = currentPiece.y;

    // Find the lowest valid position
    while (canMove(currentPiece.shape, currentPiece.x, pieceY + 1)) {
      pieceY++;
    }

    // Lock the piece
    currentPiece.shape.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell) {
          const boardY = pieceY + rowIndex;
          const boardX = currentPiece.x + colIndex;
          if (boardY >= 0) {
            newBoard[boardY][boardX] = currentPiece.color;
          }
        }
      });
    });

    setBoard(newBoard);
    playSound('pop');

    // Check for completed lines
    let clearedLines = 0;
    for (let row = ROWS - 1; row >= 0; row--) {
      if (newBoard[row].every(cell => cell !== null)) {
        newBoard.splice(row, 1);
        newBoard.unshift(Array(COLS).fill(null));
        clearedLines++;
        row++; // Check the same row again
      }
    }

    if (clearedLines > 0) {
      playSound('score');
      const points = [0, 100, 300, 500, 800][clearedLines] * level;
      setScore(prev => prev + points);
      setLines(prev => prev + clearedLines);
      setLevel(prev => Math.floor(prev + clearedLines / 5));
    }

    // Spawn new piece
    const newPiece = nextPiece || createPiece();
    setCurrentPiece(newPiece);
    setNextPiece(createPiece());

    // Check game over
    if (!canMove(newPiece.shape, newPiece.x, newPiece.y)) {
      setGameOver(true);
      setIsPlaying(false);
      setHighScore('block-puzzle', score);
    }
  }, [currentPiece, nextPiece, board, score, level, canMove, createPiece]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || !currentPiece) return;

    const update = () => {
      setCurrentPiece(prev => {
        if (!prev) return null;
        
        if (canMove(prev.shape, prev.x, prev.y + 1)) {
          return { ...prev, y: prev.y + 1 };
        } else {
          lockPiece();
          return prev;
        }
      });
    };

    const speed = Math.max(100, 1000 - level * 50);
    const interval = setInterval(update, speed);
    return () => clearInterval(interval);
  }, [isPlaying, currentPiece, level, canMove, lockPiece]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || !currentPiece) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (canMove(currentPiece.shape, currentPiece.x - 1, currentPiece.y)) {
            setCurrentPiece({ ...currentPiece, x: currentPiece.x - 1 });
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (canMove(currentPiece.shape, currentPiece.x + 1, currentPiece.y)) {
            setCurrentPiece({ ...currentPiece, x: currentPiece.x + 1 });
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (canMove(currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
            setCurrentPiece({ ...currentPiece, y: currentPiece.y + 1 });
            setScore(prev => prev + 1);
          }
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          const rotated = rotatePiece(currentPiece);
          if (canMove(rotated.shape, rotated.x, rotated.y)) {
            setCurrentPiece(rotated);
          }
          break;
        case ' ':
          e.preventDefault();
          // Hard drop
          let newY = currentPiece.y;
          while (canMove(currentPiece.shape, currentPiece.x, newY + 1)) {
            newY++;
          }
          setCurrentPiece({ ...currentPiece, y: newY });
          setScore(prev => prev + (newY - currentPiece.y) * 2);
          lockPiece();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentPiece, canMove, rotatePiece, lockPiece]);

  return (
    <GameLayout title="Block Puzzle" emoji="🧱" score={score} highScore={highScore} level={level}>
      <div className="flex flex-col items-center">
        {/* Next piece preview */}
        <div className="mb-3 flex items-center gap-4 text-white">
          <span>Next:</span>
          <div
            className="relative bg-gray-800 rounded"
            style={{ width: 100, height: 60 }}
          >
            {nextPiece && (
              <div className="absolute inset-0 flex items-center justify-center">
                {nextPiece.shape.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex">
                    {row.map((cell, colIndex) => (
                      cell ? (
                        <div
                          key={colIndex}
                          className="m-0.5 rounded-sm"
                          style={{
                            backgroundColor: nextPiece.color,
                            width: 15,
                            height: 15,
                            boxShadow: 'inset 0 0 5px rgba(0,0,0,0.3)',
                          }}
                        />
                      ) : (
                        <div key={colIndex} style={{ width: 15, height: 15 }} />
                      )
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Game Canvas */}
        <div
          className="relative rounded-2xl overflow-hidden border-4 border-purple-500 shadow-lg"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-gray-900" />

          {/* Grid lines */}
          {Array.from({ length: COLS }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute bg-gray-700"
              style={{
                left: i * BLOCK_SIZE,
                top: 0,
                width: 1,
                height: GAME_HEIGHT,
              }}
            />
          ))}
          {Array.from({ length: ROWS }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute bg-gray-700"
              style={{
                left: 0,
                top: i * BLOCK_SIZE,
                width: GAME_WIDTH,
                height: 1,
              }}
            />
          ))}

          {/* Locked blocks */}
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) =>
              cell ? (
                <motion.div
                  key={`${rowIndex}-${colIndex}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute rounded-sm"
                  style={{
                    left: colIndex * BLOCK_SIZE + 1,
                    top: rowIndex * BLOCK_SIZE + 1,
                    width: BLOCK_SIZE - 2,
                    height: BLOCK_SIZE - 2,
                    backgroundColor: cell,
                    boxShadow: 'inset 0 0 8px rgba(0,0,0,0.4)',
                  }}
                />
              ) : null
            )
          )}

          {/* Ghost piece */}
          {currentPiece && (
            <div className="absolute opacity-30">
              {currentPiece.shape.map((row, rowIndex) =>
                row.map((cell, colIndex) =>
                  cell ? (
                    <div
                      key={`ghost-${rowIndex}-${colIndex}`}
                      className="absolute rounded-sm border-2 border-dashed"
                      style={{
                        left: (currentPiece.x + colIndex) * BLOCK_SIZE + 1,
                        top: (ghostY + rowIndex) * BLOCK_SIZE + 1,
                        width: BLOCK_SIZE - 2,
                        height: BLOCK_SIZE - 2,
                        borderColor: currentPiece.color,
                      }}
                    />
                  ) : null
                )
              )}
            </div>
          )}

          {/* Current piece */}
          {currentPiece && (
            <div className="absolute">
              {currentPiece.shape.map((row, rowIndex) =>
                row.map((cell, colIndex) =>
                  cell ? (
                    <motion.div
                      key={`piece-${rowIndex}-${colIndex}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute rounded-sm"
                      style={{
                        left: (currentPiece.x + colIndex) * BLOCK_SIZE + 1,
                        top: (currentPiece.y + rowIndex) * BLOCK_SIZE + 1,
                        width: BLOCK_SIZE - 2,
                        height: BLOCK_SIZE - 2,
                        backgroundColor: currentPiece.color,
                        boxShadow: 'inset 0 0 8px rgba(0,0,0,0.4)',
                      }}
                    />
                  ) : null
                )
              )}
            </div>
          )}

          {/* Start Screen */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-pulse">🧱</div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={resetGame}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg"
                >
                  🎮 Start Game
                </motion.button>
                <p className="text-white mt-4 text-sm">← → Move | ↑ Rotate | ↓ Soft Drop</p>
                <p className="text-white text-sm">SPACE = Hard Drop</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-center text-sm">
          <p>← → Move | ↑ Rotate | ↓ Soft Drop | SPACE Hard Drop</p>
          <p>Clear lines to score points!</p>
        </div>
      </div>

      <GameOverScreen
        show={gameOver}
        score={score}
        highScore={highScore}
        isNewHighScore={score > highScore && score > 0}
        onPlayAgain={resetGame}
        message="Blocks piled up! 🧱"
      />
    </GameLayout>
  );
}
