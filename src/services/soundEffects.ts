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
   CUTESY VIBRANT KAWAII BACKGROUND MUSIC LOOP (0 KB Web Audio Synth)
   ========================================================================== */
const BGM_MELODY: readonly [number, number][] = [
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

let bgmTimer: number | null = null;
let bgmStep = 0;

function playBgmStep(): void {
  if (mutedState) return;
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== 'running') return;

  const [leadFreq, bassFreq] = BGM_MELODY[bgmStep % BGM_MELODY.length];
  bgmStep = (bgmStep + 1) % BGM_MELODY.length;

  // Plucky Marimba / Music-Box Lead Note
  if (leadFreq > 0) {
    playTone(leadFreq, leadFreq * 1.003, 0.19, 'triangle', 0.026, 0);
  }
  // Warm Soft Harmony / Bass Note
  if (bassFreq > 0) {
    playTone(bassFreq, bassFreq, 0.26, 'sine', 0.02, 0);
  }
}

export function startBgMusicLoop(): void {
  if (typeof window === 'undefined' || mutedState || bgmTimer !== null) return;
  getAudioContext();
  bgmTimer = window.setInterval(playBgmStep, 240);
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

export function playVictoryFanfare(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    playTone(freq, freq * 1.02, 0.16, 'triangle', 0.13, idx * 0.095);
  });
}
