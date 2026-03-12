'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '@/components/GameLayout';
import GameOverScreen from '@/components/GameOverScreen';
import { playSound } from '@/lib/sounds';
import { getHighScore, setHighScore } from '@/lib/highscore';

const GAME_WIDTH = 350;
const GAME_HEIGHT = 500;
const SHIP_SIZE = 40;
const BULLET_SIZE = 8;
const ENEMY_SIZE = 35;

type Position = { x: number; y: number };
type Enemy = Position & { type: 'basic' | 'fast' | 'tank' | 'boss'; health: number };
type Bullet = Position & { isEnemy: boolean };
type Particle = Position & { vx: number; vy: number; life: number; color: string };
type PowerUp = Position & { type: 'shield' | 'rapid' | 'multi' };

const ENEMY_COLORS: Record<string, string> = {
  basic: '#ff6b6b',
  fast: '#ffd93d',
  tank: '#6bcb77',
  boss: '#9b59b6',
};

const POWER_UP_EMOJIS: Record<string, string> = {
  shield: '🛡️',
  rapid: '⚡',
  multi: '✨',
};

export default function SpaceShooter() {
  const [ship, setShip] = useState<Position>({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60 });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [shieldActive, setShieldActive] = useState(false);
  const [rapidFire, setRapidFire] = useState(false);
  const [multiShot, setMultiShot] = useState(false);
  const [stars, setStars] = useState<{ x: number; y: number; size: number; speed: number }[]>([]);
  
  const gameRef = useRef<HTMLDivElement>(null);
  const keysPressed = useRef<Set<string>>(new Set());
  const lastShot = useRef(0);
  const animationRef = useRef<number>();

  const highScore = getHighScore('space-shooter');

  // Initialize stars
  useEffect(() => {
    const initialStars = Array.from({ length: 50 }, () => ({
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 2 + 0.5,
    }));
    setStars(initialStars);
  }, []);

  const resetGame = useCallback(() => {
    setShip({ x: GAME_WIDTH / 2, y: GAME_HEIGHT - 60 });
    setBullets([]);
    setEnemies([]);
    setParticles([]);
    setPowerUps([]);
    setScore(0);
    setLives(3);
    setLevel(1);
    setShieldActive(false);
    setRapidFire(false);
    setMultiShot(false);
    setIsPlaying(true);
    setGameOver(false);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
      if (e.key === ' ' && isPlaying) {
        e.preventDefault();
        shoot();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPlaying]);

  const shoot = useCallback(() => {
    const now = Date.now();
    const cooldown = rapidFire ? 100 : 250;
    if (now - lastShot.current < cooldown) return;
    lastShot.current = now;

    playSound('shoot');
    
    if (multiShot) {
      setBullets(prev => [
        ...prev,
        { x: ship.x - 15, y: ship.y - 20, isEnemy: false },
        { x: ship.x, y: ship.y - 20, isEnemy: false },
        { x: ship.x + 15, y: ship.y - 20, isEnemy: false },
      ]);
    } else {
      setBullets(prev => [...prev, { x: ship.x, y: ship.y - 20, isEnemy: false }]);
    }
  }, [ship, rapidFire, multiShot]);

  // Spawn enemies
  useEffect(() => {
    if (!isPlaying) return;

    const spawnEnemy = () => {
      const types: Enemy['type'][] = ['basic', 'basic', 'basic', 'fast', 'tank'];
      if (level > 2) types.push('boss');
      
      const type = types[Math.floor(Math.random() * types.length)];
      const health = type === 'tank' ? 3 : type === 'boss' ? 5 : 1;
      
      setEnemies(prev => [
        ...prev,
        {
          x: Math.random() * (GAME_WIDTH - ENEMY_SIZE) + ENEMY_SIZE / 2,
          y: -ENEMY_SIZE,
          type,
          health,
        },
      ]);
    };

    const interval = setInterval(spawnEnemy, Math.max(500, 1500 - level * 100));
    return () => clearInterval(interval);
  }, [isPlaying, level]);

  // Game loop
  useEffect(() => {
    if (!isPlaying) return;

    const update = () => {
      // Move ship based on keys
      setShip(prev => {
        let newX = prev.x;
        let newY = prev.y;
        
        if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('a')) {
          newX = Math.max(SHIP_SIZE / 2, prev.x - 8);
        }
        if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('d')) {
          newX = Math.min(GAME_WIDTH - SHIP_SIZE / 2, prev.x + 8);
        }
        if (keysPressed.current.has('ArrowUp') || keysPressed.current.has('w')) {
          newY = Math.max(SHIP_SIZE / 2, prev.y - 6);
        }
        if (keysPressed.current.has('ArrowDown') || keysPressed.current.has('s')) {
          newY = Math.min(GAME_HEIGHT - SHIP_SIZE / 2, prev.y + 6);
        }
        
        return { x: newX, y: newY };
      });

      // Move bullets
      setBullets(prev =>
        prev
          .map(b => ({ ...b, y: b.y + (b.isEnemy ? 5 : -12) }))
          .filter(b => b.y > -10 && b.y < GAME_HEIGHT + 10)
      );

      // Move enemies
      setEnemies(prev =>
        prev
          .map(e => ({
            ...e,
            y: e.y + (e.type === 'fast' ? 4 : e.type === 'boss' ? 1.5 : 2.5),
            x: e.x + Math.sin(Date.now() / 200 + e.y / 50) * (e.type === 'fast' ? 3 : 1),
          }))
          .filter(e => e.y < GAME_HEIGHT + 50)
      );

      // Move stars
      setStars(prev =>
        prev.map(s => ({
          ...s,
          y: (s.y + s.speed) % GAME_HEIGHT,
        }))
      );

      // Move particles
      setParticles(prev =>
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            life: p.life - 1,
          }))
          .filter(p => p.life > 0)
      );

      // Move power-ups
      setPowerUps(prev =>
        prev
          .map(p => ({ ...p, y: p.y + 2 }))
          .filter(p => p.y < GAME_HEIGHT + 20)
      );

      // Check collisions
      setBullets(bullets => {
        setEnemies(enemies => {
          let newEnemies = [...enemies];
          let newScore = score;
          let newParticles: Particle[] = [];

          bullets.forEach((bullet, bi) => {
            if (bullet.isEnemy) return;

            newEnemies = newEnemies.filter(enemy => {
              const dx = bullet.x - enemy.x;
              const dy = bullet.y - enemy.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < ENEMY_SIZE / 2 + BULLET_SIZE) {
                // Hit!
                newScore += 10;
                
                // Create particles
                for (let i = 0; i < 8; i++) {
                  newParticles.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    life: 20,
                    color: ENEMY_COLORS[enemy.type],
                  });
                }

                if (enemy.health > 1) {
                  // Reduce health
                  return { ...enemy, health: enemy.health - 1 };
                } else {
                  // Enemy destroyed
                  playSound('explosion');
                  
                  // Chance to drop power-up
                  if (Math.random() < 0.15) {
                    const types: PowerUp['type'][] = ['shield', 'rapid', 'multi'];
                    setPowerUps(prev => [
                      ...prev,
                      {
                        x: enemy.x,
                        y: enemy.y,
                        type: types[Math.floor(Math.random() * types.length)],
                      },
                    ]);
                  }
                  
                  return false;
                }
              }
              return true;
            });
          });

          setScore(newScore);
          setParticles(prev => [...prev, ...newParticles]);
          return newEnemies;
        });

        // Filter out bullets that hit enemies
        return bullets.filter(b => {
          if (b.isEnemy) return true;
          let hit = false;
          enemies.forEach(enemy => {
            const dx = b.x - enemy.x;
            const dy = b.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < ENEMY_SIZE / 2 + BULLET_SIZE) hit = true;
          });
          return !hit;
        });
      });

      // Check enemy bullet collisions with ship
      setBullets(bullets => {
        const enemyBullets = bullets.filter(b => b.isEnemy);
        let shipHit = false;

        enemyBullets.forEach(bullet => {
          const dx = bullet.x - ship.x;
          const dy = bullet.y - ship.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < SHIP_SIZE / 2 + BULLET_SIZE) {
            if (!shieldActive) {
              shipHit = true;
            }
          }
        });

        if (shipHit) {
          playSound('lose');
          setLives(prev => {
            if (prev <= 1) {
              setGameOver(true);
              setIsPlaying(false);
              setHighScore('space-shooter', score);
              return 0;
            }
            return prev - 1;
          });
          // Clear enemy bullets
          return bullets.filter(b => !b.isEnemy);
        }

        return bullets;
      });

      // Check power-up collection
      setPowerUps(prev =>
        prev.filter(pu => {
          const dx = pu.x - ship.x;
          const dy = pu.y - ship.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < SHIP_SIZE / 2 + 15) {
            playSound('score');
            if (pu.type === 'shield') {
              setShieldActive(true);
              setTimeout(() => setShieldActive(false), 5000);
            } else if (pu.type === 'rapid') {
              setRapidFire(true);
              setTimeout(() => setRapidFire(false), 5000);
            } else if (pu.type === 'multi') {
              setMultiShot(true);
              setTimeout(() => setMultiShot(false), 5000);
            }
            return false;
          }
          return true;
        })
      );

      // Level up
      if (score > level * 500) {
        setLevel(prev => prev + 1);
      }

      animationRef.current = requestAnimationFrame(update);
    };

    animationRef.current = requestAnimationFrame(update);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, score, level, shieldActive]);

  return (
    <GameLayout title="Space Shooter" emoji="🚀" score={score} highScore={highScore} lives={lives} level={level}>
      <div className="flex flex-col items-center">
        {/* Power-up indicators */}
        <div className="mb-3 flex gap-2">
          {shieldActive && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-blue-500/80 text-white px-3 py-1 rounded-full text-sm"
            >
              🛡️ Shield
            </motion.div>
          )}
          {rapidFire && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-yellow-500/80 text-white px-3 py-1 rounded-full text-sm"
            >
              ⚡ Rapid
            </motion.div>
          )}
          {multiShot && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-purple-500/80 text-white px-3 py-1 rounded-full text-sm"
            >
              ✨ Multi
            </motion.div>
          )}
        </div>

        {/* Game Canvas */}
        <div
          ref={gameRef}
          className="relative rounded-2xl overflow-hidden border-4 border-purple-500 shadow-lg cursor-crosshair"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          onClick={shoot}
        >
          {/* Space Background */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950 to-black" />

          {/* Stars */}
          {stars.map((star, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full"
              style={{
                left: star.x,
                top: star.y,
                width: star.size,
                height: star.size,
                opacity: 0.5 + star.size / 4,
              }}
            />
          ))}

          {/* Particles */}
          {particles.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: p.x - 3,
                top: p.y - 3,
                width: 6,
                height: 6,
                backgroundColor: p.color,
                opacity: p.life / 20,
              }}
            />
          ))}

          {/* Power-ups */}
          {powerUps.map((pu, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: [0, 360] }}
              transition={{ rotate: { duration: 2, repeat: Infinity } }}
              className="absolute text-2xl"
              style={{
                left: pu.x - 12,
                top: pu.y - 12,
              }}
            >
              {POWER_UP_EMOJIS[pu.type]}
            </motion.div>
          ))}

          {/* Enemies */}
          {enemies.map((enemy, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute"
              style={{
                left: enemy.x - ENEMY_SIZE / 2,
                top: enemy.y - ENEMY_SIZE / 2,
                width: ENEMY_SIZE,
                height: ENEMY_SIZE,
              }}
            >
              {/* Enemy ship */}
              <div
                className="w-full h-full relative"
                style={{
                  backgroundColor: ENEMY_COLORS[enemy.type],
                  clipPath: enemy.type === 'boss' 
                    ? 'polygon(50% 0%, 100% 30%, 80% 100%, 20% 100%, 0% 30%)'
                    : enemy.type === 'tank'
                    ? 'polygon(50% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)'
                    : 'polygon(50% 0%, 100% 100%, 50% 80%, 0% 100%)',
                }}
              />
              {/* Health bar for tanks/boss */}
              {enemy.type === 'tank' || enemy.type === 'boss' ? (
                <div
                  className="absolute -bottom-1 left-0 h-1 bg-red-500"
                  style={{ width: `${(enemy.health / (enemy.type === 'boss' ? 5 : 3)) * 100}%` }}
                />
              ) : null}
            </motion.div>
          ))}

          {/* Bullets */}
          {bullets.map((bullet, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                left: bullet.x - BULLET_SIZE / 2,
                top: bullet.y - BULLET_SIZE / 2,
                width: BULLET_SIZE,
                height: BULLET_SIZE,
                backgroundColor: bullet.isEnemy ? '#ff4444' : '#44ff44',
                boxShadow: bullet.isEnemy ? '0 0 10px #ff4444' : '0 0 10px #44ff44',
              }}
            />
          ))}

          {/* Player Ship */}
          <motion.div
            className="absolute"
            style={{
              left: ship.x - SHIP_SIZE / 2,
              top: ship.y - SHIP_SIZE / 2,
              width: SHIP_SIZE,
              height: SHIP_SIZE,
            }}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {/* Ship body */}
            <div
              className="w-full h-full relative"
              style={{
                backgroundColor: shieldActive ? '#4488ff' : '#8844ff',
                clipPath: 'polygon(50% 0%, 100% 100%, 50% 80%, 0% 100%)',
                filter: shieldActive ? 'drop-shadow(0 0 10px #4488ff)' : 'none',
              }}
            />
            {/* Engine glow */}
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-6 bg-orange-500 rounded-full"
              style={{ filter: 'blur(2px)' }}
            />
          </motion.div>

          {/* Start Screen */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-pulse">🚀</div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={resetGame}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-full text-xl shadow-lg"
                >
                  🎮 Start Game
                </motion.button>
                <p className="text-white mt-4 text-sm">Use Arrow Keys or WASD to move</p>
                <p className="text-white text-sm">Click or press SPACE to shoot!</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-white/80 text-center text-sm">
          <p>🚀 Move: Arrow Keys / WASD | 💥 Shoot: Click / SPACE</p>
          <p>Collect power-ups: 🛡️ Shield | ⚡ Rapid | ✨ Multi</p>
        </div>
      </div>

      <GameOverScreen
        show={gameOver}
        score={score}
        highScore={highScore}
        isNewHighScore={score > highScore && score > 0}
        onPlayAgain={resetGame}
        message="Mission Failed! 🚀"
      />
    </GameLayout>
  );
}
