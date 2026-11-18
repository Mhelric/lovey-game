import { PlayerSlot } from '../types/arcade';

const STORAGE_USED_WORDS_KEY = 'lovey_doodle_used_words_v1';
const MAX_STORED_USED_WORDS = 600;

function cryptoRandomFloat(): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 4294967296;
  }
  return Math.random();
}

function shuffleWithCrypto<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(cryptoRandomFloat() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export type DoodleDifficulty = 'easy' | 'medium' | 'hard' | 'final';

export interface DoodlePoint {
  x: number; // 0 to 1000 normalized
  y: number; // 0 to 650 normalized
}

export interface DoodleStroke {
  id: string;
  color: string;
  width: number;
  points: DoodlePoint[];
}

export interface DoodleWordOption {
  word: string;
  difficulty: DoodleDifficulty;
}

export interface DoodleGuessAttempt {
  id: string;
  slot: PlayerSlot;
  text: string;
  isCorrect: boolean;
  timestamp: number;
}

export const DOODLE_TOTAL_ROUNDS = 8;

export interface DoodleGameState {
  matchSeed: number;
  round: number; // 1 to 8 (2 Easy -> 2 Medium -> 2 Hard -> 2 Final)
  totalRounds: number; // 8
  difficulty: DoodleDifficulty;
  phase: 'word_selection' | 'drawing' | 'guessing' | 'round_summary' | 'game_over';
  drawerSlot: PlayerSlot;
  guesserSlot: PlayerSlot;
  turn: PlayerSlot;
  wordChoices: DoodleWordOption[];
  selectedWord: string | null;
  usedWords?: string[];
  strokes: DoodleStroke[];
  guesses: DoodleGuessAttempt[];
  guessesLeft: number; // 3 guesses per round in 'guessing' phase
  roundSecondsLeft: number; // 60 seconds in 'drawing' phase
  revealedHintIndices: number[];
  p1Score: number;
  p2Score: number;
  lastRoundOutcome?: {
    id: string;
    word: string;
    guesserGuessedCorrectly: boolean;
    pointsAwardedGuesser: number;
    pointsAwardedDrawer: number;
    summaryMessage: string;
  };
  winner: PlayerSlot | 'draw' | null;
}

export const DOODLE_ROUND_TIME_SEC = 60;
export const DOODLE_MAX_GUESSES = 3;

export const DOODLE_PALETTE: readonly string[] = [
  '#5B2A4E', // Ink Purple
  '#FF4D6D', // Sweet Berry
  '#FFBE0B', // Sunshine Gold
  '#10B981', // Mint Leaf
  '#38BDF8', // Sky Blue
  '#A855F7', // Royal Lavender
  '#FB923C', // Warm Orange
  '#84CC16', // Lime Pop
];

export const DOODLE_STROKE_WIDTHS = [
  { label: 'Thin', value: 10 },
  { label: 'Medium', value: 20 },
  { label: 'Thick', value: 34 },
] as const;

export function getDoodleDifficultyInfo(round: number): {
  id: DoodleDifficulty;
  label: string;
} {
  if (round <= 2) return { id: 'easy', label: 'Easy' };
  if (round <= 4) return { id: 'medium', label: 'Medium' };
  if (round <= 6) return { id: 'hard', label: 'Hard' };
  return { id: 'final', label: 'Final' };
}

export function getMaxGuessesForDifficulty(difficulty: DoodleDifficulty): number {
  return difficulty === 'hard' || difficulty === 'final' ? 5 : 3;
}

const RAW_DOODLE_WORDS: Record<DoodleDifficulty, string> = {
  easy: 'ACORN|ANCHOR|BALLOON|BANANA|CACTUS|CAMERA|CANDLE|COMPASS|COOKIE|CROWN|DONUT|GUITAR|IGLOO|LANTERN|MUSHROOM|PRETZEL',
  medium:
    'AIRPLANE|AVOCADO|BACKPACK|BICYCLE|BINOCULARS|BOOMERANG|BUTTERFLY|CAMPFIRE|CHAMELEON|CROISSANT|CUPCAKE|DINOSAUR|DOLPHIN|FLAMINGO|HAMMOCK|PINEAPPLE',
  hard: 'ACCORDION|ASTRONAUT|BATTLESHIP|BLACKSMITH|CATAPULT|CHANDELIER|CLAW MACHINE|CUCKOO CLOCK|DREAMCATCHER|EXCAVATOR|FIRE HYDRANT|GRAMOPHONE|HELICOPTER|JELLYFISH|MICROSCOPE|SEAHORSE',
  final:
    'ALCHEMIST LAB|AURORA BOREALIS|CAROUSEL HORSE|COLOSSEUM|DEEP SEA DIVER|EGYPTIAN PYRAMID|EIFFEL TOWER|FERRIS WHEEL|GINGERBREAD HOUSE|HOT AIR BALLOON|LOCH NESS|MAGIC CARPET|PIRATE SHIP|ROLLERCOASTER|SPACE STATION|TREASURE CHEST',
};

const TIERS: readonly DoodleDifficulty[] = ['easy', 'medium', 'hard', 'final'];

const runtimeWordPools: Record<DoodleDifficulty, string[]> = {
  easy: RAW_DOODLE_WORDS.easy.split('|'),
  medium: RAW_DOODLE_WORDS.medium.split('|'),
  hard: RAW_DOODLE_WORDS.hard.split('|'),
  final: RAW_DOODLE_WORDS.final.split('|'),
};

export let DOODLE_WORDS: DoodleWordOption[] = TIERS.flatMap((difficulty) =>
  runtimeWordPools[difficulty].map((word) => ({
    word,
    difficulty,
  }))
);

let externalDictReady = false;
let externalDictPromise: Promise<void> | null = null;

export function loadExternalDoodleDictionary(): Promise<void> {
  if (externalDictReady || typeof window === 'undefined' || typeof fetch !== 'function') {
    return Promise.resolve();
  }
  if (externalDictPromise) {
    return externalDictPromise;
  }

  externalDictPromise = (async () => {
    try {
      const res = await fetch('/doodle-words.json');
      if (!res.ok) return;
      const data = (await res.json()) as Partial<Record<DoodleDifficulty, unknown>>;
      const seen = new Set<string>();

      for (const tier of TIERS) {
        const existing = runtimeWordPools[tier];
        const incoming = Array.isArray(data[tier]) ? data[tier] : [];
        const merged: string[] = [];

        for (const raw of [...incoming, ...existing]) {
          if (typeof raw !== 'string') continue;
          const clean = raw.trim().toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ');
          if (!clean || seen.has(clean)) continue;
          seen.add(clean);
          merged.push(clean);
        }

        if (merged.length > 0) {
          runtimeWordPools[tier] = merged;
        }
      }

      DOODLE_WORDS = TIERS.flatMap((difficulty) =>
        runtimeWordPools[difficulty].map((word) => ({
          word,
          difficulty,
        }))
      );
      externalDictReady = true;
    } catch {
      // Silent fallback to built-in emergency dictionary when offline/unavailable
    } finally {
      externalDictPromise = null;
    }
  })();

  return externalDictPromise;
}

if (typeof window !== 'undefined' && typeof fetch === 'function') {
  void loadExternalDoodleDictionary();
}

function loadUsedWordsHistory(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_USED_WORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((w): w is string => typeof w === 'string' && w.trim().length > 0)
      .map((w) => w.trim().toUpperCase());
  } catch {
    return [];
  }
}

