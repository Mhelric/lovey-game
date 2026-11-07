import { PlayerSlot } from '../types/arcade';
import { createMulberry32 } from './snakesEngine';

export type UnoColor = 'red' | 'yellow' | 'green' | 'blue' | 'wild';
export type UnoPlayableColor = 'red' | 'yellow' | 'green' | 'blue';

export type UnoCardValue =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'skip'
  | 'reverse'
  | 'draw2'
  | 'wild'
  | 'wild4';

export interface UnoCard {
  id: string;
  color: UnoColor;
  value: UnoCardValue;
}

export interface UnoTurnAnimation {
  id: string;
  player: PlayerSlot;
  eventKind:
    | 'play'
    | 'draw'
    | 'skip'
    | 'reverse'
    | 'draw2'
    | 'wild'
    | 'wild4'
    | 'swap7'
    | 'stack'
    | 'uno_call';
  message: string;
  card?: UnoCard;
}

export interface UnoGameState {
  matchSeed: number;
  deck: UnoCard[];
  discardPile: UnoCard[];
  p1Hand: UnoCard[];
  p2Hand: UnoCard[];
  activeColor: UnoPlayableColor;
  activeValue: UnoCardValue;
  turn: PlayerSlot;
  stackCount: number;
  stackType: 'draw2' | 'wild4' | null;
  p1CalledUno: boolean;
  p2CalledUno: boolean;
  winner: PlayerSlot | null;
  lastAction: UnoTurnAnimation | null;
  justDrew: boolean;
}

const BASE_COLORS: readonly UnoPlayableColor[] = [
  'red',
  'yellow',
  'green',
  'blue',
] as const;

export function buildStandardUnoDeck(): UnoCard[] {
  const cards: UnoCard[] = [];
  let uid = 1;

  for (const c of BASE_COLORS) {
    // 1 zero card
    cards.push({ id: `c-${uid++}`, color: c, value: '0' });

    // 2 of each 1-9
    for (let v = 1; v <= 9; v++) {
      const valStr = String(v) as UnoCardValue;
      cards.push({ id: `c-${uid++}`, color: c, value: valStr });
      cards.push({ id: `c-${uid++}`, color: c, value: valStr });
    }

    // 2 of each action card
    for (const act of ['skip', 'reverse', 'draw2'] as const) {
      cards.push({ id: `c-${uid++}`, color: c, value: act });
      cards.push({ id: `c-${uid++}`, color: c, value: act });
    }
  }

  // 4 Wild and 4 Wild Draw Four
  for (let i = 0; i < 4; i++) {
    cards.push({ id: `c-${uid++}`, color: 'wild', value: 'wild' });
    cards.push({ id: `c-${uid++}`, color: 'wild', value: 'wild4' });
  }

  return cards;
}

function shuffleDeck(deck: UnoCard[], prng: () => number): UnoCard[] {
  const list = [...deck];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const temp = list[i];
    list[i] = list[j];
    list[j] = temp;
  }
  return list;
}

/**
 * Creates an initial clean 2-player UNO match state.
 */
export function createInitialUnoState(
  matchSeed = Math.floor(100000 + Math.random() * 899999),
  startingTurn?: PlayerSlot
): UnoGameState {
  const prng = createMulberry32(matchSeed);
  const shuffled = shuffleDeck(buildStandardUnoDeck(), prng);

  const p1Hand = shuffled.splice(0, 7);
  const p2Hand = shuffled.splice(0, 7);

  // Find first number card (0-9) to start discard pile cleanly
  let firstCardIdx = shuffled.findIndex(
    (c) => c.color !== 'wild' && c.value >= '0' && c.value <= '9'
  );
  if (firstCardIdx === -1) firstCardIdx = 0;
  const firstCard = shuffled.splice(firstCardIdx, 1)[0];

  const resolvedTurn: PlayerSlot =
    startingTurn ?? (prng() < 0.5 ? 'p1' : 'p2');

  return {
    matchSeed,
    deck: shuffled,
    discardPile: [firstCard],
    p1Hand,
    p2Hand,
    activeColor: firstCard.color as UnoPlayableColor,
    activeValue: firstCard.value,
    turn: resolvedTurn,
    stackCount: 0,
    stackType: null,
    p1CalledUno: false,
    p2CalledUno: false,
    winner: null,
    lastAction: null,
    justDrew: false,
  };
}

/**
 * Validates whether a card can be legally played under 2-player + stacking rules.
 * Jump-In is NOT included.
 */
