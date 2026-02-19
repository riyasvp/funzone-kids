'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import WinScreen from '@/components/WinScreen';
import { playSound } from '@/lib/sounds';

const GRID_SIZE = 5; // 5x5 dots = 4x4 boxes
const BOX_SIZE = 60;

type Line = {
  row: number;
  col: number;
  horizontal: boolean;
  owner: 'player' | 'ai' | null;
};

export default function DotConnector() {
  const [horizontalLines, setHorizontalLines] = useState<Line[]>([]);
  const [verticalLines, setVerticalLines] = useState<Line[]>([]);
  const [boxes, setBoxes] = useState<{ owner: 'player' | 'ai' | null }[][]>(
    Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE - 1).fill(null))
  );
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const initGame = () => {
    // Initialize lines
    const hLines: Line[] = [];
    const vLines: Line[] = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE - 1; c++) {
        hLines.push({ row: r, col: c, horizontal: true, owner: null });
      }
    }

    for (let r = 0; r < GRID_SIZE - 1; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        vLines.push({ row: r, col: c, horizontal: false, owner: null });
      }
    }

    setHorizontalLines(hLines);
    setVerticalLines(vLines);
    setBoxes(Array(GRID_SIZE - 1).fill(null).map(() => Array(GRID_SIZE - 1).fill(null)));
    setIsPlayerTurn(true);
    setScores({ player: 0, ai: 0 });
    setGameOver(false);
    setIsPlaying(true);
  };

  const checkForBox = useCallback((
    hLines: Line[],
    vLines: Line[],
    player: 'player' | 'ai'
  ): { newBoxes: { owner: 'player' | 'ai' | null }[][]; scored: boolean } => {
    const newBoxes: { owner: 'player' | 'ai' | null }[][] = Array(GRID_SIZE - 1)
      .fill(null)
      .map(() => Array(GRID_SIZE - 1).fill(null));

    let scored = false;

    for (let r = 0; r < GRID_SIZE - 1; r++) {
      for (let c = 0; c < GRID_SIZE - 1; c++) {
        const top = hLines.find(l => l.row === r && l.col === c && l.horizontal);
        const bottom = hLines.find(l => l.row === r + 1 && l.col === c && l.horizontal);
        const left = vLines.find(l => l.row === r && l.col === c && !l.horizontal);
        const right = vLines.find(l => l.row === r && l.col === c + 1 && !l.horizontal);

        if (top?.owner && bottom?.owner && left?.owner && right?.owner) {
          newBoxes[r][c] = { owner: player };
          scored = true;
        }
      }
    }

    return { newBoxes, scored };
  }, []);

  const makeMove = useCallback((line: Line, player: 'player' | 'ai') => {
    if (line.owner) return false;

    if (line.horizontal) {
      setHorizontalLines(prev => {
        const updated = prev.map(l =>
          l.row === line.row && l.col === line.col ? { ...l, owner: player } : l
        );
        setVerticalLines(vLines => {
          const { newBoxes, scored } = checkForBox(updated, vLines, player);
          setBoxes(newBoxes);

          if (scored) {
            playSound('score');
            setScores(prev => ({
              ...prev,
              [player]: prev[player] + 1,
            }));
          } else {
            setIsPlayerTurn(player === 'ai');
          }

          // Check game over
          const allTaken = updated.every(l => l.owner) && vLines.every(l => l.owner);
          if (allTaken) {
            setGameOver(true);
            setIsPlaying(false);
          }

          return vLines;
        });
        return updated;
      });
    } else {
      setVerticalLines(prev => {
        const updated = prev.map(l =>
          l.row === line.row && l.col === line.col ? { ...l, owner: player } : l
        );
        setHorizontalLines(hLines => {
          const { newBoxes, scored } = checkForBox(hLines, updated, player);
          setBoxes(newBoxes);

          if (scored) {
            playSound('score');
            setScores(prev => ({
              ...prev,
              [player]: prev[player] + 1,
            }));
          } else {
            setIsPlayerTurn(player === 'ai');
          }

          const allTaken = hLines.every(l => l.owner) && updated.every(l => l.owner);
          if (allTaken) {
            setGameOver(true);
            setIsPlaying(false);
          }

          return hLines;
        });
        return updated;
      });
    }

    return true;
  }, [checkForBox]);

  // AI Move
  const makeAIMove = useCallback(() => {
    // Simple AI: pick random available line
    const availableH = horizontalLines.filter(l => !l.owner);
    const availableV = verticalLines.filter(l => !l.owner);
    const allAvailable = [...availableH, ...availableV];

    if (allAvailable.length === 0) return;

    const randomLine = allAvailable[Math.floor(Math.random() * allAvailable.length)];
    setTimeout(() => {
      playSound('click');
      makeMove(randomLine, 'ai');
    }, 500);
  }, [horizontalLines, verticalLines, makeMove]);

  // Trigger AI move
  const handlePlayerMove = (line: Line) => {
    if (!isPlayerTurn || line.owner) return;
    playSound('click');
    const moved = makeMove(line, 'player');
    if (moved && !isPlayerTurn) {
      // AI's turn
    }
  };

  // Check if AI should move
  const canAIMove = !isPlayerTurn && isPlaying && !gameOver;
  useEffect(() => {
    if (canAIMove) {
      makeAIMove();
    }
  }, [canAIMove, makeAIMove]);

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
        <div className="relative" style={{ width: GRID_SIZE * BOX_SIZE, height: GRID_SIZE * BOX_SIZE }}>
          {/* Boxes */}
          {boxes.map((row, r) =>
            row.map((box, c) => (
              <div
                key={`${r}-${c}`}
                className={`absolute rounded-lg ${
                  box.owner === 'player' ? 'bg-blue-300' :
                  box.owner === 'ai' ? 'bg-red-300' :
                  'bg-transparent'
                }`}
                style={{
                  left: c * BOX_SIZE + 10,
                  top: r * BOX_SIZE + 10,
                  width: BOX_SIZE - 20,
                  height: BOX_SIZE - 20,
                }}
              />
            ))
          )}

          {/* Dots */}
          {[...Array(GRID_SIZE)].map((_, r) =>
            [...Array(GRID_SIZE)].map((_, c) => (
              <div
                key={`dot-${r}-${c}`}
                className="absolute w-4 h-4 bg-purple-600 rounded-full"
                style={{
                  left: r * BOX_SIZE - 8,
                  top: c * BOX_SIZE - 8,
                }}
              />
            ))
          )}

          {/* Horizontal Lines */}
          {horizontalLines.map((line, idx) => (
            <motion.button
              key={`h-${idx}`}
              onClick={() => handlePlayerMove(line)}
              whileHover={{ scale: 1.1 }}
              className={`absolute h-2 rounded-full cursor-pointer ${
                line.owner === 'player' ? 'bg-blue-500' :
                line.owner === 'ai' ? 'bg-red-500' :
                'bg-gray-300 hover:bg-purple-400'
              }`}
              style={{
                left: line.col * BOX_SIZE + 8,
                top: line.row * BOX_SIZE - 4,
                width: BOX_SIZE - 16,
              }}
              disabled={!isPlaying || !isPlayerTurn || !!line.owner}
            />
          ))}

          {/* Vertical Lines */}
          {verticalLines.map((line, idx) => (
            <motion.button
              key={`v-${idx}`}
              onClick={() => handlePlayerMove(line)}
              whileHover={{ scale: 1.1 }}
              className={`absolute w-2 rounded-full cursor-pointer ${
                line.owner === 'player' ? 'bg-blue-500' :
                line.owner === 'ai' ? 'bg-red-500' :
                'bg-gray-300 hover:bg-purple-400'
              }`}
              style={{
                left: line.col * BOX_SIZE - 4,
                top: line.row * BOX_SIZE + 8,
                height: BOX_SIZE - 16,
              }}
              disabled={!isPlaying || !isPlayerTurn || !!line.owner}
            />
          ))}
        </div>

        {/* Start Button */}
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
