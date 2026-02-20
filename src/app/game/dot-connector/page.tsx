'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import WinScreen from '@/components/WinScreen';
import { playSound } from '@/lib/sounds';

const GRID_SIZE = 4; // 4x4 = 16 dots, 9 boxes
const BOX_SIZE = 60;

type Box = {
  owner: 'player' | 'ai' | null;
};

function createInitialBoxes(): Box[][] {
  return Array(GRID_SIZE - 1).fill(null).map(() =>
    Array(GRID_SIZE - 1).fill(null).map(() => ({ owner: null }))
  );
}

function createInitialLines(): { h: boolean[][]; v: boolean[][] } {
  const h: boolean[][] = [];
  const v: boolean[][] = [];

  // Horizontal lines: GRID_SIZE rows, GRID_SIZE-1 columns
  for (let r = 0; r < GRID_SIZE; r++) {
    h.push(Array(GRID_SIZE - 1).fill(false));
  }

  // Vertical lines: GRID_SIZE-1 rows, GRID_SIZE columns
  for (let r = 0; r < GRID_SIZE - 1; r++) {
    v.push(Array(GRID_SIZE).fill(false));
  }

  return { h, v };
}

export default function DotConnector() {
  const [hLines, setHLines] = useState<boolean[][]>([]);
  const [vLines, setVLines] = useState<boolean[][]>([]);
  const [hOwners, setHOwners] = useState<('player' | 'ai')[][]>([]);
  const [vOwners, setVOwners] = useState<('player' | 'ai')[][]>([]);
  const [boxes, setBoxes] = useState<Box[][]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const initGame = useCallback(() => {
    const { h, v } = createInitialLines();
    setHLines(h);
    setVLines(v);
    setHOwners(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE - 1).fill(null)));
    setVOwners(Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE).fill(null)));
    setBoxes(createInitialBoxes());
    setIsPlayerTurn(true);
    setScores({ player: 0, ai: 0 });
    setGameOver(false);
    setIsPlaying(true);
  }, []);

  const checkBoxes = useCallback((
    newH: boolean[][],
    newV: boolean[][],
    newBoxes: Box[][],
    player: 'player' | 'ai'
  ): { boxes: Box[][]; completed: number } => {
    let completed = 0;
    const updatedBoxes = newBoxes.map(row => row.map(box => ({ ...box })));

    for (let r = 0; r < GRID_SIZE - 1; r++) {
      for (let c = 0; c < GRID_SIZE - 1; c++) {
        if (updatedBoxes[r][c].owner !== null) continue;

        const top = newH[r][c];
        const bottom = newH[r + 1][c];
        const left = newV[r][c];
        const right = newV[r][c + 1];

        if (top && bottom && left && right) {
          updatedBoxes[r][c] = { owner: player };
          completed++;
        }
      }
    }

    return { boxes: updatedBoxes, completed };
  }, []);

  const makeMove = useCallback((
    type: 'h' | 'v',
    row: number,
    col: number,
    player: 'player' | 'ai'
  ) => {
    if (!isPlaying || gameOver) return;
    if (player === 'ai' ? isPlayerTurn : !isPlayerTurn) return;

    // Check if already taken
    if (type === 'h' && hLines[row]?.[col]) return;
    if (type === 'v' && vLines[row]?.[col]) return;

    const newH = hLines.map(r => [...r]);
    const newV = vLines.map(r => [...r]);
    const newHO = hOwners.map(r => [...r]);
    const newVO = vOwners.map(r => [...r]);

    if (type === 'h') {
      newH[row][col] = true;
      newHO[row][col] = player;
    } else {
      newV[row][col] = true;
      newVO[row][col] = player;
    }

    const { boxes: updatedBoxes, completed } = checkBoxes(newH, newV, boxes, player);

    setHLines(newH);
    setVLines(newV);
    setHOwners(newHO);
    setVOwners(newVO);
    setBoxes(updatedBoxes);

    if (completed > 0) {
      playSound('score');
      setScores(prev => ({
        ...prev,
        [player]: prev[player] + completed
      }));
    } else {
      playSound('click');
    }

    // Check game over
    const totalLines = (GRID_SIZE * (GRID_SIZE - 1)) * 2;
    const takenLines = newH.flat().filter(Boolean).length + newV.flat().filter(Boolean).length;

    if (takenLines === totalLines) {
      setGameOver(true);
      setIsPlaying(false);
    } else if (completed === 0) {
      setIsPlayerTurn(player === 'ai');
    }
  }, [isPlaying, gameOver, isPlayerTurn, hLines, vLines, hOwners, vOwners, boxes, checkBoxes]);

  // AI Move
  const makeAIMove = useCallback(() => {
    if (isPlayerTurn || !isPlaying || gameOver) return;

    const available: { type: 'h' | 'v'; row: number; col: number }[] = [];

    // Find available horizontal lines
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 1; c++) {
        if (!hLines[r]?.[c]) {
          available.push({ type: 'h', row: r, col: c });
        }
      }
    }

    // Find available vertical lines
    for (let r = 0; r < GRID_SIZE - 1; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!vLines[r]?.[c]) {
          available.push({ type: 'v', row: r, col: c });
        }
      }
    }

    if (available.length === 0) return;

    // AI tries to complete a box first
    let chosen = available[Math.floor(Math.random() * available.length)];

    for (const move of available) {
      const testH = hLines.map(r => [...r]);
      const testV = vLines.map(r => [...r]);

      if (move.type === 'h') {
        testH[move.row][move.col] = true;
      } else {
        testV[move.row][move.col] = true;
      }

      const { completed } = checkBoxes(testH, testV, boxes, 'ai');
      if (completed > 0) {
        chosen = move;
        break;
      }
    }

    setTimeout(() => makeMove(chosen.type, chosen.row, chosen.col, 'ai'), 500);
  }, [isPlayerTurn, isPlaying, gameOver, hLines, vLines, boxes, checkBoxes, makeMove]);

  // Trigger AI move
  useEffect(() => {
    if (!isPlayerTurn && isPlaying && !gameOver) {
      makeAIMove();
    }
  }, [isPlayerTurn, isPlaying, gameOver, makeAIMove]);

  const handleLineClick = (type: 'h' | 'v', row: number, col: number) => {
    if (!isPlayerTurn || !isPlaying || gameOver) return;
    makeMove(type, row, col, 'player');
  };

  return (
    <GameLayout title="Dot Connector" emoji="🔵" score={scores.player} showScore={false}>
      <div className="flex flex-col items-center">
        {/* Score */}
        <div className="flex gap-4 mb-4">
          <div className={`px-4 py-2 rounded-full font-bold ${isPlayerTurn ? 'bg-blue-500 text-white' : 'bg-blue-200 text-blue-800'}`}>
            👤 You: {scores.player}
          </div>
          <div className={`px-4 py-2 rounded-full font-bold ${!isPlayerTurn ? 'bg-red-500 text-white' : 'bg-red-200 text-red-800'}`}>
            🤖 AI: {scores.ai}
          </div>
        </div>

        {/* Game Board */}
        <div className="relative bg-purple-100 rounded-xl p-4" style={{ width: GRID_SIZE * BOX_SIZE + 20, height: GRID_SIZE * BOX_SIZE + 20 }}>
          {/* Boxes */}
          {boxes.map((row, r) =>
            row.map((box, c) => (
              <div
                key={`box-${r}-${c}`}
                className={`absolute rounded-lg transition-colors ${
                  box.owner === 'player' ? 'bg-blue-400' :
                  box.owner === 'ai' ? 'bg-red-400' :
                  'bg-transparent'
                }`}
                style={{
                  left: c * BOX_SIZE + 15,
                  top: r * BOX_SIZE + 15,
                  width: BOX_SIZE - 10,
                  height: BOX_SIZE - 10,
                }}
              />
            ))
          )}

          {/* Dots */}
          {[...Array(GRID_SIZE)].map((_, r) =>
            [...Array(GRID_SIZE)].map((_, c) => (
              <div
                key={`dot-${r}-${c}`}
                className="absolute w-4 h-4 bg-purple-600 rounded-full shadow-md"
                style={{
                  left: r * BOX_SIZE + 8,
                  top: c * BOX_SIZE + 8,
                }}
              />
            ))
          )}

          {/* Horizontal Lines */}
          {hLines.map((row, r) =>
            row.map((taken, c) => (
              <motion.button
                key={`h-${r}-${c}`}
                onClick={() => handleLineClick('h', r, c)}
                whileHover={{ scale: 1.05 }}
                className={`absolute h-3 rounded-full cursor-pointer transition-colors ${
                  hOwners[r]?.[c] === 'player' ? 'bg-blue-500' :
                  hOwners[r]?.[c] === 'ai' ? 'bg-red-500' :
                  'bg-gray-300 hover:bg-purple-400'
                }`}
                style={{
                  left: c * BOX_SIZE + 22,
                  top: r * BOX_SIZE + 5,
                  width: BOX_SIZE - 14,
                }}
                disabled={!isPlaying || !isPlayerTurn || !!taken || gameOver}
              />
            ))
          )}

          {/* Vertical Lines */}
          {vLines.map((row, r) =>
            row.map((taken, c) => (
              <motion.button
                key={`v-${r}-${c}`}
                onClick={() => handleLineClick('v', r, c)}
                whileHover={{ scale: 1.05 }}
                className={`absolute w-3 rounded-full cursor-pointer transition-colors ${
                  vOwners[r]?.[c] === 'player' ? 'bg-blue-500' :
                  vOwners[r]?.[c] === 'ai' ? 'bg-red-500' :
                  'bg-gray-300 hover:bg-purple-400'
                }`}
                style={{
                  left: c * BOX_SIZE + 5,
                  top: r * BOX_SIZE + 22,
                  height: BOX_SIZE - 14,
                }}
                disabled={!isPlaying || !isPlayerTurn || !!taken || gameOver}
              />
            ))
          )}
        </div>

        {/* Start/Restart Button */}
        {!isPlaying && !gameOver && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={initGame}
            className="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-xl shadow-lg"
          >
            🎮 Start Game
          </motion.button>
        )}

        {gameOver && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={initGame}
            className="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-xl shadow-lg"
          >
            🔄 Play Again
          </motion.button>
        )}

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-center text-sm">
          <p>Click lines to connect dots and make boxes!</p>
          <p>Complete a box = +1 point. Most boxes wins!</p>
        </div>
      </div>

      <WinScreen
        show={gameOver && scores.player > scores.ai}
        score={scores.player}
        message="You Win!"
        onPlayAgain={initGame}
      />

      <WinScreen
        show={gameOver && scores.player <= scores.ai}
        score={scores.player}
        message={scores.player === scores.ai ? "It's a Draw!" : "AI Wins!"}
        onPlayAgain={initGame}
      />
    </GameLayout>
  );
}
