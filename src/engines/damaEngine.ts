import { PlayerSlot } from '../types/arcade';

export type DamaPieceKind = 'tao' | 'dama';

export interface DamaPiece {
  id: string;
  owner: PlayerSlot;
  kind: DamaPieceKind;
}

export interface BoardPos {
  r: number;
  c: number;
}

export interface CapturedPieceInfo {
  r: number;
  c: number;
  piece: DamaPiece;
}

export interface DamaStepOption {
  from: BoardPos;
  to: BoardPos;
  captured: CapturedPieceInfo | null;
  maxChainLength: number; // Total captures achievable starting with this step
  promotes: boolean;
}

export interface DamaLastAction {
  id: string;
  mover: PlayerSlot;
  from: BoardPos;
  to: BoardPos;
  captured: CapturedPieceInfo | null;
  promoted: boolean;
}

export interface DamaGameState {
  board: (DamaPiece | null)[][];
  turn: PlayerSlot;
  chainPos: BoardPos | null;
  capturedInChain: string[]; // "r,c" keys already jumped in current multi-jump
  winner: PlayerSlot | 'draw' | null;
  p1Remaining: number;
  p2Remaining: number;
  lastAction: DamaLastAction | null;
}

const DIAGONALS: readonly [number, number][] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

export function isInsideBoard(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function isPlayableSquare(r: number, c: number): boolean {
  return isInsideBoard(r, c) && (r + c) % 2 === 1;
}

export function posKey(r: number, c: number): string {
  return `${r},${c}`;
}

export function samePos(a: BoardPos | null, b: BoardPos | null): boolean {
  return Boolean(a && b && a.r === b.r && a.c === b.c);
}

export function cloneBoard(
  board: (DamaPiece | null)[][]
): (DamaPiece | null)[][] {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function createInitialDamaState(): DamaGameState {
  const board: (DamaPiece | null)[][] = Array.from({ length: 8 }, () =>
    Array<DamaPiece | null>(8).fill(null)
  );

  let p2Count = 0;
  for (let r = 0; r <= 2; r++) {
    for (let c = 0; c < 8; c++) {
      if (isPlayableSquare(r, c)) {
        p2Count += 1;
        board[r][c] = {
          id: `p2-${p2Count}`,
          owner: 'p2',
          kind: 'tao',
        };
      }
    }
  }

  let p1Count = 0;
  for (let r = 5; r <= 7; r++) {
    for (let c = 0; c < 8; c++) {
      if (isPlayableSquare(r, c)) {
        p1Count += 1;
        board[r][c] = {
          id: `p1-${p1Count}`,
          owner: 'p1',
          kind: 'tao',
        };
      }
    }
  }

  return {
    board,
    turn: 'p1',
    chainPos: null,
    capturedInChain: [],
    winner: null,
    p1Remaining: 12,
    p2Remaining: 12,
    lastAction: null,
  };
}

function isPromotionRow(owner: PlayerSlot, r: number): boolean {
  return (owner === 'p1' && r === 0) || (owner === 'p2' && r === 7);
}

interface ImmediateCapture {
  from: BoardPos;
  to: BoardPos;
  captured: CapturedPieceInfo;
}

/**
 * Finds all immediate 1-jump captures for a single piece at `pos`,
 * respecting already-captured ghost obstacles during a multi-jump chain
 * (Turkish strike rule: jumped pieces cannot be jumped twice).
 */
function getImmediateCapturesForPiece(
  board: (DamaPiece | null)[][],
  pos: BoardPos,
  piece: DamaPiece,
  alreadyCaptured: Set<string>
): ImmediateCapture[] {
  const results: ImmediateCapture[] = [];

  if (piece.kind === 'tao') {
    // Filipino Dama: Tao captures both forward AND backward diagonally (short jump)
    for (const [dr, dc] of DIAGONALS) {
      const midR = pos.r + dr;
      const midC = pos.c + dc;
      const landR = pos.r + dr * 2;
      const landC = pos.c + dc * 2;

      if (!isInsideBoard(landR, landC)) continue;
      const midKey = posKey(midR, midC);
      if (alreadyCaptured.has(midKey)) continue;

      const midPiece = board[midR][midC];
      const landPiece = board[landR][landC];

      if (midPiece && midPiece.owner !== piece.owner && landPiece === null) {
        results.push({
          from: pos,
          to: { r: landR, c: landC },
          captured: { r: midR, c: midC, piece: midPiece },
        });
      }
    }
  } else {
    // Flying King (Dama): Slides any distance to jump a single opponent piece,
    // and can land on ANY unobstructed empty square beyond that piece along the ray.
    for (const [dr, dc] of DIAGONALS) {
      let step = 1;
      let foundEnemy: CapturedPieceInfo | null = null;

      while (true) {
        const curR = pos.r + dr * step;
        const curC = pos.c + dc * step;
        if (!isInsideBoard(curR, curC)) break;

        const curKey = posKey(curR, curC);
        const occupant = board[curR][curC];

        if (!foundEnemy) {
          if (alreadyCaptured.has(curKey)) {
            // Cannot jump over an already-captured piece a second time
            break;
          }
          if (occupant) {
            if (occupant.owner === piece.owner) {
              break; // Blocked by friendly piece
            } else {
              foundEnemy = { r: curR, c: curC, piece: occupant };
            }
          }
        } else {
          // Already jumped `foundEnemy`; any empty square beyond it is a valid landing
          if (occupant !== null || alreadyCaptured.has(curKey)) {
            break; // Blocked by another piece
          }
          results.push({
            from: pos,
            to: { r: curR, c: curC },
            captured: foundEnemy,
          });
        }

        step += 1;
      }
    }
  }

  return results;
}

/**
 * Recursively computes the maximum number of captures achievable starting from `pos`
 * with `piece`, given the set of already-jumped squares `alreadyCaptured`.
 */
function computeMaxCaptureDepth(
  board: (DamaPiece | null)[][],
  pos: BoardPos,
  piece: DamaPiece,
  alreadyCaptured: Set<string>
): number {
  const immediate = getImmediateCapturesForPiece(
    board,
    pos,
    piece,
    alreadyCaptured
  );
  if (immediate.length === 0) return 0;

  let best = 0;
  for (const cap of immediate) {
    const nextBoard = cloneBoard(board);
    nextBoard[pos.r][pos.c] = null;
    nextBoard[cap.to.r][cap.to.c] = piece;
    // Note: in Turkish strike, captured piece stays as a blocker in `alreadyCaptured`
    const nextCaptured = new Set(alreadyCaptured);
    nextCaptured.add(posKey(cap.captured.r, cap.captured.c));

    const total =
      1 + computeMaxCaptureDepth(nextBoard, cap.to, piece, nextCaptured);
    if (total > best) {
      best = total;
    }
  }
  return best;
}

/**
 * Computes all legal next steps for the active player, strictly enforcing the
 * Filipino Dama Mandatory Maximum Capture (Mayor) rule.
 */
export function getLegalStepsForState(state: DamaGameState): DamaStepOption[] {
  if (state.winner) return [];

  const { board, turn, chainPos, capturedInChain } = state;
  const alreadyCaptured = new Set<string>(capturedInChain);

  const candidatePositions: BoardPos[] = [];
  if (chainPos) {
    candidatePositions.push(chainPos);
  } else {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.owner === turn) {
          candidatePositions.push({ r, c });
        }
      }
    }
  }

  // 1. Gather all capture steps and evaluate their maximum total chain length
  const captureSteps: DamaStepOption[] = [];
  let globalMaxChain = 0;

  for (const pos of candidatePositions) {
    const piece = board[pos.r][pos.c];
    if (!piece) continue;

    const immediate = getImmediateCapturesForPiece(
      board,
      pos,
      piece,
      alreadyCaptured
    );

    for (const cap of immediate) {
      const nextBoard = cloneBoard(board);
      nextBoard[pos.r][pos.c] = null;
      nextBoard[cap.to.r][cap.to.c] = piece;

      const nextCaptured = new Set(alreadyCaptured);
      nextCaptured.add(posKey(cap.captured.r, cap.captured.c));

      const remainingCaptures = computeMaxCaptureDepth(
        nextBoard,
        cap.to,
        piece,
        nextCaptured
      );
      const totalChain = 1 + remainingCaptures;

      if (totalChain > globalMaxChain) {
        globalMaxChain = totalChain;
      }

      const promotes =
        piece.kind === 'tao' &&
        remainingCaptures === 0 &&
        isPromotionRow(piece.owner, cap.to.r);

      captureSteps.push({
        from: pos,
        to: cap.to,
        captured: cap.captured,
        maxChainLength: totalChain,
        promotes,
      });
    }
  }

  // Mandatory Maximum Capture (Mayor): If any capture exists, filter to max chain length only!
  if (globalMaxChain > 0) {
    return captureSteps.filter((step) => step.maxChainLength === globalMaxChain);
  }

  // If we were in a multi-jump chain and no further captures exist, return empty
  if (chainPos) {
    return [];
  }

  // 2. Otherwise, gather regular non-capturing diagonal moves
  const normalSteps: DamaStepOption[] = [];
  const forwardDr = turn === 'p1' ? -1 : 1;

  for (const pos of candidatePositions) {
    const piece = board[pos.r][pos.c];
    if (!piece) continue;

    if (piece.kind === 'tao') {
      for (const dc of [-1, 1]) {
        const nr = pos.r + forwardDr;
        const nc = pos.c + dc;
        if (isInsideBoard(nr, nc) && board[nr][nc] === null) {
          normalSteps.push({
            from: pos,
            to: { r: nr, c: nc },
            captured: null,
            maxChainLength: 0,
            promotes: isPromotionRow(piece.owner, nr),
          });
        }
      }
    } else {
      // Flying Dama King: Slides any number of empty squares along all 4 diagonals
      for (const [dr, dc] of DIAGONALS) {
        let dist = 1;
        while (true) {
          const nr = pos.r + dr * dist;
          const nc = pos.c + dc * dist;
          if (!isInsideBoard(nr, nc) || board[nr][nc] !== null) break;
          normalSteps.push({
            from: pos,
            to: { r: nr, c: nc },
            captured: null,
            maxChainLength: 0,
            promotes: false,
          });
          dist += 1;
        }
      }
    }
  }

  return normalSteps;
}