export function canPlayCard(card: UnoCard, state: UnoGameState): boolean {
  if (state.winner) return false;

  // Stacking rule: when a penalty is active, you must stack matching +2 or +4
  if (state.stackCount > 0) {
    if (state.stackType === 'draw2') {
      return card.value === 'draw2';
    }
    if (state.stackType === 'wild4') {
      return card.value === 'wild4';
    }
    return false;
  }

  // Wild cards can always be played when no stack is active
  if (card.color === 'wild') {
    return true;
  }

  // Color match or symbol/number match
  return card.color === state.activeColor || card.value === state.activeValue;
}

export function hasAnyPlayableCard(
  hand: UnoCard[],
  state: UnoGameState
): boolean {
  return hand.some((c) => canPlayCard(c, state));
}

function ensureDeckHasCards(
  deck: UnoCard[],
  discardPile: UnoCard[],
  needed: number,
  prng: () => number
): { deck: UnoCard[]; discardPile: UnoCard[] } {
  if (deck.length >= needed) return { deck: [...deck], discardPile: [...discardPile] };

  const topDiscard = discardPile[discardPile.length - 1];
  const reusable = discardPile.slice(0, -1);
  const reshuffled = shuffleDeck(reusable, prng);
  const newDeck = [...deck, ...reshuffled];
  return {
    deck: newDeck,
    discardPile: [topDiscard],
  };
}

/**
 * Pure turn resolver for playing a card in 2-Player UNO.
 * Includes:
 * - Stacking (+2 on +2, +4 on +4)
 * - The "7" Hand Swap
 * - Official 2-Player rules: Skip skips opponent (you go again!), Reverse acts like Skip (bounces back to you!).
 * - Jump-In is NOT included.
 */
export function applyPlayCard(
  state: UnoGameState,
  cardId: string,
  chosenColor?: UnoPlayableColor,
  entropy = Math.floor(Math.random() * 100000)
): UnoGameState {
  if (state.winner) return state;

  const roller = state.turn;
  const hand = roller === 'p1' ? [...state.p1Hand] : [...state.p2Hand];
  const cardIndex = hand.findIndex((c) => c.id === cardId);
  if (cardIndex === -1) return state;

  const card = hand[cardIndex];
  if (!canPlayCard(card, state)) return state;

  // Remove card from player hand
  hand.splice(cardIndex, 1);

  let nextP1Hand = roller === 'p1' ? hand : [...state.p1Hand];
  let nextP2Hand = roller === 'p2' ? hand : [...state.p2Hand];
  const nextDiscard = [...state.discardPile, card];

  let nextActiveColor: UnoPlayableColor =
    card.color === 'wild'
      ? chosenColor || 'red'
      : (card.color as UnoPlayableColor);
  let nextActiveValue: UnoCardValue = card.value;

  let nextStackCount = state.stackCount;
  let nextStackType = state.stackType;
  let nextTurn: PlayerSlot = roller === 'p1' ? 'p2' : 'p1';
  let eventKind: UnoTurnAnimation['eventKind'] = 'play';
  let message = `Played ${card.color.toUpperCase()} ${card.value.toUpperCase()}`;

  // Check 7 Hand Swap rule
  if (card.value === '7') {
    const temp = nextP1Hand;
    nextP1Hand = nextP2Hand;
    nextP2Hand = temp;
    eventKind = 'swap7';
    message = `Catnap Swap! Swapped hands with partner!`;
  } else if (card.value === 'skip') {
    // In 2-Player: Skip skips opponent, so turn returns to active player!
    nextTurn = roller;
    eventKind = 'skip';
    message = `Paws Off! Skipped partner—take another turn!`;
  } else if (card.value === 'reverse') {
    // In 2-Player: Reverse bounces back, so turn returns to active player!
    nextTurn = roller;
    eventKind = 'reverse';
    message = `U-Turn Bounced! Reverse gives you another turn!`;
  } else if (card.value === 'draw2') {
    nextStackCount += 2;
    nextStackType = 'draw2';
    eventKind = 'stack';
    message = `Twin Paw Draw 2! Current stack: +${nextStackCount}!`;
  } else if (card.value === 'wild') {
    eventKind = 'wild';
    message = `Rainbow Wild! Color changed to ${nextActiveColor.toUpperCase()}!`;
  } else if (card.value === 'wild4') {
    nextStackCount += 4;
    nextStackType = 'wild4';
    eventKind = 'stack';
    message = `Mega Wild Draw 4! Current stack: +${nextStackCount}!`;
  }

  // Check Winner (hand empty)
  const currentHand = roller === 'p1' ? nextP1Hand : nextP2Hand;
  const winner: PlayerSlot | null =
    currentHand.length === 0 ? roller : null;

  const nextP1Uno = nextP1Hand.length === 1;
  const nextP2Uno = nextP2Hand.length === 1;

  return {
    matchSeed: state.matchSeed,
    deck: state.deck,
    discardPile: nextDiscard,
    p1Hand: nextP1Hand,
    p2Hand: nextP2Hand,
    activeColor: nextActiveColor,
    activeValue: nextActiveValue,
    turn: winner ? roller : nextTurn,
    stackCount: nextStackCount,
    stackType: nextStackType,
    p1CalledUno: nextP1Uno,
    p2CalledUno: nextP2Uno,
    winner,
    lastAction: {
      id: `${Date.now()}-${roller}-${card.id}-${entropy}`,
      player: roller,
      eventKind,
      message,
      card,
    },
    justDrew: false,
  };
}

