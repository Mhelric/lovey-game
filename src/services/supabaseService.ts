import {
  ActiveMatchRow,
  CatAvatarConfig,
  CoupleRoomRow,
  DEFAULT_P1_AVATAR,
  DEFAULT_P2_AVATAR,
  FloatingReaction,
  GameMode,
  MatchHistoryRow,
  PlayerSlot,
} from '../types/arcade';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://tncauykzjfrkugvmtxzx.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuY2F1eWt6amZya3Vndm10eHp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1ODA2MTgsImV4cCI6MjEwODE1NjYxOH0.xIT5na-n-iVY7V311AQyAqkL5OlQCC4HoWqbiGxZ4ek';

const REST_BASE = `${SUPABASE_URL}/rest/v1`;
const WS_URL = `${SUPABASE_URL.replace(/^http/, 'ws')}/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;

function getHeaders(prefer?: string): HeadersInit {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) {
    headers.Prefer = prefer;
  }
  return headers;
}

export function normalizeRoomCode(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  return cleaned.slice(0, 12) || 'LOVEY';
}

export async function checkCoupleRoomExists(
  roomCode: string
): Promise<{ ok: boolean; room: CoupleRoomRow | null }> {
  const code = normalizeRoomCode(roomCode);
  if (!rawCodeIsValid(roomCode)) {
    return { ok: false, room: null };
  }
  try {
    const getRes = await fetch(
      `${REST_BASE}/couple_rooms?room_code=eq.${encodeURIComponent(code)}&select=*&limit=1`,
      { headers: getHeaders() }
    );
    if (getRes.ok) {
      const rows = (await getRes.json()) as CoupleRoomRow[];
      if (rows.length > 0) {
        return { ok: true, room: rows[0] };
      }
      return { ok: false, room: null };
    }
  } catch {
    // Offline fallback
  }
  return { ok: false, room: null };
}

function rawCodeIsValid(raw: string): boolean {
  return raw.trim().replace(/[^A-Za-z0-9_-]/g, '').length >= 2;
}

export async function fetchOrCreateCoupleRoom(roomCode: string): Promise<CoupleRoomRow> {
  const code = normalizeRoomCode(roomCode);
  try {
    const getRes = await fetch(
      `${REST_BASE}/couple_rooms?room_code=eq.${encodeURIComponent(code)}&select=*&limit=1`,
      { headers: getHeaders() }
    );
    if (getRes.ok) {
      const rows = (await getRes.json()) as CoupleRoomRow[];
      if (rows.length > 0) {
        return rows[0];
      }
    }

    const createRes = await fetch(`${REST_BASE}/couple_rooms?on_conflict=room_code`, {
      method: 'POST',
      headers: getHeaders('resolution=merge-duplicates,return=representation'),
      body: JSON.stringify({
        room_code: code,
        p1_avatar: DEFAULT_P1_AVATAR,
        p2_avatar: DEFAULT_P2_AVATAR,
        current_mode: 'dama',
      }),
    });

    if (createRes.ok) {
      const created = (await createRes.json()) as CoupleRoomRow[];
      if (created.length > 0) {
        return created[0];
      }
    }
  } catch {
    // Fallback offline state if mobile data is temporarily disconnected
  }

  return {
    room_code: code,
    p1_avatar: DEFAULT_P1_AVATAR,
    p2_avatar: DEFAULT_P2_AVATAR,
    p1_dama_wins: 0,
    p2_dama_wins: 0,
    p1_snakes_wins: 0,
    p2_snakes_wins: 0,
    current_mode: 'dama',
    updated_at: new Date().toISOString(),
  };
}

export async function updatePlayerAvatarInDb(
  roomCode: string,
  slot: PlayerSlot,
  avatar: CatAvatarConfig
): Promise<CoupleRoomRow | null> {
  const code = normalizeRoomCode(roomCode);
  const patchBody =
    slot === 'p1'
      ? { p1_avatar: avatar, updated_at: new Date().toISOString() }
      : { p2_avatar: avatar, updated_at: new Date().toISOString() };

  try {
    const res = await fetch(
      `${REST_BASE}/couple_rooms?room_code=eq.${encodeURIComponent(code)}`,
      {
        method: 'PATCH',
        headers: getHeaders('return=representation'),
        body: JSON.stringify(patchBody),
      }
    );
    if (res.ok) {
      const rows = (await res.json()) as CoupleRoomRow[];
      return rows[0] ?? null;
    }
  } catch {
    // Ignored when offline
  }
  return null;
}

export async function updateRoomModeInDb(
  roomCode: string,
  mode: GameMode
): Promise<void> {
  const code = normalizeRoomCode(roomCode);
  try {
    await fetch(`${REST_BASE}/couple_rooms?room_code=eq.${encodeURIComponent(code)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        current_mode: mode,
        updated_at: new Date().toISOString(),
      }),
    });
  } catch {
    // Ignored when offline
  }
}

