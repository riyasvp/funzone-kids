'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import WinScreen from '@/components/WinScreen';
import { playSound } from '@/lib/sounds';

type Player = 'X' | 'O' | null;
type Board = Player[];

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6], // Diagonals
];

export default function TicTacToe() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState<'X' | 'O' | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [stats, setStats] = useState({ wins: 0, draws: 0, losses: 0 });
  const [showWin, setShowWin] = useState(false);

  const checkWinner = useCallback((b: Board): { winner: 'X' | 'O' | 'draw' | null; line: number[] } => {
    for (const line of WINNING_LINES) {
      const [a, bb, c] = line;
      if (b[a] && b[a] === b[bb] && b[a] === b[c]) {
        return { winner: b[a], line };
      }
    }
    if (b.every(cell => cell !== null)) {
      return { winner: 'draw', line: [] };
    }
    return { winner: null, line: [] };
  }, []);

  const makeComputerMove = useCallback((currentBoard: Board) => {
    // Simple AI: Try to win, block, or random
    const emptySpots = currentBoard.map((cell, idx) => cell === null ? idx : -1).filter(i => i !== -1);

    if (emptySpots.length === 0) return currentBoard;

    // Try to win
    for (const spot of emptySpots) {
      const testBoard = [...currentBoard];
      testBoard[spot] = 'O';
      if (checkWinner(testBoard).winner === 'O') {
        return testBoard;
      }
    }

    // Try to block
    for (const spot of emptySpots) {
      const testBoard = [...currentBoard];
      testBoard[spot] = 'X';
      if (checkWinner(testBoard).winner === 'X') {
        const newBoard = [...currentBoard];
        newBoard[spot] = 'O';
        return newBoard;
      }
    }

    // Random move
    const randomSpot = emptySpots[Math.floor(Math.random() * emptySpots.length)];
    const newBoard = [...currentBoard];
    newBoard[randomSpot] = 'O';
    return newBoard;
  }, [checkWinner]);

  const handleCellClick = (index: number) => {
    if (board[index] || winner || !isPlayerTurn) return;

    playSound('click');
    const newBoard = [...board];
    newBoard[index] = 'X';
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result.winner) {
      setWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === 'X') {
        playSound('win');
        setStats(s => ({ ...s, wins: s.wins + 1 }));
      } else if (result.winner === 'draw') {
        setStats(s => ({ ...s, draws: s.draws + 1 }));
      }
      setShowWin(true);
      return;
    }

    setIsPlayerTurn(false);

    // Computer's turn
    setTimeout(() => {
      playSound('click');
      const computerBoard = makeComputerMove(newBoard);
      setBoard(computerBoard);

      const computerResult = checkWinner(computerBoard);
      if (computerResult.winner) {
        setWinner(computerResult.winner);
        setWinningLine(computerResult.line);
        if (computerResult.winner === 'O') {
          playSound('lose');
          setStats(s => ({ ...s, losses: s.losses + 1 }));
        } else if (computerResult.winner === 'draw') {
          setStats(s => ({ ...s, draws: s.draws + 1 }));
        }
        setShowWin(true);
      } else {
        setIsPlayerTurn(true);
      }
    }, 500);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setWinner(null);
    setWinningLine([]);
    setIsPlayerTurn(true);
    setShowWin(false);
  };

  return (
    <GameLayout title="Tic-Tac-Toe" emoji="❌" score={stats.wins} showScore={false}>
      <div className="flex flex-col items-center">
        {/* Stats */}
        <div className="flex gap-4 mb-6 text-white">
          <div className="bg-green-500 px-4 py-2 rounded-full font-bold">Wins: {stats.wins}</div>
          <div className="bg-yellow-500 text-purple-900 px-4 py-2 rounded-full font-bold">Draws: {stats.draws}</div>
          <div className="bg-red-500 px-4 py-2 rounded-full font-bold">Losses: {stats.losses}</div>
        </div>

        {/* Turn indicator */}
        <div className="mb-4 text-xl text-white font-bold">
          {winner ? (
            winner === 'draw' ? "It's a Draw!" :
            winner === 'X' ? '🎉 You Win!' : '💀 Computer Wins!'
          ) : (
            isPlayerTurn ? "Your Turn (X)" : "Computer's Turn (O)"
          )}
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-3 gap-2 bg-purple-800 p-2 rounded-2xl">
          {board.map((cell, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: cell ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCellClick(index)}
              className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl text-4xl sm:text-5xl font-bold flex items-center justify-center
                ${winningLine.includes(index)
                  ? 'bg-yellow-400 text-purple-900'
                  : 'bg-white/90 hover:bg-white'
                } shadow-lg transition-colors`}
            >
              <AnimatePresence mode="wait">
                {cell && (
                  <motion.span
                    key={cell}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className={cell === 'X' ? 'text-blue-500' : 'text-red-500'}
                  >
                    {cell}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>

        {/* Play Again Button */}
        {winner && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetGame}
            className="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-xl shadow-lg"
          >
            🔄 Play Again
          </motion.button>
        )}

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-center text-sm">
          <p>You are X, Computer is O</p>
          <p>Click any empty cell to play!</p>
        </div>
      </div>

      <WinScreen
        show={showWin && winner === 'X'}
        score={stats.wins}
        message="You Win!"
        onPlayAgain={() => { resetGame(); setShowWin(false); }}
      />
    </GameLayout>
  );
}