function saveUsedWordsHistory(words: string[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_USED_WORDS_KEY,
      JSON.stringify(words.slice(-MAX_STORED_USED_WORDS))
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function recordUsedDoodleWords(
  words: readonly (string | null | undefined)[]
): void {
  const incoming = words
    .filter((w): w is string => typeof w === 'string' && w.trim().length > 0)
    .map((w) => w.trim().toUpperCase());
  if (incoming.length === 0) return;

  const existing = loadUsedWordsHistory();
  const seen = new Set(existing);
  let changed = false;

  for (const w of incoming) {
    if (!seen.has(w)) {
      seen.add(w);
      existing.push(w);
      changed = true;
    }
  }

  if (changed) {
    saveUsedWordsHistory(existing);
  }
}

export function pickRandomUniqueWord(
  difficulty: DoodleDifficulty = 'easy',
  matchUsedWords: readonly string[] = [],
  persist = true
): DoodleWordOption {
  const matchUsedSet = new Set(
    matchUsedWords
      .filter((w): w is string => typeof w === 'string' && w.trim().length > 0)
      .map((w) => w.trim().toUpperCase())
  );

  const historyList = loadUsedWordsHistory();
  const historySet = new Set(historyList);
  const tierPool = runtimeWordPools[difficulty] ?? [];

  let candidates = tierPool.filter(
    (w) => !matchUsedSet.has(w) && !historySet.has(w)
  );

  if (candidates.length === 0) {
    // All words in this tier were seen across previous matches; reset this tier's cross-match history while strictly preserving current matchUsedSet
    const tierSet = new Set(tierPool);
    const prunedHistory = historyList.filter((w) => !tierSet.has(w) || matchUsedSet.has(w));
    if (persist) {
      saveUsedWordsHistory(prunedHistory);
    }
    candidates = tierPool.filter((w) => !matchUsedSet.has(w));
  }

  if (candidates.length === 0) {
    const allWords = TIERS.flatMap((t) => runtimeWordPools[t]);
    candidates = allWords.filter((w) => !matchUsedSet.has(w));
    if (candidates.length === 0) {
      candidates = allWords;
    }
  }

  const shuffled = shuffleWithCrypto(candidates);
  const chosenWord = shuffled[Math.floor(cryptoRandomFloat() * shuffled.length)];

  if (persist && chosenWord) {
    recordUsedDoodleWords([chosenWord]);
  }

  return {
    word: chosenWord,
    difficulty,
  };
}

export function pickRandomWords(
  _seed: number,
  count = 3,
  difficulty: DoodleDifficulty = 'easy'
): DoodleWordOption[] {
  const selected: DoodleWordOption[] = [];
  const pickedSoFar: string[] = [];

  for (let i = 0; i < count; i++) {
    const next = pickRandomUniqueWord(difficulty, pickedSoFar, false);
    selected.push(next);
    pickedSoFar.push(next.word);
  }

  return selected;
}

export function createInitialDoodleState(
  seed = Date.now(),
  startingDrawer: PlayerSlot = 'p1'
): DoodleGameState {
  const difficulty: DoodleDifficulty = 'easy';
  const shouldPersist = seed !== 202612;
  const chosen = pickRandomUniqueWord(difficulty, [], shouldPersist);
  const wordUpper = chosen.word.toUpperCase();
  const guesser = startingDrawer === 'p1' ? 'p2' : 'p1';

  return {
    matchSeed: seed,
    round: 1,
    totalRounds: DOODLE_TOTAL_ROUNDS,
    difficulty,
    phase: 'drawing',
    drawerSlot: startingDrawer,
    guesserSlot: guesser,
    turn: startingDrawer,
    wordChoices: [chosen],
    selectedWord: wordUpper,
    usedWords: [wordUpper],
    strokes: [],
    guesses: [],
    guessesLeft: getMaxGuessesForDifficulty(difficulty),
    roundSecondsLeft: DOODLE_ROUND_TIME_SEC,
    revealedHintIndices: [],
    p1Score: 0,
    p2Score: 0,
    winner: null,
  };
}

export function isDoodleInProgress(state: DoodleGameState | null | undefined): boolean {
  if (!state || state.winner) return false;
  return Boolean(
    state.round > 1 ||
    state.strokes.length > 0 ||
    state.guesses.length > 0 ||
    state.p1Score > 0 ||
    state.p2Score > 0
  );
}

export function applySelectDoodleWord(
  state: DoodleGameState,
  wordOption: DoodleWordOption
): DoodleGameState {
  if (state.phase !== 'word_selection') return state;
  const wordUpper = wordOption.word.trim().toUpperCase();
  const nextUsed = Array.from(
    new Set([...(state.usedWords ?? []), wordUpper].filter(Boolean))
  );

  return {
    ...state,
    phase: 'drawing',
    turn: state.drawerSlot,
    selectedWord: wordUpper,
    usedWords: nextUsed,
    strokes: [],
    guesses: [],
    guessesLeft: getMaxGuessesForDifficulty(state.difficulty),
    roundSecondsLeft: DOODLE_ROUND_TIME_SEC,
    revealedHintIndices: [],
  };
}

export function applyAddDoodleStroke(
  state: DoodleGameState,
  stroke: DoodleStroke
): DoodleGameState {
  if (state.phase !== 'drawing') return state;

  return {
    ...state,
    strokes: [...state.strokes, stroke],
  };
}

export function applyUndoDoodleStroke(state: DoodleGameState): DoodleGameState {
  if (state.phase !== 'drawing' || state.strokes.length === 0) return state;
  return {
    ...state,
    strokes: state.strokes.slice(0, -1),
  };
}

export function applyClearDoodleStrokes(state: DoodleGameState): DoodleGameState {
  if (state.phase !== 'drawing') return state;
  return {
    ...state,
    strokes: [],
  };
}

/**
 * Transitions from 'drawing' (60s) to 'guessing' (3 or 5 guesses for the guesser).
 * Called either when the drawer taps "Done Drawing" or when the 60s timer hits 0.
 */
export function applyFinishDoodleDrawing(state: DoodleGameState): DoodleGameState {
  if (state.phase !== 'drawing' || !state.selectedWord) return state;

  return {
    ...state,
    phase: 'guessing',
    turn: state.guesserSlot,
    guessesLeft: getMaxGuessesForDifficulty(state.difficulty),
    roundSecondsLeft: 0,
  };
}

export function normalizeGuess(text: string): string {
  return text.trim().toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ');
}

export function checkWordMatch(guess: string, target: string): boolean {
  const cleanGuess = normalizeGuess(guess);
  const cleanTarget = normalizeGuess(target);
  if (!cleanGuess || !cleanTarget) return false;
  return cleanGuess === cleanTarget;
}

export function getMaskedWordDisplay(
  word: string | null,
  revealedIndices: number[]
): string {
  if (!word) return '';
  const revealedSet = new Set(revealedIndices);
  return word
    .split('')
    .map((char, idx) => {
      if (char === ' ') return '  ';
      if (revealedSet.has(idx)) return char;
      return '_';
    })
    .join(' ');
}

export function applySubmitDoodleGuess(
  state: DoodleGameState,
  guessText: string,
  slot: PlayerSlot
): DoodleGameState {
  if (state.phase !== 'guessing' || !state.selectedWord) return state;

  const cleanGuess = normalizeGuess(guessText);
  if (!cleanGuess) return state;

  const isCorrect = checkWordMatch(cleanGuess, state.selectedWord);
  const maxGuesses = getMaxGuessesForDifficulty(state.difficulty);
  const currentGuessesLeft = state.guessesLeft ?? maxGuesses;

  const newAttempt: DoodleGuessAttempt = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    slot,
    text: cleanGuess,
    isCorrect,
    timestamp: Date.now(),
  };

  const updatedGuesses = [newAttempt, ...state.guesses.slice(0, 19)];

  if (isCorrect) {
    // Guesser gets 2 points, Drawer gets 1 point!
    const guesserPts = 2;
    const drawerPts = 1;
    const nextP1 = state.p1Score + (state.guesserSlot === 'p1' ? guesserPts : drawerPts);
    const nextP2 = state.p2Score + (state.guesserSlot === 'p2' ? guesserPts : drawerPts);
    const triesUsed = maxGuesses - currentGuessesLeft + 1;

    return {
      ...state,
      phase: 'round_summary',
      guesses: updatedGuesses,
      guessesLeft: currentGuessesLeft - 1,
      p1Score: nextP1,
      p2Score: nextP2,
      lastRoundOutcome: {
        id: `outcome-${Date.now()}`,
        word: state.selectedWord,
        guesserGuessedCorrectly: true,
        pointsAwardedGuesser: guesserPts,
        pointsAwardedDrawer: drawerPts,
        summaryMessage: `Guessed on try ${triesUsed}/${maxGuesses}! (+2 Guesser, +1 Drawer)`,
      },
    };
  }

  const nextGuessesLeft = currentGuessesLeft - 1;

  if (nextGuessesLeft <= 0) {
    // Out of guesses! Drawer gets 2 points, Guesser gets 0 points.
    const guesserPts = 0;
    const drawerPts = 2;
    const nextP1 = state.p1Score + (state.guesserSlot === 'p1' ? guesserPts : drawerPts);
    const nextP2 = state.p2Score + (state.guesserSlot === 'p2' ? guesserPts : drawerPts);

    return {
      ...state,
      phase: 'round_summary',
      guesses: updatedGuesses,
      guessesLeft: 0,
      p1Score: nextP1,
      p2Score: nextP2,
      lastRoundOutcome: {
        id: `out-of-guesses-${Date.now()}`,
        word: state.selectedWord,
        guesserGuessedCorrectly: false,
        pointsAwardedGuesser: guesserPts,
        pointsAwardedDrawer: drawerPts,
        summaryMessage: `All ${maxGuesses} guesses used! Drawer earns +2 pts!`,
      },
    };
  }

  // Reveal a helpful letter hint after wrong guesses (1st letter, middle letter, and last letter on 5-life rounds)
  let revealed = state.revealedHintIndices;
  const wordChars = state.selectedWord.split('');
  const nonSpaceIndices = wordChars
    .map((c, i) => (c !== ' ' ? i : -1))
    .filter((i) => i !== -1);
  const missesSoFar = maxGuesses - nextGuessesLeft;

  if (missesSoFar >= 1 && revealed.length === 0 && nonSpaceIndices.length > 2) {
    revealed = [nonSpaceIndices[0]];
  } else if (missesSoFar >= 2 && revealed.length <= 1 && nonSpaceIndices.length > 4) {
    const nextHintIdx = nonSpaceIndices[Math.floor(nonSpaceIndices.length / 2)];
    if (!revealed.includes(nextHintIdx)) {
      revealed = [...revealed, nextHintIdx];
    }
  } else if (
    maxGuesses === 5 &&
    nextGuessesLeft <= 2 &&
    revealed.length === 2 &&
    nonSpaceIndices.length > 6
  ) {
    const lastHintIdx = nonSpaceIndices[nonSpaceIndices.length - 1];
    if (!revealed.includes(lastHintIdx)) {
      revealed = [...revealed, lastHintIdx];
    }
  }

  return {
    ...state,
    guesses: updatedGuesses,
    guessesLeft: nextGuessesLeft,
    revealedHintIndices: revealed,
  };
}

export function applyTickDoodleTimer(state: DoodleGameState): DoodleGameState {
  if (state.phase !== 'drawing' || !state.selectedWord) return state;

  const nextSec = state.roundSecondsLeft - 1;

  if (nextSec <= 0) {
    // 60s drawing timer finished -> hand over to the Guesser for their 3 guesses!
    return applyFinishDoodleDrawing(state);
  }

  return {
    ...state,
    roundSecondsLeft: nextSec,
  };
}

export function applyNextDoodleRound(state: DoodleGameState): DoodleGameState {
  if (state.phase !== 'round_summary') return state;

  if (state.round >= state.totalRounds) {
    // 8-round match finished (2 Easy, 2 Medium, 2 Hard, 2 Final)! Highest score wins the Cat Doodle Trophy.
    let winner: PlayerSlot | 'draw' | null = null;
    if (state.p1Score > state.p2Score) winner = 'p1';
    else if (state.p2Score > state.p1Score) winner = 'p2';
    else winner = 'draw';

    return {
      ...state,
      phase: 'game_over',
      winner,
    };
  }

  const nextRound = state.round + 1;
  const nextDifficulty = getDoodleDifficultyInfo(nextRound).id;
  const nextDrawer: PlayerSlot = state.drawerSlot === 'p1' ? 'p2' : 'p1';
  const nextGuesser: PlayerSlot = nextDrawer === 'p1' ? 'p2' : 'p1';
  const priorUsed = Array.from(
    new Set(
      [
        ...(state.usedWords ?? []),
        ...(state.selectedWord ? [state.selectedWord] : []),
      ]
        .map((w) => w.trim().toUpperCase())
        .filter(Boolean)
    )
  );
  const chosen = pickRandomUniqueWord(nextDifficulty, priorUsed, true);
  const wordUpper = chosen.word.toUpperCase();

  return {
    ...state,
    round: nextRound,
    difficulty: nextDifficulty,
    phase: 'drawing',
    drawerSlot: nextDrawer,
    guesserSlot: nextGuesser,
    turn: nextDrawer,
    wordChoices: [chosen],
    selectedWord: wordUpper,
    usedWords: Array.from(new Set([...priorUsed, wordUpper])),
    strokes: [],
    guesses: [],
    guessesLeft: getMaxGuessesForDifficulty(nextDifficulty),
    roundSecondsLeft: DOODLE_ROUND_TIME_SEC,
    revealedHintIndices: [],
    lastRoundOutcome: undefined,
  };
}
