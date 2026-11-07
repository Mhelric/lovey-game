import { PlayerSlot } from '../types/arcade';

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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
  hint: string;
  category: string;
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
  selectedCategory: string | null;
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

export const DOODLE_WORDS: readonly DoodleWordOption[] = [
  // Round 1: EASY (Simple shapes, everyday objects & foods)
  { word: 'APPLE', hint: 'Crisp fruit with a stem', category: 'Food', difficulty: 'easy' },
  { word: 'SUN', hint: 'Bright yellow shining star', category: 'Nature', difficulty: 'easy' },
  { word: 'MOON', hint: 'Nighttime crescent in the sky', category: 'Nature', difficulty: 'easy' },
  { word: 'STAR', hint: 'Five-pointed glowing night light', category: 'Nature', difficulty: 'easy' },
  { word: 'TREE', hint: 'Tall trunk with green leaves', category: 'Nature', difficulty: 'easy' },
  { word: 'EGG', hint: 'Breakfast oval or sunny side up', category: 'Food', difficulty: 'easy' },
  { word: 'DONUT', hint: 'Sweet ring with glaze', category: 'Food', difficulty: 'easy' },
  { word: 'PIZZA', hint: 'Cheesy slice with toppings', category: 'Food', difficulty: 'easy' },
  { word: 'FLOWER', hint: 'Blooming garden petals', category: 'Nature', difficulty: 'easy' },
  { word: 'CLOUD', hint: 'Puffy white sky shape', category: 'Nature', difficulty: 'easy' },
  { word: 'HEART', hint: 'Symbol of pure love', category: 'Symbol', difficulty: 'easy' },
  { word: 'BALLOON', hint: 'Floating party sphere on string', category: 'Object', difficulty: 'easy' },
  { word: 'BOOK', hint: 'Bound pages with stories', category: 'Object', difficulty: 'easy' },
  { word: 'HAT', hint: 'Headwear for warmth or shade', category: 'Object', difficulty: 'easy' },
  { word: 'COOKIE', hint: 'Baked chocolate chip circle', category: 'Food', difficulty: 'easy' },
  { word: 'CANDLE', hint: 'Wax stick with glowing flame', category: 'Object', difficulty: 'easy' },
  { word: 'KEY', hint: 'Small metal door unlocker', category: 'Object', difficulty: 'easy' },
  { word: 'LOLLIPOP', hint: 'Sweet candy swirl on a stick', category: 'Food', difficulty: 'easy' },
  { word: 'BANANA', hint: 'Peelable yellow curved fruit', category: 'Food', difficulty: 'easy' },
  { word: 'MUSHROOM', hint: 'Spotted forest cap with stem', category: 'Nature', difficulty: 'easy' },

  // Round 2: MEDIUM (Animals, snacks, wearable items & fun objects)
  { word: 'BURGER', hint: 'Juicy patty stacked in a bun', category: 'Food', difficulty: 'medium' },
  { word: 'ICE CREAM', hint: 'Cold scoop on a crunchy cone', category: 'Food', difficulty: 'medium' },
  { word: 'WATERMELON', hint: 'Green rind with seeded pink slice', category: 'Food', difficulty: 'medium' },
  { word: 'TACO', hint: 'Folded shell with savory filling', category: 'Food', difficulty: 'medium' },
  { word: 'RABBIT', hint: 'Hopper with long fluffy ears', category: 'Animal', difficulty: 'medium' },
  { word: 'TURTLE', hint: 'Slow crawler with hard shell', category: 'Animal', difficulty: 'medium' },
  { word: 'DUCK', hint: 'Quacking pond swimmer', category: 'Animal', difficulty: 'medium' },
  { word: 'SNAIL', hint: 'Slow garden mover with spiral shell', category: 'Animal', difficulty: 'medium' },
  { word: 'BUTTERFLY', hint: 'Colorful symmetrical winged insect', category: 'Animal', difficulty: 'medium' },
  { word: 'UMBRELLA', hint: 'Canopy shelter from the rain', category: 'Object', difficulty: 'medium' },
  { word: 'GUITAR', hint: 'Six-stringed musical instrument', category: 'Object', difficulty: 'medium' },
  { word: 'SUNGLASSES', hint: 'Cool tinted shades for sunny days', category: 'Object', difficulty: 'medium' },
  { word: 'CROWN', hint: 'Regal golden royal headwear', category: 'Object', difficulty: 'medium' },
  { word: 'KITE', hint: 'Wind-soaring diamond on string', category: 'Object', difficulty: 'medium' },
  { word: 'RAINBOW', hint: 'Colorful arc across the sky', category: 'Nature', difficulty: 'medium' },
  { word: 'SNOWMAN', hint: 'Three stacked snowballs with carrot nose', category: 'Nature', difficulty: 'medium' },
  { word: 'CACTUS', hint: 'Prickly desert green plant', category: 'Nature', difficulty: 'medium' },
  { word: 'ROCKET', hint: 'Spaceship blasting to the stars', category: 'Vehicle', difficulty: 'medium' },
  { word: 'CAMERA', hint: 'Lens box that snaps photos', category: 'Object', difficulty: 'medium' },
  { word: 'CLOCK', hint: 'Ticking hands tell the hour', category: 'Object', difficulty: 'medium' },

  // Round 3: HARD (Detailed creatures, vehicles, places & gear)
  { word: 'ELEPHANT', hint: 'Giant mammal with trunk and tusks', category: 'Animal', difficulty: 'hard' },
  { word: 'GIRAFFE', hint: 'Spotted animal with towering neck', category: 'Animal', difficulty: 'hard' },
  { word: 'PENGUIN', hint: 'Waddling tuxedo bird on ice', category: 'Animal', difficulty: 'hard' },
  { word: 'OCTOPUS', hint: 'Sea creature with eight tentacles', category: 'Animal', difficulty: 'hard' },
  { word: 'DOLPHIN', hint: 'Acrobatic jumping ocean mammal', category: 'Animal', difficulty: 'hard' },
  { word: 'PANDA', hint: 'Bamboo-munching black and white bear', category: 'Animal', difficulty: 'hard' },
  { word: 'BICYCLE', hint: 'Handlebars, two pedals, and two wheels', category: 'Vehicle', difficulty: 'hard' },
  { word: 'HELICOPTER', hint: 'Aircraft with spinning top blades', category: 'Vehicle', difficulty: 'hard' },
  { word: 'SAILBOAT', hint: 'Wind-powered vessel on the waves', category: 'Vehicle', difficulty: 'hard' },
  { word: 'VOLCANO', hint: 'Erupting peak spewing hot lava', category: 'Nature', difficulty: 'hard' },
  { word: 'ISLAND', hint: 'Lonely patch of sand with palm tree', category: 'Place', difficulty: 'hard' },
  { word: 'CAMPFIRE', hint: 'Crackling logs and roasting marshmallows', category: 'Nature', difficulty: 'hard' },
  { word: 'BACKPACK', hint: 'Zippered bag worn on both shoulders', category: 'Object', difficulty: 'hard' },
  { word: 'SCISSORS', hint: 'Crossed metal blades that snip paper', category: 'Object', difficulty: 'hard' },
  { word: 'POPCORN', hint: 'Striped tub of buttery movie kernels', category: 'Food', difficulty: 'hard' },
  { word: 'SUSHI', hint: 'Seaweed rice roll with chopsticks', category: 'Food', difficulty: 'hard' },
  { word: 'HEADPHONES', hint: 'Cushioned speakers worn over the ears', category: 'Object', difficulty: 'hard' },
  { word: 'TELESCOPE', hint: 'Long optical tube for stargazing', category: 'Object', difficulty: 'hard' },

  // Round 4: FINAL (Showstopper scenes, epic creatures & complex concepts)
  { word: 'DINOSAUR', hint: 'Prehistoric giant reptile with tail', category: 'Creature', difficulty: 'final' },
  { word: 'DRAGON', hint: 'Mythical winged fire-breather', category: 'Creature', difficulty: 'final' },
  { word: 'MERMAID', hint: 'Ocean dweller with fish tail', category: 'Creature', difficulty: 'final' },
  { word: 'ASTRONAUT', hint: 'Space explorer in helmet and suit', category: 'Person', difficulty: 'final' },
  { word: 'CASTLE', hint: 'Medieval stone fortress with towers', category: 'Place', difficulty: 'final' },
  { word: 'LIGHTHOUSE', hint: 'Coastal tower guiding ships at night', category: 'Place', difficulty: 'final' },
  { word: 'TREEHOUSE', hint: 'Cozy wooden hideout high in branches', category: 'Place', difficulty: 'final' },
  { word: 'ROLLERCOASTER', hint: 'Looping thrill ride on steep tracks', category: 'Place', difficulty: 'final' },
  { word: 'TREASURE CHEST', hint: 'Locked pirate box overflowing with gold', category: 'Object', difficulty: 'final' },
  { word: 'HOT AIR BALLOON', hint: 'Giant floating basket in the clouds', category: 'Vehicle', difficulty: 'final' },
  { word: 'SUBMARINE', hint: 'Underwater vessel with a periscope', category: 'Vehicle', difficulty: 'final' },
  { word: 'TIME MACHINE', hint: 'Futuristic portal or clockwork pod', category: 'Concept', difficulty: 'final' },
  { word: 'WATERFALL', hint: 'Rushing river plunging down a cliff', category: 'Nature', difficulty: 'final' },
  { word: 'CHANDELIER', hint: 'Ornate hanging ceiling light with crystals', category: 'Object', difficulty: 'final' },
  { word: 'SANDCASTLE', hint: 'Sculpted beach fortress with buckets', category: 'Object', difficulty: 'final' },
  { word: 'FERRIS WHEEL', hint: 'Giant rotating carnival observation wheel', category: 'Place', difficulty: 'final' },
];

