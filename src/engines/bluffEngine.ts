import { PlayerSlot } from '../types/arcade';

export type BluffCardKind = 'fish' | 'thief' | 'monarch' | 'shield';

export interface BluffCard {
  id: string;
  kind: BluffCardKind;
}

export interface BluffCardMeta {
  title: string;
  shortTitle: string;
  badge: string;
  desc: string;
}

export const BLUFF_CARD_ORDER: readonly BluffCardKind[] = [
  'fish',
  'thief',
  'monarch',
  'shield',
] as const;

export const BLUFF_CARD_META: Record<BluffCardKind, BluffCardMeta> = {
  fish: {
    title: 'Fresh Tuna',
    shortTitle: 'Tuna',
    badge: '+2 Treats',
    desc: 'Collect +2 Fish Treats from the jar',
  },
  thief: {
    title: 'Bandit Paws',
    shortTitle: 'Bandit',
    badge: 'Steal 2',
    desc: 'Swipe up to 2 Treats from partner',
  },
  monarch: {
    title: 'Cat Monarch',
    shortTitle: 'Monarch',
    badge: '+3 Treats',
    desc: 'Royal feast! Collect +3 Fish Treats',
  },
  shield: {
    title: 'Yarn Shield',
    shortTitle: 'Shield',
    badge: '+1 & Heal',
    desc: '+1 Treat & heal 1 Heart (blocks Bandit)',
  },
};

export interface BluffPendingClaim {
  actor: PlayerSlot;
  responder: PlayerSlot;
  actualCard: BluffCard;
  claimedKind: BluffCardKind;
}

export type BluffOutcomeKind =
  | 'trusted'
  | 'bluff_caught'
  | 'truth_proven'
  | 'shield_blocked';

export interface BluffResolution {
  id: string;
  actor: PlayerSlot;
  responder: PlayerSlot;
  actualKind: BluffCardKind;
  claimedKind: BluffCardKind;
  outcome: BluffOutcomeKind;
  message: string;
}

export interface BluffGameState {
  matchSeed: number;
  turn: PlayerSlot;
  phase: 'play' | 'respond';
  deck: BluffCard[];
  p1Hand: BluffCard[];
  p2Hand: BluffCard[];
  p1Treats: number;
  p2Treats: number;
  p1Hearts: number;
  p2Hearts: number;
  targetTreats: number;
  maxHearts: number;
  pendingClaim: BluffPendingClaim | null;
  lastResolution: BluffResolution | null;
  turnCount: number;
  winner: PlayerSlot | null;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildShuffledBluffDeck(seed: number, batchTag = 0): BluffCard[] {
  const rng = mulberry32(seed + batchTag * 7919);
  const cards: BluffCard[] = [];
  let idx = 0;

  // 8 copies of each of the 4 roles = 32 cards
  for (let copy = 0; copy < 8; copy++) {
    for (const kind of BLUFF_CARD_ORDER) {
      cards.push({
        id: `bluff-${seed}-${batchTag}-${idx++}-${kind}`,
        kind,
      });
    }
  }

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = cards[i];
    cards[i] = cards[j];
    cards[j] = tmp;
  }

  return cards;
}

export function createInitialBluffState(
  seed = 202612,
  startingTurn: PlayerSlot = 'p1'
): BluffGameState {
  const deck = buildShuffledBluffDeck(seed, 0);
  const p1Hand = deck.splice(0, 4);
  const p2Hand = deck.splice(0, 4);

  return {
    matchSeed: seed,
    turn: startingTurn,
    phase: 'play',
    deck,
    p1Hand,
    p2Hand,
    p1Treats: 2,
    p2Treats: 2,
    p1Hearts: 3,
    p2Hearts: 3,
    targetTreats: 10,
    maxHearts: 3,
    pendingClaim: null,
    lastResolution: null,
    turnCount: 0,
    winner: null,
  };
}

export function canDefenderBlockWithShield(state: BluffGameState): boolean {
  if (state.phase !== 'respond' || !state.pendingClaim) return false;
  if (state.pendingClaim.claimedKind !== 'thief') return false;
  const responderHand =
    state.pendingClaim.responder === 'p1' ? state.p1Hand : state.p2Hand;
  return responderHand.some((c) => c.kind === 'shield');
}

export function applySubmitBluffClaim(
  state: BluffGameState,
  cardId: string,
  claimedKind: BluffCardKind
): BluffGameState {
  if (state.winner || state.phase !== 'play') return state;

  const actor = state.turn;
  const responder: PlayerSlot = actor === 'p1' ? 'p2' : 'p1';
  const hand = actor === 'p1' ? [...state.p1Hand] : [...state.p2Hand];

  const cardIdx = hand.findIndex((c) => c.id === cardId);
  if (cardIdx === -1) return state;

  const [actualCard] = hand.splice(cardIdx, 1);

  return {
    ...state,
    turn: responder,
    phase: 'respond',
    p1Hand: actor === 'p1' ? hand : state.p1Hand,
    p2Hand: actor === 'p2' ? hand : state.p2Hand,
    pendingClaim: {
      actor,
      responder,
      actualCard,
      claimedKind,
    },
  };
}

