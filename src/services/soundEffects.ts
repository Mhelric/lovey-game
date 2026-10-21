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
  return mutedState;
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