export async function fetchActiveMatch<T = Record<string, unknown>>(
  roomCode: string
): Promise<ActiveMatchRow<T> | null> {
  const code = normalizeRoomCode(roomCode);
  try {
    const res = await fetch(
      `${REST_BASE}/active_matches?room_code=eq.${encodeURIComponent(code)}&select=*&limit=1`,
      { headers: getHeaders() }
    );
    if (res.ok) {
      const rows = (await res.json()) as ActiveMatchRow<T>[];
      return rows[0] ?? null;
    }
  } catch {
    // Ignored when offline
  }
  return null;
}

export async function upsertActiveMatch<T = Record<string, unknown>>(
  match: Omit<ActiveMatchRow<T>, 'updated_at'>
): Promise<void> {
  try {
    await fetch(`${REST_BASE}/active_matches?on_conflict=room_code`, {
      method: 'POST',
      headers: getHeaders('resolution=merge-duplicates'),
      body: JSON.stringify({
        ...match,
        room_code: normalizeRoomCode(match.room_code),
        updated_at: new Date().toISOString(),
      }),
    });
  } catch {
    // Ignored when offline
  }
}

export async function recordMatchWinInDb(
  room: CoupleRoomRow,
  gameMode: GameMode,
  winner: PlayerSlot,
  summary: string
): Promise<CoupleRoomRow | null> {
  const code = normalizeRoomCode(room.room_code);
  const patchBody: Partial<CoupleRoomRow> = {
    updated_at: new Date().toISOString(),
  };

  if (gameMode === 'dama') {
    if (winner === 'p1') patchBody.p1_dama_wins = (room.p1_dama_wins || 0) + 1;
    else patchBody.p2_dama_wins = (room.p2_dama_wins || 0) + 1;
  } else {
    if (winner === 'p1') patchBody.p1_snakes_wins = (room.p1_snakes_wins || 0) + 1;
    else patchBody.p2_snakes_wins = (room.p2_snakes_wins || 0) + 1;
  }

  try {
    const [roomRes] = await Promise.all([
      fetch(`${REST_BASE}/couple_rooms?room_code=eq.${encodeURIComponent(code)}`, {
        method: 'PATCH',
        headers: getHeaders('return=representation'),
        body: JSON.stringify(patchBody),
      }),
      fetch(`${REST_BASE}/match_history`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          room_code: code,
          game_mode: gameMode,
          winner,
          p1_name: room.p1_avatar.name,
          p2_name: room.p2_avatar.name,
          summary,
        }),
      }),
    ]);

    if (roomRes.ok) {
      const rows = (await roomRes.json()) as CoupleRoomRow[];
      return rows[0] ?? null;
    }
  } catch {
    // Ignored when offline
  }
  return null;
}

export async function fetchMatchHistory(
  roomCode: string,
  limit = 12
): Promise<MatchHistoryRow[]> {
  const code = normalizeRoomCode(roomCode);
  try {
    const res = await fetch(
      `${REST_BASE}/match_history?room_code=eq.${encodeURIComponent(
        code
      )}&select=*&order=played_at.desc&limit=${limit}`,
      { headers: getHeaders() }
    );
    if (res.ok) {
      return (await res.json()) as MatchHistoryRow[];
    }
  } catch {
    // Ignored when offline
  }
  return [];
}

export type RealtimeBroadcastEvent =
  | { type: 'reaction'; reaction: FloatingReaction }
  | { type: 'avatar_update'; slot: PlayerSlot; avatar: CatAvatarConfig }
  | { type: 'mode_switch'; mode: GameMode; sender: PlayerSlot }
  | { type: 'start_match'; mode: GameMode; sender: PlayerSlot }
  | { type: 'partner_joined'; slot: PlayerSlot; avatar: CatAvatarConfig }
  | { type: 'presence_ping'; slot: PlayerSlot; timestamp: number }
  | {
      type: 'match_sync';
      gameMode: GameMode;
      turn: PlayerSlot;
      boardSeed: number;
      stateJson: unknown;
      winner: PlayerSlot | 'draw' | null;
      sender: PlayerSlot;
    };

export interface CoupleChannelHandlers {
  onBroadcast: (event: RealtimeBroadcastEvent) => void;
  onPartnerOnlineChange: (onlineSlots: Record<PlayerSlot, number>) => void;
  onResyncRequested: () => void;
  onConnectionChange?: (connected: boolean) => void;
}

