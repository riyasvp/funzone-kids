'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const CELL_SIZE = 28;
const ROWS = 15;
const COLS = 19;
const GAME_WIDTH = COLS * CELL_SIZE;
const GAME_HEIGHT = ROWS * CELL_SIZE;

type Position = { row: number; col: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// Maze layout: 1 = wall, 0 = path, 2 = dot, 3 = power pellet
const MAZE_TEMPLATE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// Simplified maze (15 rows x 19 cols)
const MAZE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,1,1,0,1,1,0,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0],
  [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,3,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,3,1],
];

const GHOST_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff8c42'];

export default function GalaxyMaze() {
  const [player, setPlayer] = useState<Position>({ row: 14, col: 9 });
  const [ghosts, setGhosts] = useState<(Position & { color: string; direction: Direction })[]>([
    { row: 7, col: 9, color: GHOST_COLORS[0], direction: 'UP' },
    { row: 7, col: 8, color: GHOST_COLORS[1], direction: 'UP' },
    { row: 7, col: 10, color: GHOST_COLORS[2], direction: 'UP' },
    { row: 7, col: 11, color: GHOST_COLORS[3], direction: 'UP' },
  ]);
  const [maze, setMaze] = useState<number[][]>(MAZE);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [powerMode, setPowerMode] = useState(false);
  const [powerTimer, setPowerTimer] = useState(0);
  const [playerDirection, setPlayerDirection] = useState<Direction>('RIGHT');
  const [ghostScared, setGhostScared] = useState(false);
  
  const directionRef = useRef<Direction>('RIGHT');
  const animationRef = useRef<number>();
  const highScore = getHighScore('galaxy-maze');

  const resetGame = useCallback(() => {
    setPlayer({ row: 14, col: 9 });
    setGhosts([
      { row: 7, col: 9, color: GHOST_COLORS[0], direction: 'UP' },
      { row: 7, col: 8, color: GHOST_COLORS[1], direction: 'UP' },
      { row: 7, col: 10, color: GHOST_COLORS[2], direction: 'UP' },
      { row: 7, col: 11, color: GHOST_COLORS[3], direction: 'UP' },
    ]);
    setMaze(JSON.parse(JSON.stringify(MAZE)));
    setScore(0);
    setLives(3);
    setLevel(1);
    setPowerMode(false);
    setPowerTimer(0);
    setGhostScared(false);
    setIsPlaying(true);
    setGameOver(false);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          directionRef.current = 'UP';
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          directionRef.current = 'DOWN';
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          directionRef.current = 'LEFT';
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          directionRef.current = 'RIGHT';
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  const canMove = useCallback((row: number, col: number): boolean => {
    if (row < 0 || row >= MAZE.length || col < 0 || col >= MAZE[0].length) return false;
    return MAZE[row][col] !== 1;
  }, []);

  // Game loop
  useEffect(() => {
    if (!isPlaying) return;

    const update = () => {
      // Move player
      setPlayer(prev => {
        let newRow = prev.row;
        let newCol = prev.col;
        const dir = directionRef.current;

        if (dir === 'UP' && canMove(prev.row - 1, prev.col)) newRow--;
        else if (dir === 'DOWN' && canMove(prev.row + 1, prev.col)) newRow++;
        else if (dir === 'LEFT' && canMove(prev.row, prev.col - 1)) newCol--;
        else if (dir === 'RIGHT' && canMove(prev.row, prev.col + 1)) newCol++;

        // Tunnel wrap
        if (newCol < 0) newCol = MAZE[0].length - 1;
        if (newCol >= MAZE[0].length) newCol = 0;

        // Collect dots
        if (maze[newRow][newCol] === 2) {
          playSound('score');
          setScore(s => s + 10);
          setMaze(m => {
            const newMaze = [...m];
            newMaze[newRow] = [...newMaze[newRow]];
            newMaze[newRow][newCol] = 0;
            return newMaze;
          });
        } else if (maze[newRow][newCol] === 3) {
          playSound('score');
          setScore(s => s + 50);
          setPowerMode(true);
          setGhostScared(true);
          setPowerTimer(100);
          setMaze(m => {
            const newMaze = [...m];
            newMaze[newRow] = [...newMaze[newRow]];
            newMaze[newRow][newCol] = 0;
            return newMaze;
          });
        }

        setPlayerDirection(dir);
        return { row: newRow, col: newCol };
      });

      // Update power mode
      if (powerMode) {
        setPowerTimer(prev => {
          if (prev <= 1) {
            setPowerMode(false);
            setGhostScared(false);
            return 0;
          }
          return prev - 1;
        });
      }

      // Move ghosts
      setGhosts(prev =>
        prev.map(ghost => {
          const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
          const validDirections = directions.filter(dir => {
            let newRow = ghost.row;
            let newCol = ghost.col;
            if (dir === 'UP') newRow--;
            if (dir === 'DOWN') newRow++;
            if (dir === 'LEFT') newCol--;
            if (dir === 'RIGHT') newCol++;
            return canMove(newRow, newCol);
          });

          if (validDirections.length === 0) return ghost;

          // Simple AI: move towards player or random
          let chosenDir: Direction;
          if (ghostScared) {
            // Run away from player
            chosenDir = validDirections[Math.floor(Math.random() * validDirections.length)];
          } else {
            // Move towards player
            const dr = player.row - ghost.row;
            const dc = player.col - ghost.col;
            
            if (Math.abs(dr) > Math.abs(dc)) {
              chosenDir = dr > 0 ? 'DOWN' : 'UP';
            } else {
              chosenDir = dc > 0 ? 'RIGHT' : 'LEFT';
            }
            
            if (!validDirections.includes(chosenDir)) {
              chosenDir = validDirections[Math.floor(Math.random() * validDirections.length)];
            }
          }

          let newRow = ghost.row;
          let newCol = ghost.col;
          if (chosenDir === 'UP') newRow--;
          if (chosenDir === 'DOWN') newRow++;
          if (chosenDir === 'LEFT') newCol--;
          if (chosenDir === 'RIGHT') newCol++;

          return { ...ghost, row: newRow, col: newCol, direction: chosenDir };
        })
      );

      // Check ghost collision
      setGhosts(prev => {
        let hit = false;
        prev.forEach(ghost => {
          if (ghost.row === player.row && ghost.col === player.col) {
            if (ghostScared) {
              // Eat ghost
              playSound('score');
              setScore(s => s + 200);
              // Reset ghost position
              ghost.row = 7;
              ghost.col = 9;
            } else {
              hit = true;
            }
          }
        });

        if (hit) {
          playSound('lose');
          setLives(prev => {
            if (prev <= 1) {
              setGameOver(true);
              setIsPlaying(false);
              setHighScore('galaxy-maze', score);
              return 0;
            }
            return prev - 1;
          });
          // Reset player position
          setPlayer({ row: 14, col: 9 });
        }

        return prev;
      });

      // Check win condition
      const dotsLeft = maze.flat().filter(cell => cell === 2 || cell === 3).length;
      if (dotsLeft === 0) {
        setLevel(prev => prev + 1);
        setMaze(JSON.parse(JSON.stringify(MAZE)));
        setPlayer({ row: 14, col: 9 });
      }

      animationRef.current = requestAnimationFrame(update);
    };

    const interval = setInterval(update, 150);
    return () => {
      clearInterval(interval);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, maze, player, powerMode, ghostScared, score, canMove]);

  return (
    <GameLayout title="Galaxy Maze" emoji="🌀" score={score} highScore={highScore} lives={lives} level={level}>
      <div className="flex flex-col items-center">
        {/* Power mode indicator */}
        {powerMode && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-3 bg-yellow-400 text-purple-900 px-4 py-2 rounded-full font-bold"
          >
            👻 Ghosts Scared! {Math.ceil(powerTimer / 10)}s
          </motion.div>
        )}

        {/* Game Canvas */}
        <div
          className="relative rounded-2xl overflow-hidden border-4 border-purple-600 shadow-lg"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-indigo-950" />

          {/* Maze */}
          {maze.map((row, rowIndex) =>
            row.map((cell, colIndex) => {
              if (cell === 1) {
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="absolute bg-purple-800 border-2 border-purple-600"
                    style={{
                      left: colIndex * CELL_SIZE,
                      top: rowIndex * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                    }}
                  />
                );
              }
              if (cell === 2) {
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className="absolute bg-yellow-300 rounded-full"
                    style={{
                      left: colIndex * CELL_SIZE + CELL_SIZE / 2 - 2,
                      top: rowIndex * CELL_SIZE + CELL_SIZE / 2 - 2,
                      width: 4,
                      height: 4,
                    }}
                  />
                );
              }
              if (cell === 3) {
                return (
                  <motion.div
                    key={`${rowIndex}-${colIndex}`}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="absolute bg-yellow-400 rounded-full"
                    style={{
                      left: colIndex * CELL_SIZE + CELL_SIZE / 2 - 5,
                      top: rowIndex * CELL_SIZE + CELL_SIZE / 2 - 5,
                      width: 10,
                      height: 10,
                    }}
                  />
                );
              }
              return null;
            })
          )}

          {/* Ghosts */}
          {ghosts.map((ghost, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute"
              style={{
                left: ghost.col * CELL_SIZE + 2,
                top: ghost.row * CELL_SIZE + 2,
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
              }}
            >
              <div
                className="w-full h-full relative"
                style={{
                  backgroundColor: ghostScared ? '#4488ff' : ghost.color,
                  borderRadius: '50% 50% 0 0',
                }}
              >
                {/* Eyes */}
                <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full">
                  <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-black rounded-full" />
                </div>
                <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full">
                  <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-black rounded-full" />
                </div>
              </div>
            </motion.div>
          ))}

          {/* Player */}
          <motion.div
            className="absolute"
            style={{
              left: player.col * CELL_SIZE + 2,
              top: player.row * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
            }}
            animate={{ rotate: [0, 10, 0, -10, 0] }}
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            <div
              className="w-full h-full bg-yellow-400 rounded-full relative"
              style={{
                clipPath: playerDirection === 'RIGHT'
                  ? 'polygon(100% 50%, 70% 20%, 50% 50%, 70% 80%)'
                  : playerDirection === 'LEFT'
                  ? 'polygon(0% 50%, 30% 20%, 50% 50%, 30% 80%)'
                  : playerDirection === 'UP'
                  ? 'polygon(50% 0%, 20% 30%, 50% 50%, 80% 30%)'
                  : 'polygon(50% 100%, 20% 70%, 50% 50%, 80% 70%)',
              }}
            />
          </motion.div>

          {/* Start Screen */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-pulse">🌀</div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={resetGame}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg"
                >
                  🎮 Start Game
                </motion.button>
                <p className="text-white mt-4 text-sm">Use Arrow Keys or WASD to move</p>
                <p className="text-white text-sm">Collect all dots to win!</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-center text-sm">
          <p>🌀 Move: Arrow Keys / WASD</p>
          <p>Collect dots • Power pellets make ghosts scared! 👻</p>
        </div>
      </div>

      <GameOverScreen
        show={gameOver}
        score={score}
        highScore={highScore}
        isNewHighScore={score > highScore && score > 0}
        onPlayAgain={resetGame}
        message="Game Over! 👻"
      />
    </GameLayout>
  );
}
