const STORAGE_MUTE_KEY = 'lovey_arcade_muted';
const STORAGE_VOLUME_KEY = 'lovey_arcade_volume';

let audioCtx: AudioContext | null = null;
let masterGainNode: GainNode | null = null;
let compressorNode: DynamicsCompressorNode | null = null;
let isAppInBackground: boolean = false;
let wasBgmPlayingBeforeBackground: boolean = false;

let mutedState: boolean = (() => {
  try {
    return localStorage.getItem(STORAGE_MUTE_KEY) === '1';
  } catch {
    return false;
  }
})();

let masterVolume: number = (() => {
  try {
    const raw = localStorage.getItem(STORAGE_VOLUME_KEY);
    return raw ? Math.max(0.0, Math.min(1.0, parseFloat(raw))) : 1.0;
  } catch {
    return 1.0;
  }
})();

export function getMasterVolume(): number {
  return masterVolume;
}

export function setMasterVolume(vol: number): void {
  masterVolume = Math.max(0.0, Math.min(1.0, vol));
  try {
    localStorage.setItem(STORAGE_VOLUME_KEY, masterVolume.toFixed(2));
  } catch {
    // Ignore storage errors
  }
}

function getAudioContext(): AudioContext | null {
  if (mutedState || isAppInBackground || typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
      // Hardware-tuned compressor + master gain: makes audio loud & clear on phone speakers
      try {
        compressorNode = audioCtx.createDynamicsCompressor();
        compressorNode.threshold.setValueAtTime(-14, audioCtx.currentTime);
        compressorNode.knee.setValueAtTime(10, audioCtx.currentTime);
        compressorNode.ratio.setValueAtTime(8, audioCtx.currentTime);
        compressorNode.attack.setValueAtTime(0.003, audioCtx.currentTime);
        compressorNode.release.setValueAtTime(0.12, audioCtx.currentTime);

        masterGainNode = audioCtx.createGain();
        masterGainNode.gain.setValueAtTime(1.45, audioCtx.currentTime);

        masterGainNode.connect(compressorNode);
        compressorNode.connect(audioCtx.destination);
      } catch {
        // Fallback to direct output
      }
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isSoundMuted(): boolean {
  return mutedState;
}

export function setSoundMuted(muted: boolean): boolean {
  mutedState = muted;
  try {
    localStorage.setItem(STORAGE_MUTE_KEY, muted ? '1' : '0');
  } catch {
    // Ignore storage errors
  }
  if (mutedState) {
    stopBgMusicLoop();
  } else {
    startBgMusicLoop();
  }
  return mutedState;
}

/* ==========================================================================
   MULTI-TRACK KAWAII BACKGROUND MUSIC SYNTHESIZER (0 KB Web Audio Synth)
   - 'menu'  : Cozy Pastel Café Music-Box Theme
   - 'dama'  : Groovy Playful Cat Duel Showdown Theme
   - 'snakes': Whimsical Carnival Adventure March Theme
   ========================================================================== */
export type BgmTrack = 'menu' | 'dama' | 'snakes' | 'uno' | 'doodle' | 'billiards';

const BILLIARDS_MELODY: readonly [number, number][] = [
  [523, 175], [0, 0], [622, 0], [659, 175], [784, 0], [0, 233], [659, 0], [587, 0],
  [523, 220], [0, 0], [440, 0], [494, 220], [523, 0], [0, 196], [587, 0], [0, 0],
];

const DOODLE_MELODY: readonly [number, number][] = [
  [587, 294], [659, 0], [784, 392], [880, 0],
  [988, 330], [880, 0], [784, 392], [659, 0],
  [523, 262], [659, 0], [784, 330], [880, 0],
  [1047, 440], [880, 0], [784, 392], [587, 294],
];

const UNO_MELODY: readonly [number, number][] = [
  [698, 349], [880, 0], [1047, 349], [880, 0],
  [784, 392], [988, 0], [1175, 392], [988, 0],
  [659, 330], [784, 0], [988, 330], [784, 0],
  [880, 440], [1047, 0], [1319, 440], [880, 0],
];

const MENU_MELODY: readonly [number, number][] = [
  [523, 262], [659, 0], [784, 392], [880, 0], [784, 330], [659, 0], [587, 294], [523, 0],
  [587, 349], [659, 0], [784, 440], [1047, 0], [880, 392], [784, 0], [659, 330], [587, 0],
  [659, 262], [784, 0], [880, 349], [784, 0], [659, 330], [523, 0], [587, 294], [659, 0],
  [784, 392], [880, 0], [659, 330], [587, 0], [523, 262], [659, 330], [784, 392], [523, 0],
];

const DAMA_MELODY: readonly [number, number][] = [
  [440, 220], [523, 0], [659, 330], [587, 0], [659, 220], [784, 0], [880, 330], [0, 247],
  [587, 294], [698, 0], [880, 440], [784, 0], [698, 294], [659, 0], [587, 349], [523, 0],
  [494, 196], [587, 0], [784, 294], [659, 0], [523, 262], [659, 0], [784, 330], [988, 0],
  [880, 220], [784, 0], [659, 330], [587, 0], [523, 247], [587, 0], [659, 330], [440, 220],
];

const SNAKES_MELODY: readonly [number, number][] = [
  [392, 196], [494, 294], [587, 196], [784, 294], [659, 262], [784, 0], [587, 196], [0, 294],
  [523, 262], [659, 330], [784, 262], [1047, 0], [880, 294], [740, 0], [587, 294], [659, 0],
  [784, 196], [740, 0], [784, 294], [880, 0], [587, 247], [659, 0], [784, 294], [587, 0],
  [523, 262], [587, 0], [659, 294], [740, 0], [784, 196], [587, 294], [784, 196], [0, 0],
];

const BGM_CONFIGS: Record<
  BgmTrack,
  {
    stepMs: number;
    melody: readonly [number, number][];
    lType: OscillatorType;
    lVol: number;
    bType: OscillatorType;
    bVol: number;
  }
> = {
  billiards: { stepMs: 230, melody: BILLIARDS_MELODY, lType: 'sine', lVol: 0.075, bType: 'triangle', bVol: 0.08 },
  doodle: { stepMs: 185, melody: DOODLE_MELODY, lType: 'triangle', lVol: 0.08, bType: 'sine', bVol: 0.07 },
  uno: { stepMs: 180, melody: UNO_MELODY, lType: 'triangle', lVol: 0.075, bType: 'square', bVol: 0.05 },
  dama: { stepMs: 195, melody: DAMA_MELODY, lType: 'square', lVol: 0.065, bType: 'triangle', bVol: 0.08 },
  snakes: { stepMs: 210, melody: SNAKES_MELODY, lType: 'triangle', lVol: 0.085, bType: 'sine', bVol: 0.075 },
  menu: { stepMs: 240, melody: MENU_MELODY, lType: 'triangle', lVol: 0.08, bType: 'sine', bVol: 0.07 },
};

let bgmTimer: number | null = null;
let bgmStep = 0;
let currentBgmTrack: BgmTrack = 'menu';

function playBgmStep(): void {
  if (mutedState) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  const cfg = BGM_CONFIGS[currentBgmTrack];
  const [leadFreq, bassFreq] = cfg.melody[bgmStep % cfg.melody.length];
  bgmStep = (bgmStep + 1) % cfg.melody.length;

  if (leadFreq > 0) {
    playTone(leadFreq, leadFreq * 1.004, 0.14, cfg.lType, cfg.lVol, 0);
  }
  if (bassFreq > 0) {
    playTone(bassFreq, bassFreq, 0.16, cfg.bType, cfg.bVol, 0);
  }
}

export function setBgMusicTrack(track: BgmTrack): void {
  if (currentBgmTrack === track) return;
  currentBgmTrack = track;
  bgmStep = 0;
  if (bgmTimer !== null && typeof window !== 'undefined') {
    window.clearInterval(bgmTimer);
    bgmTimer = window.setInterval(playBgmStep, BGM_CONFIGS[currentBgmTrack].stepMs);
  }
}

export function pauseAudioForBackground(): void {
  if (isAppInBackground) return;
  isAppInBackground = true;
  wasBgmPlayingBeforeBackground = bgmTimer !== null;
  stopBgMusicLoop();
  if (audioCtx && audioCtx.state === 'running') {
    audioCtx.suspend().catch(() => {});
  }
}

export function resumeAudioFromBackground(): void {
  if (!isAppInBackground) return;
  isAppInBackground = false;
  if (!mutedState && wasBgmPlayingBeforeBackground) {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    startBgMusicLoop();
  }
}

export function startBgMusicLoop(): void {
  if (typeof window === 'undefined' || mutedState || isAppInBackground || bgmTimer !== null) return;
  getAudioContext();
  bgmTimer = window.setInterval(playBgmStep, BGM_CONFIGS[currentBgmTrack].stepMs);
}

function stopBgMusicLoop(): void {
  if (bgmTimer !== null && typeof window !== 'undefined') {
    window.clearInterval(bgmTimer);
    bgmTimer = null;
  }
}

if (typeof window !== 'undefined') {
  const unlockAndPlayBgm = () => {
    if (!mutedState && !isAppInBackground) {
      startBgMusicLoop();
    }
  };
  window.addEventListener('pointerdown', unlockAndPlayBgm, { passive: true });
  window.addEventListener('keydown', unlockAndPlayBgm, { passive: true });

  // Web Visibility API (tab switched, minimized, screen turned off)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseAudioForBackground();
    } else {
      resumeAudioFromBackground();
    }
  });

  window.addEventListener('pagehide', pauseAudioForBackground);
  window.addEventListener('pageshow', resumeAudioFromBackground);

  // Native Capacitor App state listener (handles Android Home, App switch, screen lock)
  try {
    import('@capacitor/app')
      .then(({ App }) => {
        App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) {
            pauseAudioForBackground();
          } else {
            resumeAudioFromBackground();
          }
        }).catch(() => {});
      })
      .catch(() => {});
  } catch {
    // Non-capacitor environment fallback
  }
}