/**
 * Returns the set of piece coordinates ("r,c") that have a mandatory capture (Mayor).
 */
export function getMandatoryCaptureOrigins(state: DamaGameState): Set<string> {
  const steps = getLegalStepsForState(state);
  const origins = new Set<string>();
  for (const s of steps) {
    if (s.captured) {
      origins.add(posKey(s.from.r, s.from.c));
    }
  }
  return origins;
}

/**
 * Applies a validated step (`from` -> `to`) to `state` and returns the new `DamaGameState`.
 */
export function applyDamaStep(
  state: DamaGameState,
  from: BoardPos,
  to: BoardPos
): DamaGameState {
  const legalSteps = getLegalStepsForState(state);
  const chosen = legalSteps.find(
    (s) => samePos(s.from, from) && samePos(s.to, to)
  );
  if (!chosen) {
    return state;
  }

  const nextBoard = cloneBoard(state.board);
  const movingPiece = nextBoard[from.r][from.c];
  if (!movingPiece) return state;

  nextBoard[from.r][from.c] = null;
  const updatedPiece: DamaPiece = { ...movingPiece };
  nextBoard[to.r][to.c] = updatedPiece;

  let nextCapturedInChain = [...state.capturedInChain];
  if (chosen.captured) {
    nextCapturedInChain.push(posKey(chosen.captured.r, chosen.captured.c));
  }

  // Check if this was a capture and if further captures are required in this chain
  if (chosen.captured && chosen.maxChainLength > 1) {
    const intermediateState: DamaGameState = {
      ...state,
      board: nextBoard,
      chainPos: to,
      capturedInChain: nextCapturedInChain,
      lastAction: {
        id: `${Date.now()}-${from.r}${from.c}-${to.r}${to.c}`,
        mover: state.turn,
        from,
        to,
        captured: chosen.captured,
        promoted: false,
      },
    };
    return intermediateState;
  }

  // Turn sequence ends: remove all captured pieces in chain from board
  for (const key of nextCapturedInChain) {
    const [cr, cc] = key.split(',').map(Number);
    if (isInsideBoard(cr, cc)) {
      nextBoard[cr][cc] = null;
    }
  }

  // Check for Dama King promotion at end of turn
  let promoted = false;
  if (
    updatedPiece.kind === 'tao' &&
    isPromotionRow(updatedPiece.owner, to.r)
  ) {
    updatedPiece.kind = 'dama';
    promoted = true;
  }

  // Count remaining pieces
  let p1Remaining = 0;
  let p2Remaining = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = nextBoard[r][c];
      if (cell?.owner === 'p1') p1Remaining += 1;
      if (cell?.owner === 'p2') p2Remaining += 1;
    }
  }

  const nextTurn: PlayerSlot = state.turn === 'p1' ? 'p2' : 'p1';

  const provisionalNextState: DamaGameState = {
    board: nextBoard,
    turn: nextTurn,
    chainPos: null,
    capturedInChain: [],
    winner: null,
    p1Remaining,
    p2Remaining,
    lastAction: {
      id: `${Date.now()}-${from.r}${from.c}-${to.r}${to.c}`,
      mover: state.turn,
      from,
      to,
      captured: chosen.captured,
      promoted,
    },
  };

  // Determine if game has ended (0 pieces left or 0 legal moves for next player)
  if (p1Remaining === 0) {
    provisionalNextState.winner = 'p2';
  } else if (p2Remaining === 0) {
    provisionalNextState.winner = 'p1';
  } else {
    const nextPlayerMoves = getLegalStepsForState(provisionalNextState);
    if (nextPlayerMoves.length === 0) {
      provisionalNextState.winner = state.turn;
    }
  }

  return provisionalNextState;
}
