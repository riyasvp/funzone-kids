'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const WORDS = [
  'apple', 'banana', 'cat', 'dog', 'elephant', 'fish', 'grape', 'horse',
  'ice', 'jelly', 'kite', 'lion', 'monkey', 'nest', 'orange', 'pizza',
  'queen', 'rabbit', 'sun', 'tiger', 'umbrella', 'violin', 'water', 'xylophone',
  'yellow', 'zebra', 'bird', 'cake', 'duck', 'egg', 'frog', 'goat',
  'hat', 'igloo', 'juice', 'king', 'leaf', 'moon', 'nut', 'owl',
  'pig', 'rose', 'star', 'tree', 'unicorn', 'van', 'whale', 'box', 'yarn', 'zoo'
];

const WORDS_PER_GAME = 10;
const TIME_PER_WORD = 30;

const scrambleWord = (word: string): string => {
  const letters = word.split('');
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters.join('');
};

export default function WordScramble() {
  const [currentWord, setCurrentWord] = useState('');
  const [scrambled, setScrambled] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_WORD);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [wordsPlayed, setWordsPlayed] = useState<string[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const highScore = getHighScore('word-scramble');

  const getNextWord = useCallback((played: string[]) => {
    const available = WORDS.filter(w => !played.includes(w));
    if (available.length === 0) return WORDS[Math.floor(Math.random() * WORDS.length)];
    return available[Math.floor(Math.random() * available.length)];
  }, []);

  const goToNextWord = useCallback((currentIdx: number, newWordsPlayed: string[], currentStreak: number, currentScore: number, currentHintUsed: boolean) => {
    if (currentIdx >= WORDS_PER_GAME) {
      setIsPlaying(false);
      setGameOver(true);
      setHighScore('word-scramble', currentScore);
      return;
    }

    const word = getNextWord(newWordsPlayed);
    setCurrentWord(word);
    setScrambled(scrambleWord(word));
    setWordsPlayed([...newWordsPlayed, word]);
    setWordIndex(currentIdx + 1);
    setTimeLeft(TIME_PER_WORD);
    setUserInput('');
    setHintUsed(false);
    setStreak(currentStreak);
    setScore(currentScore);
  }, [getNextWord]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          playSound('lose');
          return TIME_PER_WORD;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleTimeout = useCallback(() => {
    setWordIndex(currentIdx => {
      setScore(currentScore => {
        setWordsPlayed(played => {
          setStreak(currentStreak => {
            goToNextWord(currentIdx, played, currentStreak, currentScore, false);
            return 0;
          });
          return played;
        });
        return currentScore;
      });
      return currentIdx;
    });
  }, [goToNextWord]);

  const startGame = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const firstWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setCurrentWord(firstWord);
    setScrambled(scrambleWord(firstWord));
    setScore(0);
    setStreak(0);
    setWordIndex(1);
    setTimeLeft(TIME_PER_WORD);
    setIsPlaying(true);
    setGameOver(false);
    setHintUsed(false);
    setWordsPlayed([firstWord]);
    setUserInput('');

    startTimer();
  }, [startTimer]);

  const handleInputChange = useCallback((value: string) => {
    setUserInput(value);

    if (value.toLowerCase() === currentWord.toLowerCase() && isPlaying) {
      playSound('correct');
      if (timerRef.current) clearInterval(timerRef.current);

      const bonus = streak >= 3 ? 5 : 0;
      const hintPenalty = hintUsed ? 5 : 0;
      const newScore = score + 10 + bonus - hintPenalty;
      const newStreak = streak + 1;
      const newWordsPlayed = [...wordsPlayed];

      setTimeout(() => {
        if (wordIndex >= WORDS_PER_GAME) {
          setIsPlaying(false);
          setGameOver(true);
          setHighScore('word-scramble', newScore);
        } else {
          goToNextWord(wordIndex, newWordsPlayed, newStreak, newScore, false);
          startTimer();
        }
      }, 500);
    }
  }, [currentWord, isPlaying, streak, hintUsed, score, wordsPlayed, wordIndex, goToNextWord, startTimer]);

  const handleHint = () => {
    if (hintUsed) return;
    setHintUsed(true);
    playSound('click');
  };

  return (
    <GameLayout title="Word Scramble" emoji="🔤" score={score} highScore={highScore}>
      <div className="flex flex-col items-center">
        {/* Progress */}
        <div className="flex gap-4 mb-4">
          <div className="bg-purple-500 text-white px-4 py-2 rounded-full font-bold">
            Word {wordIndex}/{WORDS_PER_GAME}
          </div>
          <motion.div
            key={timeLeft}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`px-4 py-2 rounded-full font-bold ${
              timeLeft <= 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-yellow-400 text-purple-900'
            }`}
          >
            ⏱️ {timeLeft}s
          </motion.div>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-4 bg-orange-400 text-white font-bold px-4 py-2 rounded-full"
          >
            🔥 {streak} streak!
          </motion.div>
        )}

        {/* Scrambled Word */}
        {isPlaying && (
          <motion.div
            key={scrambled}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-2xl p-6 shadow-lg mb-6"
          >
            <p className="text-3xl sm:text-4xl font-bold text-purple-600 tracking-widest uppercase">
              {scrambled}
            </p>
            {hintUsed && (
              <p className="text-sm text-gray-500 mt-2">
                Hint: First letter is &quot;{currentWord[0].toUpperCase()}&quot;
              </p>
            )}
          </motion.div>
        )}

        {/* Input */}
        {isPlaying && (
          <input
            type="text"
            value={userInput}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Type your answer..."
            className="w-full max-w-xs px-4 py-3 text-xl text-center rounded-xl border-4 border-purple-300 focus:border-purple-500 outline-none mb-4"
            autoFocus
          />
        )}

        {/* Hint Button */}
        {isPlaying && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleHint}
            disabled={hintUsed}
            className={`mb-4 px-4 py-2 rounded-full font-bold ${
              hintUsed ? 'bg-gray-300 text-gray-500' : 'bg-yellow-400 text-purple-900'
            }`}
          >
            💡 Hint (-5 points)
          </motion.button>
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
          <p>Unscramble the letters to make a word!</p>
          <p>Streak of 3+ gives bonus points! 🔥</p>
        </div>
      </div>

      <GameOverScreen
        show={gameOver}
        score={score}
        highScore={highScore}
        isNewHighScore={score > highScore && score > 0}
        onPlayAgain={startGame}
        message="Game Over!"
      />
    </GameLayout>
  );
}