function playTone(
  freqStart: number,
  freqEnd: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.35,
  delaySec = 0
): void {
  if (isAppInBackground) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const startTime = ctx.currentTime + delaySec;
    const endTime = startTime + durationSec;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, startTime);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(40, freqEnd),
        endTime
      );
    }

    const effectiveGain = Math.min(1.0, gainPeak * masterVolume);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(effectiveGain, startTime + durationSec * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, endTime);

    osc.connect(gain);
    gain.connect(masterGainNode || ctx.destination);

    osc.start(startTime);
    osc.stop(endTime + 0.01);
  } catch {
    // Ignore audio context errors on restricted devices
  }
}

export function playTapPop(): void {
  playTone(480, 680, 0.055, 'sine', 0.38);
}

export function playCatStep(): void {
  playTone(360, 620, 0.085, 'triangle', 0.48);
}

export function playCatPounceCapture(): void {
  playTone(300, 820, 0.11, 'triangle', 0.58, 0);
  playTone(620, 420, 0.09, 'sine', 0.48, 0.09);
}

export function playDizzySlide(): void {
  playTone(740, 220, 0.28, 'sine', 0.48);
}

export function playDiceRattle(): void {
  playTone(520, 740, 0.045, 'triangle', 0.38, 0);
  playTone(620, 840, 0.045, 'triangle', 0.38, 0.065);
  playTone(480, 790, 0.05, 'triangle', 0.42, 0.13);
}

