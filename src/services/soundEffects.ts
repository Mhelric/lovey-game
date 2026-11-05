const STORAGE_MUTE_KEY = 'lovey_arcade_muted';

let audioCtx: AudioContext | null = null;
let mutedState: boolean = (() => {
  try {
    return localStorage.getItem(STORAGE_MUTE_KEY) === '1';
  } catch {
    return false;
  }
})();

function getAudioContext(): AudioContext | null {
  if (mutedState || typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
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
export type BgmTrack = 'menu' | 'dama' | 'snakes';

const MENU_MELODY: readonly [number, number][] = [
  // Bar 1 (Fmaj7 / Cmaj7 sunny kawaii bounce)
  [523.25, 261.63], // C5 + C4
  [659.25, 0],      // E5
  [783.99, 392.0],  // G5 + G4
  [880.0, 0],       // A5
  [783.99, 329.63], // G5 + E4
  [659.25, 0],      // E5
  [587.33, 293.66], // D5 + D4
  [523.25, 0],      // C5
  // Bar 2 (Playful upward skip)
  [587.33, 349.23], // D5 + F4
  [659.25, 0],      // E5
  [783.99, 440.0],  // G5 + A4
  [1046.5, 0],      // C6
  [880.0, 392.0],   // A5 + G4
  [783.99, 0],      // G5
  [659.25, 329.63], // E5 + E4
  [587.33, 0],      // D5
  // Bar 3 (Cozy pastel bridge)
  [659.25, 261.63], // E5 + C4
  [783.99, 0],      // G5
  [880.0, 349.23],  // A5 + F4
  [783.99, 0],      // G5
  [659.25, 329.63], // E5 + E4
  [523.25, 0],      // C5
  [587.33, 293.66], // D5 + D4
  [659.25, 0],      // E5
  // Bar 4 (Happy cadence turnaround)
  [783.99, 392.0],  // G5 + G4
  [880.0, 0],       // A5
  [659.25, 329.63], // E5 + E4
  [587.33, 0],      // D5
  [523.25, 261.63], // C5 + C4
  [659.25, 329.63], // E5 + E4
  [783.99, 392.0],  // G5 + G4
  [523.25, 0],      // C5
];

// Cat Dama: Playful, rhythmic pentatonic cat-duel groove (Am7 -> Dm7 -> G7 -> Cmaj7)
const DAMA_MELODY: readonly [number, number][] = [
  // Bar 1 (Am7 sneaky cat paws)
  [440.0, 220.0],   // A4 + A3
  [523.25, 0],      // C5
  [659.25, 329.63], // E5 + E4
  [587.33, 0],      // D5
  [659.25, 220.0],  // E5 + A3
  [783.99, 0],      // G5
  [880.0, 329.63],  // A5 + E4
  [0, 246.94],      // rest + B3
  // Bar 2 (Dm7 clever tactic bounce)
  [587.33, 293.66], // D5 + D4
  [698.46, 0],      // F5
  [880.0, 440.0],   // A5 + A4
  [783.99, 0],      // G5
  [698.46, 293.66], // F5 + D4
  [659.25, 0],      // E5
  [587.33, 349.23], // D5 + F4
  [523.25, 0],      // C5
  // Bar 3 (G7 -> Cmaj7 royal pounce)
  [493.88, 196.0],  // B4 + G3
  [587.33, 0],      // D5
  [783.99, 293.66], // G5 + D4
  [659.25, 0],      // E5
  [523.25, 261.63], // C5 + C4
  [659.25, 0],      // E5
  [783.99, 329.63], // G5 + E4
  [987.77, 0],      // B5
  // Bar 4 (E7 playful turnaround)
  [880.0, 220.0],   // A5 + A3
  [783.99, 0],      // G5
  [659.25, 329.63], // E5 + E4
  [587.33, 0],      // D5
  [523.25, 246.94], // C5 + B3
  [587.33, 0],      // D5
  [659.25, 329.63], // E5 + E4
  [440.0, 220.0],   // A4 + A3
];

// Snakes & Ladders: Whimsical, hopping G-major carnival board-game adventure
const SNAKES_MELODY: readonly [number, number][] = [
  // Bar 1 (G major bouncy hop)
  [392.0, 196.0],   // G4 + G3
  [493.88, 293.66], // B4 + D4
  [587.33, 196.0],  // D5 + G3
  [783.99, 293.66], // G5 + D4
  [659.25, 261.63], // E5 + C4
  [783.99, 0],      // G5
  [587.33, 196.0],  // D5 + G3
  [0, 293.66],      // D4
  // Bar 2 (C major -> D7 ladder climb arpeggio)
  [523.25, 261.63], // C5 + C4
  [659.25, 329.63], // E5 + E4
  [783.99, 261.63], // G5 + C4
  [1046.5, 0],      // C6
  [880.0, 293.66],  // A5 + D4
  [739.99, 0],      // F#5
  [587.33, 293.66], // D5 + D4
  [659.25, 0],      // E5
  // Bar 3 (Playful snake wiggle motif)
  [783.99, 196.0],  // G5 + G3
  [739.99, 0],      // F#5
  [783.99, 293.66], // G5 + D4
  [880.0, 0],       // A5
  [587.33, 246.94], // D5 + B3
  [659.25, 0],      // E5
  [783.99, 293.66], // G5 + D4
  [587.33, 0],      // D5
  // Bar 4 (Cheerful carnival finish)
  [523.25, 261.63], // C5 + C4
  [587.33, 0],      // D5
  [659.25, 293.66], // E5 + D4
  [739.99, 0],      // F#5
  [783.99, 196.0],  // G5 + G3
  [587.33, 293.66], // D5 + D4
  [783.99, 196.0],  // G5 + G3
  [0, 0],
];

let bgmTimer: number | null = null;
let bgmStep = 0;
let currentBgmTrack: BgmTrack = 'menu';

function getTrackStepMs(track: BgmTrack): number {
  if (track === 'dama') return 195;
  if (track === 'snakes') return 210;
  return 240;
}

function playBgmStep(): void {
  if (mutedState) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  const melody =
    currentBgmTrack === 'dama'
      ? DAMA_MELODY
      : currentBgmTrack === 'snakes'
      ? SNAKES_MELODY
      : MENU_MELODY;

  const [leadFreq, bassFreq] = melody[bgmStep % melody.length];
  bgmStep = (bgmStep + 1) % melody.length;

  if (currentBgmTrack === 'dama') {
    // Crisp, rhythmic chiptune-bell lead + punchy triangle bass for Cat Dama
    if (leadFreq > 0) {
      playTone(leadFreq, leadFreq * 1.002, 0.14, 'square', 0.014, 0);
      playTone(leadFreq, leadFreq, 0.16, 'triangle', 0.02, 0);
    }
    if (bassFreq > 0) {
      playTone(bassFreq, bassFreq, 0.18, 'triangle', 0.025, 0);
    }
  } else if (currentBgmTrack === 'snakes') {
    // Bouncy carnival adventure flute/xylophone lead + tuba sine bass for Snakes & Ladders
    if (leadFreq > 0) {
      playTone(leadFreq, leadFreq * 1.01, 0.15, 'triangle', 0.028, 0);
    }
    if (bassFreq > 0) {
      playTone(bassFreq, bassFreq * 0.99, 0.16, 'sine', 0.024, 0);
    }
  } else {
    // Cozy Music-Box Lead + Soft Sine Harmony for Main Menu
    if (leadFreq > 0) {
      playTone(leadFreq, leadFreq * 1.003, 0.19, 'triangle', 0.026, 0);
    }
    if (bassFreq > 0) {
      playTone(bassFreq, bassFreq, 0.26, 'sine', 0.02, 0);
    }
  }
}

export function setBgMusicTrack(track: BgmTrack): void {
  if (currentBgmTrack === track) return;
  currentBgmTrack = track;
  bgmStep = 0;
  if (bgmTimer !== null && typeof window !== 'undefined') {
    window.clearInterval(bgmTimer);
    bgmTimer = window.setInterval(playBgmStep, getTrackStepMs(currentBgmTrack));
  }
}

export function startBgMusicLoop(): void {
  if (typeof window === 'undefined' || mutedState || bgmTimer !== null) return;
  getAudioContext();
  bgmTimer = window.setInterval(playBgmStep, getTrackStepMs(currentBgmTrack));
}

function stopBgMusicLoop(): void {
  if (bgmTimer !== null && typeof window !== 'undefined') {
    window.clearInterval(bgmTimer);
    bgmTimer = null;
  }
}

if (typeof window !== 'undefined') {
  const unlockAndPlayBgm = () => {
    if (!mutedState) {
      startBgMusicLoop();
    }
  };
  window.addEventListener('pointerdown', unlockAndPlayBgm, { passive: true });
  window.addEventListener('keydown', unlockAndPlayBgm, { passive: true });
}

function playTone(
  freqStart: number,
  freqEnd: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.12,
  delaySec = 0
): void {
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

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(gainPeak, startTime + durationSec * 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, endTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(endTime + 0.01);
  } catch {
    // Ignore audio context errors on restricted devices
  }
}

export function playTapPop(): void {
  playTone(480, 680, 0.055, 'sine', 0.09);
}

export function playCatStep(): void {
  playTone(360, 620, 0.085, 'triangle', 0.11);
}

export function playCatPounceCapture(): void {
  playTone(300, 820, 0.11, 'triangle', 0.14, 0);
  playTone(620, 420, 0.09, 'sine', 0.12, 0.09);
}

export function playDizzySlide(): void {
  playTone(740, 220, 0.28, 'sine', 0.12);
}

export function playDiceRattle(): void {
  playTone(520, 740, 0.045, 'triangle', 0.08, 0);
  playTone(620, 840, 0.045, 'triangle', 0.08, 0.065);
  playTone(480, 790, 0.05, 'triangle', 0.09, 0.13);
}

export function playReactionChime(): void {
  playTone(659.25, 659.25, 0.08, 'sine', 0.09, 0);
  playTone(880, 880, 0.12, 'sine', 0.1, 0.07);
}

export function playCatMeow(): void {
  // Playful upward-then-sweet-dip kawaii cat "mew~"
  playTone(540, 920, 0.14, 'triangle', 0.13, 0);
  playTone(920, 680, 0.18, 'sine', 0.12, 0.11);
}

export function playCatAngryMeow(): void {
  // Feisty grumpy cat yowl + mini hiss ("Mrrrow~!")
  playTone(760, 390, 0.13, 'sawtooth', 0.08, 0);
  playTone(620, 310, 0.16, 'triangle', 0.11, 0.09);
}

export function playTurnBannerPop(): void {
  playTone(523.25, 659.25, 0.07, 'sine', 0.06, 0);
  playTone(783.99, 783.99, 0.09, 'triangle', 0.06, 0.05);
}

export function playShuffleTick(stepIndex = 0): void {
  const baseFreq = stepIndex % 2 === 0 ? 587.33 : 698.46;
  playTone(baseFreq, baseFreq * 1.12, 0.055, 'triangle', 0.095, 0);
}

export function playPowerupReveal(): void {
  const notes = [587.33, 739.99, 880, 1174.66];
  notes.forEach((freq, idx) => {
    playTone(freq, freq * 1.03, 0.13, 'triangle', 0.12, idx * 0.065);
  });
}

export function playComboFanfare(comboCount: number): void {
  const base = 440 + Math.min(4, comboCount) * 80;
  playTone(base, base * 1.25, 0.11, 'triangle', 0.14, 0);
  playTone(base * 1.25, base * 1.5, 0.12, 'triangle', 0.15, 0.08);
  playTone(base * 1.5, base * 2, 0.18, 'sine', 0.15, 0.16);
}

export function playAscensionChime(): void {
  // Celestial royal evolution arpeggio
  const notes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5];
  notes.forEach((freq, idx) => {
    playTone(freq, freq * 1.01, 0.18, 'triangle', 0.13, idx * 0.07);
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
    playTone(freq, freq * 1.015, dur, 'triangle', 0.14, delay);
  });
}