function applyCardEffectToStats(
  kind: BluffCardKind,
  actorTreats: number,
  responderTreats: number,
  actorHearts: number,
  maxHearts: number
): { nextActorTreats: number; nextResponderTreats: number; nextActorHearts: number } {
  let nextActorTreats = actorTreats;
  let nextResponderTreats = responderTreats;
  let nextActorHearts = actorHearts;

  if (kind === 'fish') {
    nextActorTreats += 2;
  } else if (kind === 'monarch') {
    nextActorTreats += 3;
  } else if (kind === 'shield') {
    nextActorTreats += 1;
    nextActorHearts = Math.min(maxHearts, nextActorHearts + 1);
  } else if (kind === 'thief') {
    const stolen = Math.min(2, nextResponderTreats);
    nextResponderTreats -= stolen;
    nextActorTreats += Math.max(2, stolen);
  }

  return { nextActorTreats, nextResponderTreats, nextActorHearts };
}

export function applyRespondToClaim(
  state: BluffGameState,
  decision: 'trust' | 'call_bluff' | 'block_shield'
): BluffGameState {
  if (state.winner || state.phase !== 'respond' || !state.pendingClaim) {
    return state;
  }

  const { actor, responder, actualCard, claimedKind } = state.pendingClaim;
  const nextTurnCount = state.turnCount + 1;

  let actorTreats = actor === 'p1' ? state.p1Treats : state.p2Treats;
  let responderTreats = responder === 'p1' ? state.p1Treats : state.p2Treats;
  let actorHearts = actor === 'p1' ? state.p1Hearts : state.p2Hearts;
  let responderHearts = responder === 'p1' ? state.p1Hearts : state.p2Hearts;

  let p1Hand = [...state.p1Hand];
  let p2Hand = [...state.p2Hand];
  let deck = [...state.deck];

  let outcome: BluffOutcomeKind = 'trusted';
  let message = '';

  if (
    decision === 'block_shield' &&
    claimedKind === 'thief' &&
    canDefenderBlockWithShield(state)
  ) {
    const respHand = responder === 'p1' ? p1Hand : p2Hand;
    const shieldIdx = respHand.findIndex((c) => c.kind === 'shield');
    if (shieldIdx !== -1) {
      respHand.splice(shieldIdx, 1);
    }
    responderTreats += 1;
    outcome = 'shield_blocked';
    message = `Yarn Shield blocked Bandit Paws! (+1 Treat)`;
  } else if (decision === 'call_bluff') {
    const isTruth = actualCard.kind === claimedKind;
    if (!isTruth) {
      // Caught bluffing!
      actorHearts = Math.max(0, actorHearts - 1);
      responderTreats += 1;
      outcome = 'bluff_caught';
      message = `Bluff Caught! Card was ${BLUFF_CARD_META[actualCard.kind].title}, not ${BLUFF_CARD_META[claimedKind].shortTitle}!`;
    } else {
      // Told the truth! Caller loses 1 heart and card effect activates
      responderHearts = Math.max(0, responderHearts - 1);
      const eff = applyCardEffectToStats(
        claimedKind,
        actorTreats,
        responderTreats,
        actorHearts,
        state.maxHearts
      );
      actorTreats = eff.nextActorTreats;
      responderTreats = eff.nextResponderTreats;
      actorHearts = eff.nextActorHearts;
      outcome = 'truth_proven';
      message = `Truth Proven! It really was ${BLUFF_CARD_META[actualCard.kind].title}!`;
    }
  } else {
    // Trusted claim -> Declared effect resolves
    const eff = applyCardEffectToStats(
      claimedKind,
      actorTreats,
      responderTreats,
      actorHearts,
      state.maxHearts
    );
    actorTreats = eff.nextActorTreats;
    responderTreats = eff.nextResponderTreats;
    actorHearts = eff.nextActorHearts;
    outcome = 'trusted';
    message = `Claim Allowed! ${BLUFF_CARD_META[claimedKind].title} (${BLUFF_CARD_META[claimedKind].badge})`;
  }

  // Replenish deck if needed and top up both hands to 4 cards
  if (deck.length < 6) {
    deck = [...deck, ...buildShuffledBluffDeck(state.matchSeed, nextTurnCount)];
  }
  while (p1Hand.length < 4 && deck.length > 0) {
    const nextCard = deck.shift();
    if (nextCard) p1Hand.push(nextCard);
  }
  while (p2Hand.length < 4 && deck.length > 0) {
    const nextCard = deck.shift();
    if (nextCard) p2Hand.push(nextCard);
  }

  const nextP1Treats = actor === 'p1' ? actorTreats : responderTreats;
  const nextP2Treats = actor === 'p2' ? actorTreats : responderTreats;
  const nextP1Hearts = actor === 'p1' ? actorHearts : responderHearts;
  const nextP2Hearts = actor === 'p2' ? actorHearts : responderHearts;

  let winner: PlayerSlot | null = null;
  if (actorHearts <= 0) {
    winner = responder;
  } else if (responderHearts <= 0) {
    winner = actor;
  } else if (actorTreats >= state.targetTreats) {
    winner = actor;
  } else if (responderTreats >= state.targetTreats) {
    winner = responder;
  }

  return {
    ...state,
    turn: responder,
    phase: 'play',
    deck,
    p1Hand,
    p2Hand,
    p1Treats: nextP1Treats,
    p2Treats: nextP2Treats,
    p1Hearts: nextP1Hearts,
    p2Hearts: nextP2Hearts,
    pendingClaim: null,
    lastResolution: {
      id: `res-${state.matchSeed}-${nextTurnCount}`,
      actor,
      responder,
      actualKind: actualCard.kind,
      claimedKind,
      outcome,
      message,
    },
    turnCount: nextTurnCount,
    winner,
  };
}
