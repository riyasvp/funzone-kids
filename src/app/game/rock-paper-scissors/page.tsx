'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import WinScreen from '@/components/WinScreen';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';

type Choice = 'rock' | 'paper' | 'scissors';

const CHOICES: { name: Choice; emoji: string }[] = [
  { name: 'rock', emoji: '🪨' },
  { name: 'paper', emoji: '📄' },
  { name: 'scissors', emoji: '✂️' },
];

const getWinner = (player: Choice, computer: Choice): 'win' | 'lose' | 'draw' => {
  if (player === computer) return 'draw';
  if (
    (player === 'rock' && computer === 'scissors') ||
    (player === 'paper' && computer === 'rock') ||
    (player === 'scissors' && computer === 'paper')
  ) {
    return 'win';
  }
  return 'lose';
};

export default function RockPaperScissors() {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [score, setScore] = useState({ wins: 0, losses: 0, draws: 0 });
  const [round, setRound] = useState(1);
  const [gameEnded, setGameEnded] = useState(false);

  const handleChoice = useCallback((choice: Choice) => {
    if (isRevealing) return;

    playSound('click');
    setPlayerChoice(choice);
    setIsRevealing(true);

    // Computer chooses after a delay
    setTimeout(() => {
      const computerRandom = CHOICES[Math.floor(Math.random() * 3)].name;
      setComputerChoice(computerRandom);

      const gameResult = getWinner(choice, computerRandom);
      setResult(gameResult);

      if (gameResult === 'win') {
        playSound('win');
        setScore(prev => ({ ...prev, wins: prev.wins + 1 }));
      } else if (gameResult === 'lose') {
        playSound('lose');
        setScore(prev => ({ ...prev, losses: prev.losses + 1 }));
      } else {
        playSound('click');
        setScore(prev => ({ ...prev, draws: prev.draws + 1 }));
      }

      setTimeout(() => {
        if (round >= 5) {
          setGameEnded(true);
        } else {
          setRound(prev => prev + 1);
          setPlayerChoice(null);
          setComputerChoice(null);
          setResult(null);
          setIsRevealing(false);
        }
      }, 1500);
    }, 800);
  }, [isRevealing, round]);

  const resetGame = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
    setIsRevealing(false);
    setScore({ wins: 0, losses: 0, draws: 0 });
    setRound(1);
    setGameEnded(false);
  };

  const playerWon = score.wins > score.losses;

  return (
    <GameLayout title="Rock Paper Scissors" emoji="✂️" score={score.wins} showScore={false}>
      <div className="flex flex-col items-center">
        {/* Round & Score */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <div className="bg-purple-500 text-white px-4 py-2 rounded-full font-bold">
            Round {round}/5
          </div>
          <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold">
            Wins: {score.wins}
          </div>
          <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold">
            Losses: {score.losses}
          </div>
        </div>

        {/* Battle Arena */}
        <div className="flex items-center justify-center gap-8 mb-8">
          {/* Player */}
          <div className="text-center">
            <p className="text-white mb-2 font-bold">You</p>
            <motion.div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/20 flex items-center justify-center text-5xl"
              animate={{ scale: playerChoice ? 1.1 : 1 }}
            >
              {playerChoice ? CHOICES.find(c => c.name === playerChoice)?.emoji : '❓'}
            </motion.div>
          </div>

          {/* VS */}
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="text-3xl font-bold text-yellow-400"
          >
            VS
          </motion.div>

          {/* Computer */}
          <div className="text-center">
            <p className="text-white mb-2 font-bold">Computer</p>
            <motion.div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/20 flex items-center justify-center text-5xl"
              animate={{
                rotate: isRevealing && !computerChoice ? [0, -10, 10, -10, 10, 0] : 0,
              }}
              transition={{ duration: 0.5 }}
            >
              {computerChoice ? CHOICES.find(c => c.name === computerChoice)?.emoji : isRevealing ? '🤔' : '❓'}
            </motion.div>
          </div>
        </div>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={`text-3xl font-bold mb-6 px-6 py-2 rounded-full ${
                result === 'win' ? 'bg-green-500 text-white' :
                result === 'lose' ? 'bg-red-500 text-white' :
                'bg-yellow-400 text-purple-900'
              }`}
            >
              {result === 'win' ? '🎉 You Win!' : result === 'lose' ? '💀 You Lose!' : "🤝 It's a Draw!"}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Choice Buttons */}
        {!gameEnded && (
          <div className="flex gap-4">
            {CHOICES.map(choice => (
              <motion.button
                key={choice.name}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleChoice(choice.name)}
                disabled={isRevealing}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white shadow-lg flex items-center justify-center text-4xl sm:text-5xl
                  ${isRevealing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
              >
                {choice.emoji}
              </motion.button>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-white/80 text-center text-sm">
          <p>🪨 beats ✂️ • ✂️ beats 📄 • 📄 beats 🪨</p>
          <p>Best of 5 rounds!</p>
        </div>
      </div>

      <WinScreen
        show={gameEnded && playerWon}
        score={score.wins}
        message="You Won the Match!"
        onPlayAgain={resetGame}
      />

      <GameOverScreen
        show={gameEnded && !playerWon && score.wins !== score.losses}
        score={score.wins}
        message="Computer Wins!"
        onPlayAgain={resetGame}
      />

      {(gameEnded && score.wins === score.losses) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl p-8 text-center"
          >
            <div className="text-5xl mb-4">🤝</div>
            <h2 className="text-3xl font-bold text-white mb-4">It&apos;s a Draw!</h2>
            <p className="text-white mb-6">{score.wins} - {score.losses}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetGame}
              className="bg-green-500 text-white font-bold py-3 px-6 rounded-full"
            >
              🔄 Play Again
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </GameLayout>
  );
}