export function pickRandomWords(
  seed: number,
  count = 3,
  difficulty: DoodleDifficulty = 'easy'
): DoodleWordOption[] {
  const rand = mulberry32(seed);
  const filtered = DOODLE_WORDS.filter((w) => w.difficulty === difficulty);
  const pool = filtered.length >= count ? [...filtered] : [...DOODLE_WORDS];
  const selected: DoodleWordOption[] = [];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(rand() * pool.length);
    selected.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return selected;
}

export function createInitialDoodleState(
  seed = Date.now(),
  startingDrawer: PlayerSlot = 'p1'
): DoodleGameState {
  const difficulty: DoodleDifficulty = 'easy';
  const choices = pickRandomWords(seed, 3, difficulty);
  const guesser = startingDrawer === 'p1' ? 'p2' : 'p1';

  return {
    matchSeed: seed,
    round: 1,
    totalRounds: DOODLE_TOTAL_ROUNDS,
    difficulty,
    phase: 'word_selection',
    drawerSlot: startingDrawer,
    guesserSlot: guesser,
    turn: startingDrawer,
    wordChoices: choices,
    selectedWord: null,
    selectedCategory: null,
    strokes: [],
    guesses: [],
    guessesLeft: DOODLE_MAX_GUESSES,
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
    state.phase !== 'word_selection' ||
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

  return {
    ...state,
    phase: 'drawing',
    turn: state.drawerSlot,
    selectedWord: wordOption.word.toUpperCase(),
    selectedCategory: wordOption.category,
    strokes: [],
    guesses: [],
    guessesLeft: DOODLE_MAX_GUESSES,
    roundSecondsLeft: DOODLE_ROUND_TIME_SEC,
    revealedHintIndices: [],
  };
}

export function applyAddDoodleStroke(
  state: DoodleGameState,
  stroke: DoodleStroke
): DoodleGameState {
  if (state.phase !== 'drawing') return state;
  // Guard max 45 strokes to strictly respect hardware constraints
  const updatedStrokes = state.strokes.length >= 45
    ? [...state.strokes.slice(1), stroke]
    : [...state.strokes, stroke];

  return {
    ...state,
    strokes: updatedStrokes,
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
 * Transitions from 'drawing' (60s) to 'guessing' (3 guesses for the guesser).
 * Called either when the drawer taps "Done Drawing" or when the 60s timer hits 0.
 */
export function applyFinishDoodleDrawing(state: DoodleGameState): DoodleGameState {
  if (state.phase !== 'drawing' || !state.selectedWord) return state;

  return {
    ...state,
    phase: 'guessing',
    turn: state.guesserSlot,
    guessesLeft: DOODLE_MAX_GUESSES,
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
  const currentGuessesLeft = state.guessesLeft ?? DOODLE_MAX_GUESSES;

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
    const triesUsed = DOODLE_MAX_GUESSES - currentGuessesLeft + 1;

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
        summaryMessage: `Guessed on try ${triesUsed}/${DOODLE_MAX_GUESSES}! (+2 Guesser, +1 Drawer)`,
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
        summaryMessage: 'All 3 guesses used! Drawer earns +2 pts!',
      },
    };
  }

  // Reveal a helpful letter hint after each wrong guess (1st letter after 1st miss, middle letter after 2nd miss)
  let revealed = state.revealedHintIndices;
  const wordChars = state.selectedWord.split('');
  const nonSpaceIndices = wordChars
    .map((c, i) => (c !== ' ' ? i : -1))
    .filter((i) => i !== -1);

  if (nextGuessesLeft === 2 && revealed.length === 0 && nonSpaceIndices.length > 2) {
    revealed = [nonSpaceIndices[0]];
  } else if (nextGuessesLeft === 1 && revealed.length <= 1 && nonSpaceIndices.length > 4) {
    const nextHintIdx = nonSpaceIndices[Math.floor(nonSpaceIndices.length / 2)];
    if (!revealed.includes(nextHintIdx)) {
      revealed = [...revealed, nextHintIdx];
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
  const nextSeed = (state.matchSeed + nextRound * 97) % 1000000;
  const nextChoices = pickRandomWords(nextSeed, 3, nextDifficulty);

  return {
    ...state,
    round: nextRound,
    difficulty: nextDifficulty,
    phase: 'word_selection',
    drawerSlot: nextDrawer,
    guesserSlot: nextGuesser,
    turn: nextDrawer,
    wordChoices: nextChoices,
    selectedWord: null,
    selectedCategory: null,
    strokes: [],
    guesses: [],
    guessesLeft: DOODLE_MAX_GUESSES,
    roundSecondsLeft: DOODLE_ROUND_TIME_SEC,
    revealedHintIndices: [],
    lastRoundOutcome: undefined,
  };
}