export function playReactionChime(): void {
  playTone(659.25, 659.25, 0.08, 'sine', 0.42, 0);
  playTone(880, 880, 0.12, 'sine', 0.45, 0.07);
}

export function playCatMeow(): void {
  // Playful upward-then-sweet-dip kawaii cat "mew~"
  playTone(540, 920, 0.14, 'triangle', 0.52, 0);
  playTone(920, 680, 0.18, 'sine', 0.48, 0.11);
}

export function playCatAngryMeow(): void {
  // Feisty grumpy cat yowl + mini hiss ("Mrrrow~!")
  playTone(760, 390, 0.13, 'sawtooth', 0.42, 0);
  playTone(620, 310, 0.16, 'triangle', 0.48, 0.09);
}

export function playTurnBannerPop(): void {
  playTone(523.25, 659.25, 0.07, 'sine', 0.42, 0);
  playTone(783.99, 783.99, 0.09, 'triangle', 0.45, 0.05);
}

export function playTimerTick(): void {
  playTone(880, 880, 0.03, 'sine', 0.42, 0);
}

export function playShuffleTick(stepIndex = 0): void {
  const baseFreq = stepIndex % 2 === 0 ? 587.33 : 698.46;
  playTone(baseFreq, baseFreq * 1.12, 0.055, 'triangle', 0.42, 0);
}

