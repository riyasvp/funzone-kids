'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const GAME_DURATION = 60;

type Problem = {
  question: string;
  answer: number;
  options: number[];
};

const generateProblem = (difficulty: number): Problem => {
  const maxNum = 10 + difficulty * 5;
  const ops = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a: number, b: number, answer: number;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * maxNum) + 1;
      b = Math.floor(Math.random() * maxNum) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * maxNum) + 1;
      b = Math.floor(Math.random() * a) + 1;
      answer = a - b;
      break;
    case '×':
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
      answer = a * b;
      break;
    default:
      a = 1;
      b = 1;
      answer = 2;
  }

  // Generate wrong options
  const options = new Set<number>([answer]);
  while (options.size < 4) {
    const wrong = answer + Math.floor(Math.random() * 20) - 10;
    if (wrong >= 0 && wrong !== answer) {
      options.add(wrong);
    }
  }

  return {
    question: `${a} ${op} ${b} = ?`,
    answer,
    options: Array.from(options).sort(() => Math.random() - 0.5),
  };
};

export default function MathBlast() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const highScore = getHighScore('math-blast');

  const startGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setTimeLeft(GAME_DURATION);
    setStreak(0);
    setIsPlaying(true);
    setGameOver(false);
    setProblem(generateProblem(1));
  }, []);

  // Timer
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsPlaying(false);
          setGameOver(true);
          setHighScore('math-blast', score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, score]);

  const handleAnswer = (selected: number) => {
    if (!problem) return;

    if (selected === problem.answer) {
      playSound('correct');
      const bonus = Math.floor(streak / 3) * 5;
      setScore(prev => prev + 10 + bonus);
      setStreak(prev => prev + 1);
      setFeedback('correct');
    } else {
      playSound('wrong');
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setIsPlaying(false);
          setGameOver(true);
          setHighScore('math-blast', score);
        }
        return newLives;
      });
      setStreak(0);
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      setProblem(generateProblem(Math.floor(score / 50) + 1));
    }, 300);
  };

  return (
    <GameLayout title="Math Blast" emoji="🔢" score={score} highScore={highScore} lives={lives}>
      <div className="flex flex-col items-center">
        {/* Timer & Streak */}
        <div className="flex gap-4 mb-6">
          <motion.div
            key={timeLeft}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`text-2xl font-bold px-4 py-2 rounded-full ${
              timeLeft <= 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-yellow-400 text-purple-900'
            }`}
          >
            ⏱️ {timeLeft}s
          </motion.div>
          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-orange-400 text-white font-bold px-4 py-2 rounded-full text-lg"
            >
              🔥 {streak} streak!
            </motion.div>
          )}
        </div>

        {/* Problem */}
        {problem && isPlaying && (
          <motion.div
            key={problem.question}
            initial={{ scale: 0, y: -20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg mb-6 min-w-[200px] text-center"
          >
            <p className="text-3xl sm:text-4xl font-bold text-purple-600">
              {problem.question}
            </p>
          </motion.div>
        )}

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              className={`absolute font-bold text-4xl ${feedback === 'correct' ? 'text-green-400' : 'text-red-400'}`}
            >
              {feedback === 'correct' ? '✓ Correct!' : '✗ Wrong!'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Answer Options */}
        {problem && isPlaying && (
          <div className="grid grid-cols-2 gap-4">
            {problem.options.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(option)}
                className="w-24 h-16 sm:w-32 sm:h-20 rounded-2xl text-2xl sm:text-3xl font-bold text-white shadow-lg bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700"
              >
                {option}
              </motion.button>
            ))}
          </div>
        )}

        {/* Start Button */}
        {!isPlaying && !gameOver && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={startGame}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full text-xl shadow-lg"
          >
            🎮 Start Game
          </motion.button>
        )}

        {/* Instructions */}
        <div className="mt-6 text-white/80 text-center text-sm">
          <p>Solve math problems as fast as you can!</p>
          <p>Streaks give bonus points! 🔥</p>
        </div>
      </div>

      <GameOverScreen
        show={gameOver}
        score={score}
        highScore={highScore}
        isNewHighScore={score > highScore && score > 0}
        onPlayAgain={startGame}
        message="Time's Up!"
      />
    </GameLayout>
  );
}
