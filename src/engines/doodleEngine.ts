import { PlayerSlot } from '../types/arcade';

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DoodlePoint {
  x: number; // 0 to 1000 normalized
  y: number; // 0 to 1000 normalized
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
}

export interface DoodleGuessAttempt {
  id: string;
  slot: PlayerSlot;
  text: string;
  isCorrect: boolean;
  timestamp: number;
}

export interface DoodleGameState {
  matchSeed: number;
  round: number; // 1 to 4
  totalRounds: number; // 4
  phase: 'word_selection' | 'drawing' | 'round_summary' | 'game_over';
  drawerSlot: PlayerSlot;
  guesserSlot: PlayerSlot;
  turn: PlayerSlot;
  wordChoices: DoodleWordOption[];
  selectedWord: string | null;
  selectedCategory: string | null;
  strokes: DoodleStroke[];
  guesses: DoodleGuessAttempt[];
  roundSecondsLeft: number;
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

export const DOODLE_ROUND_TIME_SEC = 50;

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
  { label: 'Thin', value: 14 },
  { label: 'Medium', value: 26 },
  { label: 'Thick', value: 44 },
] as const;

export const DOODLE_WORDS: readonly DoodleWordOption[] = [
  // Food & Drinks
  { word: 'PIZZA', hint: 'Cheesy slice with toppings', category: 'Food' },
  { word: 'BURGER', hint: 'Juicy patty in a bun', category: 'Food' },
  { word: 'SUSHI', hint: 'Rice roll with seaweed', category: 'Food' },
  { word: 'DONUT', hint: 'Sweet ring with glaze', category: 'Food' },
  { word: 'APPLE', hint: 'Crisp fruit with a stem', category: 'Food' },
  { word: 'BANANA', hint: 'Peelable yellow curve', category: 'Food' },
  { word: 'TACO', hint: 'Folded tortilla with filling', category: 'Food' },
  { word: 'COOKIE', hint: 'Baked chocolate chip treat', category: 'Food' },
  { word: 'CAKE', hint: 'Frosted celebration dessert', category: 'Food' },
  { word: 'ICE CREAM', hint: 'Cold scoop on a crunchy cone', category: 'Food' },
  { word: 'CHEESE', hint: 'Yellow block with holes', category: 'Food' },
  { word: 'COFFEE', hint: 'Steaming morning cup', category: 'Food' },
  { word: 'POPCORN', hint: 'Puffy movie theater snack', category: 'Food' },
  { word: 'STRAWBERRY', hint: 'Red heart-shaped berry', category: 'Food' },
  { word: 'WATERMELON', hint: 'Green rind with pink slice', category: 'Food' },
  { word: 'LOLLIPOP', hint: 'Sweet swirl on a stick', category: 'Food' },
  { word: 'HOTDOG', hint: 'Sausage in an elongated bun', category: 'Food' },
  { word: 'EGG', hint: 'Breakfast oval or sunny side up', category: 'Food' },

  // Animals & Creatures
  { word: 'ELEPHANT', hint: 'Large giant with long trunk', category: 'Animal' },
  { word: 'GIRAFFE', hint: 'Tall animal with long neck', category: 'Animal' },
  { word: 'PENGUIN', hint: 'Flightless tuxedo bird', category: 'Animal' },
  { word: 'MONKEY', hint: 'Playful banana lover', category: 'Animal' },
  { word: 'DOLPHIN', hint: 'Jumping ocean mammal', category: 'Animal' },
  { word: 'BUTTERFLY', hint: 'Colorful winged flutterer', category: 'Animal' },
  { word: 'RABBIT', hint: 'Hop hop with long ears', category: 'Animal' },
  { word: 'PANDA', hint: 'Bamboo eating black-and-white bear', category: 'Animal' },
  { word: 'OCTOPUS', hint: 'Eight wiggly ocean arms', category: 'Animal' },
  { word: 'LION', hint: 'Brave king with fluffy mane', category: 'Animal' },
  { word: 'TURTLE', hint: 'Slow crawler with hard shell', category: 'Animal' },
  { word: 'FROG', hint: 'Green ribbit pond hopper', category: 'Animal' },
  { word: 'OWL', hint: 'Wise nocturnal wide-eyed bird', category: 'Animal' },
  { word: 'DUCK', hint: 'Quacking water bird', category: 'Animal' },
  { word: 'BEE', hint: 'Buzzing honey maker with stripes', category: 'Animal' },
  { word: 'CRAB', hint: 'Sideways beach scuttler with claws', category: 'Animal' },
  { word: 'WHALE', hint: 'Giant ocean spout blower', category: 'Animal' },
  { word: 'DINOSAUR', hint: 'Ancient prehistoric lizard', category: 'Animal' },
  { word: 'FOX', hint: 'Clever woodland tail fluffer', category: 'Animal' },
  { word: 'SNAIL', hint: 'Slow mover with spiral shell', category: 'Animal' },

  // Objects & Clothing
  { word: 'GUITAR', hint: 'Strummed string instrument', category: 'Object' },
  { word: 'UMBRELLA', hint: 'Shelter from the rain', category: 'Object' },
  { word: 'BICYCLE', hint: 'Two pedals and two wheels', category: 'Object' },
  { word: 'CAMERA', hint: 'Device to snap photos', category: 'Object' },
  { word: 'CLOCK', hint: 'Ticking hands tell the hour', category: 'Object' },
  { word: 'BACKPACK', hint: 'Bag worn over both shoulders', category: 'Object' },
  { word: 'SUNGLASSES', hint: 'Tinted shades for sunny days', category: 'Object' },
  { word: 'KEY', hint: 'Small metal unlocker', category: 'Object' },
  { word: 'SCISSORS', hint: 'Two blades that snip paper', category: 'Object' },
  { word: 'LAMP', hint: 'Cozy light beside the bed', category: 'Object' },
  { word: 'CANDLE', hint: 'Wax stick with glowing wick', category: 'Object' },
  { word: 'SHOE', hint: 'Laced footwear', category: 'Object' },
  { word: 'BOOK', hint: 'Bound pages with stories', category: 'Object' },
  { word: 'CROWN', hint: 'Regal royal headwear', category: 'Object' },
  { word: 'BALLOON', hint: 'Floating party sphere on string', category: 'Object' },
  { word: 'RING', hint: 'Sparkling jewelry circle', category: 'Object' },
  { word: 'TELEPHONE', hint: 'Device used to call people', category: 'Object' },
  { word: 'TOOTHBRUSH', hint: 'Bristles that clean your teeth', category: 'Object' },
  { word: 'KITE', hint: 'Wind-soaring diamond on string', category: 'Object' },
  { word: 'HAT', hint: 'Headwear for warmth or fashion', category: 'Object' },

  // Nature, Places & Weather
  { word: 'RAINBOW', hint: 'Colorful arc across the sky', category: 'Nature' },
  { word: 'VOLCANO', hint: 'Mountain that spews red lava', category: 'Nature' },
  { word: 'MOUNTAIN', hint: 'Rocky towering snowy peak', category: 'Nature' },
  { word: 'SUN', hint: 'Bright yellow shining star', category: 'Nature' },
  { word: 'MOON', hint: 'Nighttime crescent in the sky', category: 'Nature' },
  { word: 'TREE', hint: 'Tall trunk with green leaves', category: 'Nature' },
  { word: 'FLOWER', hint: 'Blooming garden petals', category: 'Nature' },
  { word: 'CLOUD', hint: 'Puffy white sky shape', category: 'Nature' },
  { word: 'SNOWMAN', hint: 'Three stacked snowballs with carrot nose', category: 'Nature' },
  { word: 'CAMPFIRE', hint: 'Crackling outdoor wood fire', category: 'Nature' },
  { word: 'STAR', hint: 'Five-pointed glowing night light', category: 'Nature' },
  { word: 'LIGHTNING', hint: 'Zigzag flash in a storm', category: 'Nature' },
  { word: 'ISLAND', hint: 'Patch of sand with palm tree', category: 'Nature' },
  { word: 'CACTUS', hint: 'Prickly desert green plant', category: 'Nature' },
  { word: 'MUSHROOM', hint: 'Forest cap with stem', category: 'Nature' },
  { word: 'CASTLE', hint: 'Stone fortress with towers', category: 'Nature' },
  { word: 'ROCKET', hint: 'Spaceship blasting to the stars', category: 'Nature' },
  { word: 'HEART', hint: 'Symbol of pure love and cuddles', category: 'Nature' },
];