/**
 * Applies a draw action.
 * If stackCount > 0, player takes the full stack penalty and loses their turn (official 2P rules).
 * If stackCount === 0, player draws 1 card and can choose to play it or pass.
 */
export function applyDrawCard(
  state: UnoGameState,
  entropy = Math.floor(Math.random() * 100000)
): UnoGameState {
  if (state.winner) return state;

  const roller = state.turn;
  const prng = createMulberry32(state.matchSeed ^ entropy);
  const countToDraw = state.stackCount > 0 ? state.stackCount : 1;

  const { deck: freshDeck, discardPile: freshDiscard } = ensureDeckHasCards(
    state.deck,
    state.discardPile,
    countToDraw,
    prng
  );

  const drawn = freshDeck.splice(0, countToDraw);
  const nextP1Hand =
    roller === 'p1' ? [...state.p1Hand, ...drawn] : [...state.p1Hand];
  const nextP2Hand =
    roller === 'p2' ? [...state.p2Hand, ...drawn] : [...state.p2Hand];

  // In 2-Player UNO, drawing a penalty stack skips your turn completely
  const isPenaltyDraw = state.stackCount > 0;
  const nextTurn: PlayerSlot = isPenaltyDraw
    ? roller === 'p1'
      ? 'p2'
      : 'p1'
    : roller;

  const message = isPenaltyDraw
    ? `Drew ${countToDraw} penalty cards! Turn skipped!`
    : `Drew 1 card from deck`;

  return {
    matchSeed: state.matchSeed,
    deck: freshDeck,
    discardPile: freshDiscard,
    p1Hand: nextP1Hand,
    p2Hand: nextP2Hand,
    activeColor: state.activeColor,
    activeValue: state.activeValue,
    turn: nextTurn,
    stackCount: 0,
    stackType: null,
    p1CalledUno: nextP1Hand.length === 1,
    p2CalledUno: nextP2Hand.length === 1,
    winner: null,
    lastAction: {
      id: `${Date.now()}-${roller}-draw-${entropy}`,
      player: roller,
      eventKind: 'draw',
      message,
    },
    justDrew: !isPenaltyDraw,
  };
}

/**
 * Passes turn to the other player (only valid after drawing 1 card when not in penalty).
 */
export function applyPassTurn(state: UnoGameState): UnoGameState {
  if (state.winner || !state.justDrew) return state;

  const nextTurn: PlayerSlot = state.turn === 'p1' ? 'p2' : 'p1';
  return {
    ...state,
    turn: nextTurn,
    justDrew: false,
    lastAction: {
      id: `${Date.now()}-${state.turn}-pass`,
      player: state.turn,
      eventKind: 'play',
      message: `Passed turn to partner`,
    },
  };
}

/**
 * Explicit "UNO!" button action for celebratory shout.
 */
export function applyCallUno(
  state: UnoGameState,
  slot: PlayerSlot
): UnoGameState {
  return {
    ...state,
    p1CalledUno: slot === 'p1' ? true : state.p1CalledUno,
    p2CalledUno: slot === 'p2' ? true : state.p2CalledUno,
    lastAction: {
      id: `${Date.now()}-${slot}-uno`,
      player: slot,
      eventKind: 'uno_call',
      message: `LOVE-UNO! 1 card left!`,
    },
  };
}