export function playPowerupReveal(): void {
  const notes = [587.33, 739.99, 880, 1174.66];
  notes.forEach((freq, idx) => {
    playTone(freq, freq * 1.03, 0.13, 'triangle', 0.48, idx * 0.065);
  });
}

export function playComboFanfare(comboCount: number): void {
  const base = 440 + Math.min(4, comboCount) * 80;
  playTone(base, base * 1.25, 0.11, 'triangle', 0.48, 0);
  playTone(base * 1.25, base * 1.5, 0.12, 'triangle', 0.50, 0.08);
  playTone(base * 1.5, base * 2, 0.18, 'sine', 0.52, 0.16);
}

export function playAscensionChime(): void {
  // Celestial royal evolution arpeggio
  const notes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5];
  notes.forEach((freq, idx) => {
    playTone(freq, freq * 1.01, 0.18, 'triangle', 0.48, idx * 0.07);
  });
}

export function playVictoryFanfare(): void {
  // Celebratory multi-chord victory fanfare + sparkle cascade
  const fanfare: readonly [number, number, number][] = [
    [523.25, 0.12, 0],
    [659.25, 0.12, 0.1],
    [783.99, 0.12, 0.2],
    [1046.5, 0.24, 0.3],
    [783.99, 0.12, 0.52],
    [1046.5, 0.38, 0.64],
    [1318.5, 0.32, 0.72],
  ];
  fanfare.forEach(([freq, dur, delay]) => {
    playTone(freq, freq * 1.015, dur, 'triangle', 0.50, delay);
  });
}

export function playCardPlay(): void {
  playTone(520, 780, 0.065, 'sine', 0.45, 0);
  playTone(780, 1040, 0.05, 'triangle', 0.42, 0.04);
}

export function playCardDraw(): void {
  playTone(440, 620, 0.06, 'triangle', 0.40, 0);
}

export function playUnoCall(): void {
  playTone(587.33, 587.33, 0.08, 'sine', 0.45, 0);
  playTone(880.0, 880.0, 0.09, 'triangle', 0.50, 0.06);
  playTone(1174.66, 1174.66, 0.16, 'sine', 0.55, 0.13);
  playCatMeow();
}

export function playColorSelect(): void {
  playTone(659.25, 880.0, 0.08, 'sine', 0.42, 0);
  playTone(880.0, 1046.5, 0.1, 'triangle', 0.45, 0.06);
}

/* Cat Billiards SFX (intensity v = impact speed in table units/s) */
export function playBallClack(v = 60): void {
  const g = Math.min(0.5, 0.12 + v / 400);
  playTone(2100, 1500, 0.035, 'triangle', g, 0);
}

export function playRailThud(v = 40): void {
  playTone(170, 110, 0.07, 'sine', Math.min(0.45, 0.1 + v / 450), 0);
}

export function playPocketDrop(): void {
  playTone(320, 150, 0.12, 'triangle', 0.45, 0);
  playTone(210, 120, 0.1, 'sine', 0.35, 0.08);
}

export function playCueStrike(power = 0.5): void {
  playTone(900, 500, 0.05, 'triangle', 0.25 + power * 0.25, 0);
}

export function playDoodleStrokePop(): void {
  playTone(480, 580, 0.04, 'triangle', 0.35, 0);
}

