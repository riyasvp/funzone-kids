// Web Audio API sound effects - no audio files needed!

type SoundType = 'pop' | 'win' | 'lose' | 'click' | 'score' | 'jump' | 'correct' | 'wrong' | 'bonus' | 'shoot' | 'explosion' | 'powerup' | 'hit';

interface SoundConfig {
  freq: number;
  duration: number;
  type: OscillatorType;
  freqEnd?: number;
}

const soundConfigs: Record<SoundType, SoundConfig> = {
  pop: { freq: 800, duration: 0.1, type: 'sine' },
  win: { freq: 1200, duration: 0.5, type: 'sine', freqEnd: 1600 },
  lose: { freq: 200, duration: 0.4, type: 'sawtooth', freqEnd: 100 },
  click: { freq: 600, duration: 0.05, type: 'square' },
  score: { freq: 1000, duration: 0.15, type: 'sine' },
  jump: { freq: 400, duration: 0.15, type: 'sine', freqEnd: 600 },
  correct: { freq: 880, duration: 0.2, type: 'sine' },
  wrong: { freq: 220, duration: 0.3, type: 'square' },
  bonus: { freq: 1500, duration: 0.3, type: 'sine', freqEnd: 2000 },
  shoot: { freq: 2000, duration: 0.08, type: 'square', freqEnd: 500 },
  explosion: { freq: 100, duration: 0.3, type: 'sawtooth', freqEnd: 50 },
  powerup: { freq: 800, duration: 0.2, type: 'sine', freqEnd: 1600 },
  hit: { freq: 400, duration: 0.1, type: 'square', freqEnd: 200 },
};

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

export function playSound(type: SoundType): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const config = soundConfigs[type];
    
    osc.frequency.setValueAtTime(config.freq, ctx.currentTime);
    if (config.freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(config.freqEnd, ctx.currentTime + config.duration);
    }
    
    osc.type = config.type;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + config.duration);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + config.duration);
  } catch (e) {
    // Audio not supported or blocked
    console.log('Audio play failed:', e);
  }
}

// Play a sequence of notes (for win fanfare)
export function playWinFanfare(): void {
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  
  notes.forEach((freq, i) => {
    setTimeout(() => {
      try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) {
        console.log('Audio play failed:', e);
      }
    }, i * 150);
  });
}

// Simon says tone generator
export function playSimonTone(color: 'red' | 'blue' | 'green' | 'yellow'): void {
  const tones: Record<string, number> = {
    red: 329.63,    // E4
    blue: 261.63,   // C4
    green: 392.00,  // G4
    yellow: 523.25, // C5
  };
  
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(tones[color], ctx.currentTime);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.log('Audio play failed:', e);
  }
}