export class CoupleRealtimeChannel {
  private ws: WebSocket | null = null;
  private roomCode: string;
  private slot: PlayerSlot;
  private handlers: CoupleChannelHandlers;
  private refCounter = 1;
  private joinRef = '1';
  private heartbeatTimer: number | null = null;
  private presencePingTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private destroyed = false;
  private onlineSeen: Record<PlayerSlot, number> = { p1: 0, p2: 0 };

  constructor(
    roomCode: string,
    slot: PlayerSlot,
    handlers: CoupleChannelHandlers
  ) {
    this.roomCode = normalizeRoomCode(roomCode);
    this.slot = slot;
    this.handlers = handlers;
    this.onlineSeen[this.slot] = Date.now();
  }

  private get topic(): string {
    return `realtime:room:${this.roomCode}`;
  }

  private nextRef(): string {
    this.refCounter += 1;
    return String(this.refCounter);
  }

  public connect(): void {
    if (this.destroyed) return;
    this.cleanupSocket();

    try {
      const ws = new WebSocket(WS_URL);
      this.ws = ws;

      ws.onopen = () => {
        if (this.destroyed) return;
        this.handlers.onConnectionChange?.(true);
        this.joinRef = this.nextRef();

        // Join Phoenix Realtime Channel
        ws.send(
          JSON.stringify({
            topic: this.topic,
            event: 'phx_join',
            payload: {
              config: {
                broadcast: { ack: false, self: false },
                presence: { key: this.slot },
              },
            },
            ref: this.joinRef,
            join_ref: this.joinRef,
          })
        );

        // Immediately announce presence and start heartbeat
        this.sendBroadcast({
          type: 'presence_ping',
          slot: this.slot,
          timestamp: Date.now(),
        });

        this.heartbeatTimer = window.setInterval(() => {
          this.sendRaw('phoenix', 'heartbeat', {});
          this.pruneStalePresence();
        }, 20000);

        this.presencePingTimer = window.setInterval(() => {
          this.onlineSeen[this.slot] = Date.now();
          this.sendBroadcast({
            type: 'presence_ping',
            slot: this.slot,
            timestamp: Date.now(),
          });
          this.pruneStalePresence();
        }, 6000);
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(String(evt.data)) as {
            topic?: string;
            event?: string;
            payload?: Record<string, unknown>;
          };
          if (msg.event === 'broadcast' && msg.payload) {
            const inner = msg.payload.payload as RealtimeBroadcastEvent | undefined;
            if (inner && typeof inner === 'object' && 'type' in inner) {
              if (inner.type === 'presence_ping') {
                const existedBefore =
                  Date.now() - (this.onlineSeen[inner.slot] || 0) < 16000;
                this.onlineSeen[inner.slot] = Date.now();
                this.handlers.onPartnerOnlineChange({ ...this.onlineSeen });
                if (!existedBefore && inner.slot !== this.slot) {
                  // Reply immediately so newly joined partner sees us right away
                  this.sendBroadcast({
                    type: 'presence_ping',
                    slot: this.slot,
                    timestamp: Date.now(),
                  });
                }
                return;
              }
              this.handlers.onBroadcast(inner);
            }
          }
        } catch {
          // Ignore malformed frames
        }
      };

      ws.onclose = () => {
        this.handlers.onConnectionChange?.(false);
        if (!this.destroyed) {
          this.reconnectTimer = window.setTimeout(() => {
            this.connect();
            this.handlers.onResyncRequested();
          }, 2200);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      this.handlers.onConnectionChange?.(false);
    }
  }

  public updateSlot(newSlot: PlayerSlot): void {
    this.slot = newSlot;
    this.onlineSeen[newSlot] = Date.now();
    this.sendBroadcast({
      type: 'presence_ping',
      slot: this.slot,
      timestamp: Date.now(),
    });
    this.handlers.onPartnerOnlineChange({ ...this.onlineSeen });
  }

  public sendBroadcast(eventPayload: RealtimeBroadcastEvent): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const ref = this.nextRef();
    this.ws.send(
      JSON.stringify({
        topic: this.topic,
        event: 'broadcast',
        payload: {
          type: 'broadcast',
          event: eventPayload.type,
          payload: eventPayload,
        },
        ref,
        join_ref: this.joinRef,
      })
    );
  }

  private sendRaw(topic: string, event: string, payload: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        topic,
        event,
        payload,
        ref: this.nextRef(),
      })
    );
  }

  private pruneStalePresence(): void {
    this.onlineSeen[this.slot] = Date.now();
    this.handlers.onPartnerOnlineChange({ ...this.onlineSeen });
  }

  private cleanupSocket(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.presencePingTimer !== null) {
      clearInterval(this.presencePingTimer);
      this.presencePingTimer = null;
    }
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      try {
        this.ws.close();
      } catch {
        // Ignore
      }
      this.ws = null;
    }
  }

  public destroy(): void {
    this.destroyed = true;
    this.cleanupSocket();
  }
}