export function playDoodleCorrectGuess(): void {
  // Joyful celebratory victory song for correct guess (~1.5s melody + sparkle chime)
  // Radiant ascending C-major arpeggio -> triumphant peak -> sparkle bells -> celebratory cat meow!
  const victoryMelody: readonly [number, number, number, OscillatorType, number][] = [
    // [freqStart, freqEnd, durationSec, type, delaySec]
    // 1. Upbeat, fast ascending trumpet-like fanfare: C5 -> E5 -> G5 -> C6
    [523.25, 523.25, 0.09, 'triangle', 0.00], // C5
    [659.25, 659.25, 0.09, 'triangle', 0.08], // E5
    [783.99, 783.99, 0.09, 'triangle', 0.16], // G5
    [1046.50, 1046.50, 0.15, 'triangle', 0.24], // C6
    // 2. Playful rhythmic bounce: B5 -> C6 -> D6
    [987.77, 987.77, 0.09, 'sine', 0.40],     // B5
    [1046.50, 1046.50, 0.12, 'sine', 0.49],   // C6
    [1174.66, 1174.66, 0.12, 'sine', 0.62],   // D6
    // 3. Triumphant peak chord: E6 + high G6
    [1318.51, 1318.51, 0.28, 'triangle', 0.74], // E6
    [1567.98, 1567.98, 0.28, 'sine', 0.74],     // G6 harmony
    // 4. Grand sparkle cascade & chime ringing
    [1046.50, 1046.50, 0.25, 'triangle', 1.02], // C6
    [1318.51, 1318.51, 0.25, 'sine', 1.08],     // E6
    [1567.98, 1567.98, 0.25, 'sine', 1.14],     // G6
    [2093.00, 2093.00, 0.35, 'triangle', 1.20], // C7 chime bell
  ];

  victoryMelody.forEach(([start, end, dur, type, delay]) => {
    playTone(start, end, dur, type, 0.52, delay);
  });

  // Cheerful kitten victory "Mew!" timed right as the sparkle bells finish
  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      playCatMeow();
    }, 1320);
  }
}

export function playDoodleWrongGuess(): void {
  // Quick, gentle cartoon "uh-oh / boop-bloop" cue (~0.17s) - distinct from any song/jingle
  playTone(260, 240, 0.07, 'triangle', 0.36, 0);
  playTone(200, 180, 0.09, 'sine', 0.32, 0.08);
}

export function playDoodleStumpedRound(): void {
  // Gentle comical cartoon slide played only if guesser runs out of all guesses (~0.42s)
  const stumpedMotif: readonly [number, number, number, OscillatorType, number][] = [
    [329.63, 293.66, 0.11, 'triangle', 0.00], // E4 -> D4
    [261.63, 246.94, 0.11, 'triangle', 0.10], // C4 -> B3
    [220.00, 174.61, 0.20, 'sine', 0.21],     // A3 -> F3 slide
  ];
  stumpedMotif.forEach(([start, end, dur, type, delay]) => {
    playTone(start, end, dur, type, 0.38, delay);
  });
}

export function playDoodleHeartSacrifice(): void {
  // Gentle magical heart sacrifice sparkle (sweet dip + twinkling chime) (~0.22s)
  playTone(523.25, 440.0, 0.08, 'sine', 0.38, 0);
  playTone(880.0, 1174.66, 0.12, 'triangle', 0.42, 0.07);
  playTone(1760.0, 1760.0, 0.14, 'sine', 0.35, 0.13);
}

export function playDoodleClear(): void {
  playTone(640, 320, 0.14, 'sine', 0.45, 0);
}

export function playRouletteTick(pitchMultiplier = 1): void {
  const base = 880 * pitchMultiplier;
  playTone(base, base * 1.08, 0.035, 'square', 0.45, 0);
}

export function playTimesUpAlarm(): void {
  // Classic ringing wake-up / turn chime alarm
  playTone(880, 880, 0.11, 'square', 0.55, 0);
  playTone(1174, 1174, 0.12, 'square', 0.58, 0.12);
  playTone(880, 880, 0.11, 'square', 0.55, 0.25);
  playTone(1174, 1174, 0.18, 'square', 0.60, 0.38);
}