export function pickRandomWords(seed: number, count = 3): DoodleWordOption[] {
  const rand = mulberry32(seed);
  const pool = [...DOODLE_WORDS];
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
  const choices = pickRandomWords(seed, 3);
  const guesser = startingDrawer === 'p1' ? 'p2' : 'p1';

  return {
    matchSeed: seed,
    round: 1,
    totalRounds: 4,
    phase: 'word_selection',
    drawerSlot: startingDrawer,
    guesserSlot: guesser,
    turn: startingDrawer,
    wordChoices: choices,
    selectedWord: null,
    selectedCategory: null,
    strokes: [],
    guesses: [],
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
    selectedWord: wordOption.word.toUpperCase(),
    selectedCategory: wordOption.category,
    strokes: [],
    guesses: [],
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

export function calculateDoodlePoints(secondsLeft: number): { guesser: number; drawer: number } {
  // Speed bonus for guesser: 150 base + up to 150 speed bonus
  const speedBonus = Math.round((Math.max(0, secondsLeft) / DOODLE_ROUND_TIME_SEC) * 150);
  const guesserPoints = 150 + speedBonus;
  const drawerPoints = 150; // Drawer gets rewarded for drawing clearly
  return { guesser: guesserPoints, drawer: drawerPoints };
}

export function applySubmitDoodleGuess(
  state: DoodleGameState,
  guessText: string,
  slot: PlayerSlot
): DoodleGameState {
  if (state.phase !== 'drawing' || !state.selectedWord) return state;

  const cleanGuess = normalizeGuess(guessText);
  if (!cleanGuess) return state;

  const isCorrect = checkWordMatch(cleanGuess, state.selectedWord);

  const newAttempt: DoodleGuessAttempt = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    slot,
    text: cleanGuess,
    isCorrect,
    timestamp: Date.now(),
  };

  const updatedGuesses = [newAttempt, ...state.guesses.slice(0, 19)]; // keep 20 recent

  if (isCorrect) {
    const { guesser, drawer } = calculateDoodlePoints(state.roundSecondsLeft);
    const nextP1 = state.p1Score + (state.guesserSlot === 'p1' ? guesser : drawer);
    const nextP2 = state.p2Score + (state.guesserSlot === 'p2' ? guesser : drawer);

    return {
      ...state,
      phase: 'round_summary',
      guesses: updatedGuesses,
      p1Score: nextP1,
      p2Score: nextP2,
      lastRoundOutcome: {
        id: `outcome-${Date.now()}`,
        word: state.selectedWord,
        guesserGuessedCorrectly: true,
        pointsAwardedGuesser: guesser,
        pointsAwardedDrawer: drawer,
        summaryMessage: `Guessed correctly with ${state.roundSecondsLeft}s left!`,
      },
    };
  }

  return {
    ...state,
    guesses: updatedGuesses,
  };
}

export function applyTickDoodleTimer(state: DoodleGameState): DoodleGameState {
  if (state.phase !== 'drawing' || !state.selectedWord) return state;

  const nextSec = state.roundSecondsLeft - 1;

  if (nextSec <= 0) {
    // Time expired
    return {
      ...state,
      phase: 'round_summary',
      roundSecondsLeft: 0,
      lastRoundOutcome: {
        id: `timeout-${Date.now()}`,
        word: state.selectedWord,
        guesserGuessedCorrectly: false,
        pointsAwardedGuesser: 0,
        pointsAwardedDrawer: 0,
        summaryMessage: 'Time ran out! The secret word was revealed.',
      },
    };
  }

  // Automatic hints: Reveal 1st letter at 25s left, 2nd letter at 10s left
  let revealed = state.revealedHintIndices;
  const wordChars = state.selectedWord.split('');
  const nonSpaceIndices = wordChars
    .map((c, i) => (c !== ' ' ? i : -1))
    .filter((i) => i !== -1);

  if (nextSec === 25 && revealed.length === 0 && nonSpaceIndices.length > 2) {
    revealed = [nonSpaceIndices[0]];
  } else if (nextSec === 10 && revealed.length === 1 && nonSpaceIndices.length > 4) {
    const nextHintIdx = nonSpaceIndices[Math.floor(nonSpaceIndices.length / 2)];
    if (!revealed.includes(nextHintIdx)) {
      revealed = [...revealed, nextHintIdx];
    }
  }

  return {
    ...state,
    roundSecondsLeft: nextSec,
    revealedHintIndices: revealed,
  };
}

export function applyNextDoodleRound(state: DoodleGameState): DoodleGameState {
  if (state.phase !== 'round_summary') return state;

  if (state.round >= state.totalRounds) {
    // Match finished!
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
  const nextDrawer: PlayerSlot = state.drawerSlot === 'p1' ? 'p2' : 'p1';
  const nextGuesser: PlayerSlot = nextDrawer === 'p1' ? 'p2' : 'p1';
  const nextSeed = (state.matchSeed + nextRound * 97) % 1000000;
  const nextChoices = pickRandomWords(nextSeed, 3);

  return {
    ...state,
    round: nextRound,
    phase: 'word_selection',
    drawerSlot: nextDrawer,
    guesserSlot: nextGuesser,
    turn: nextDrawer,
    wordChoices: nextChoices,
    selectedWord: null,
    selectedCategory: null,
    strokes: [],
    guesses: [],
    roundSecondsLeft: DOODLE_ROUND_TIME_SEC,
    revealedHintIndices: [],
    lastRoundOutcome: undefined,
  };
}
