import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import {
  ActiveMatchRow,
  CatAvatarConfig,
  CoupleRoomRow,
  DEFAULT_P1_AVATAR,
  DEFAULT_P2_AVATAR,
  GameMode,
  MatchHistoryRow,
  PlayerSlot,
} from '../types/arcade';
import type { RealtimeBroadcastEvent } from './supabaseService';

interface HotspotSyncNative {
  startHost(): Promise<{ port: number }>;
  stopHost(): Promise<void>;
  sendToClient(opts: { payload: string }): Promise<void>;
  discoverHost(): Promise<{ found: boolean; hostIp?: string; port?: number; gatewayIp?: string }>;
  addListener(
    eventName: 'clientConnected' | 'clientDisconnected',
    cb: () => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'message',
    cb: (data: { payload: string }) => void
  ): Promise<PluginListenerHandle>;
}

const HotspotSync = registerPlugin<HotspotSyncNative>('HotspotSync');

const STORAGE_HOTSPOT_ROOM_KEY = 'lovey_hotspot_room_v1';
const STORAGE_HOTSPOT_MATCH_KEY = 'lovey_hotspot_match_v1';
const STORAGE_HOTSPOT_HISTORY_KEY = 'lovey_hotspot_history_v1';

export type HotspotPacket =
  | { kind: 'hello'; avatar: CatAvatarConfig }
  | { kind: 'full_sync'; room: CoupleRoomRow; match: ActiveMatchRow | null }
  | { kind: 'room_sync'; room: CoupleRoomRow }
  | { kind: 'match_sync'; match: ActiveMatchRow }
  | { kind: 'avatar_update'; slot: PlayerSlot; avatar: CatAvatarConfig }
  | { kind: 'broadcast'; event: RealtimeBroadcastEvent };

export function loadHotspotRoom(hostAvatar?: CatAvatarConfig): CoupleRoomRow {
  try {
    const raw = localStorage.getItem(STORAGE_HOTSPOT_ROOM_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CoupleRoomRow;
      if (parsed && parsed.room_code) {
        return {
          ...parsed,
          room_code: 'LOVEY',
          p1_avatar: hostAvatar || parsed.p1_avatar || DEFAULT_P1_AVATAR,
        };
      }
    }
  } catch {
    // ignore
  }
  const fresh: CoupleRoomRow = {
    room_code: 'LOVEY',
    p1_avatar: hostAvatar || DEFAULT_P1_AVATAR,
    p2_avatar: DEFAULT_P2_AVATAR,
    p1_dama_wins: 0,
    p2_dama_wins: 0,
    p1_snakes_wins: 0,
    p2_snakes_wins: 0,
    p1_uno_wins: 0,
    p2_uno_wins: 0,
    p1_doodle_wins: 0,
    p2_doodle_wins: 0,
    current_mode: 'dama',
    updated_at: new Date().toISOString(),
  };
  saveHotspotRoom(fresh);
  return fresh;
}

export function saveHotspotRoom(room: CoupleRoomRow): void {
  try {
    localStorage.setItem(STORAGE_HOTSPOT_ROOM_KEY, JSON.stringify({ ...room, room_code: 'LOVEY' }));
  } catch {
    // ignore
  }
}

export function loadHotspotMatch(): ActiveMatchRow | null {
  try {
    const raw = localStorage.getItem(STORAGE_HOTSPOT_MATCH_KEY);
    return raw ? (JSON.parse(raw) as ActiveMatchRow) : null;
  } catch {
    return null;
  }
}

export function saveHotspotMatch(match: ActiveMatchRow | null): void {
  try {
    if (!match) {
      localStorage.removeItem(STORAGE_HOTSPOT_MATCH_KEY);
    } else {
      localStorage.setItem(STORAGE_HOTSPOT_MATCH_KEY, JSON.stringify({ ...match, room_code: 'LOVEY' }));
    }
  } catch {
    // ignore
  }
}

export function recordHotspotMatchWin(
  winner: PlayerSlot | 'draw',
  mode: GameMode,
  summary: string
): CoupleRoomRow {
  const room = loadHotspotRoom();
  if (winner === 'p1' || winner === 'p2') {
    if (mode === 'dama') {
      room[winner === 'p1' ? 'p1_dama_wins' : 'p2_dama_wins'] += 1;
    } else if (mode === 'snakes') {
      room[winner === 'p1' ? 'p1_snakes_wins' : 'p2_snakes_wins'] += 1;
    } else if (mode === 'uno') {
      const k = winner === 'p1' ? 'p1_uno_wins' : 'p2_uno_wins';
      room[k] = (room[k] || 0) + 1;
    } else if (mode === 'doodle') {
      const k = winner === 'p1' ? 'p1_doodle_wins' : 'p2_doodle_wins';
      room[k] = (room[k] || 0) + 1;
    }
  }
  room.updated_at = new Date().toISOString();
  saveHotspotRoom(room);

  try {
    const raw = localStorage.getItem(STORAGE_HOTSPOT_HISTORY_KEY);
    const list: MatchHistoryRow[] = raw ? (JSON.parse(raw) as MatchHistoryRow[]) : [];
    list.unshift({
      id: `hs-${Date.now()}`,
      room_code: 'LOVEY',
      game_mode: mode,
      winner,
      p1_name: room.p1_avatar.name,
      p2_name: room.p2_avatar.name,
      summary,
      played_at: new Date().toISOString(),
    });
    localStorage.setItem(STORAGE_HOTSPOT_HISTORY_KEY, JSON.stringify(list.slice(0, 30)));
  } catch {
    // ignore
  }
  return room;
}

export function loadHotspotHistory(): MatchHistoryRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_HOTSPOT_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as MatchHistoryRow[]) : [];
  } catch {
    return [];
  }
}

export interface HotspotChannelCallbacks {
  onBroadcast: (event: RealtimeBroadcastEvent) => void;
  onRoomUpdate: (room: CoupleRoomRow) => void;
  onMatchUpdate: (match: ActiveMatchRow) => void;
  onPresenceChange: (partnerOnline: boolean) => void;
  onError?: (msg: string) => void;
}

export class HotspotChannel {
  public readonly role: 'host' | 'guest';
  private callbacks: HotspotChannelCallbacks;
  private ws: WebSocket | null = null;
  private listeners: PluginListenerHandle[] = [];
  private connected = false;
  private destroyed = false;

  constructor(role: 'host' | 'guest', callbacks: HotspotChannelCallbacks) {
    this.role = role;
    this.callbacks = callbacks;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public async startHost(hostAvatar: CatAvatarConfig): Promise<void> {
    if (this.destroyed) return;
    loadHotspotRoom(hostAvatar);

    this.listeners.push(
      await HotspotSync.addListener('clientConnected', () => {
        if (this.destroyed) return;
        this.connected = true;
        this.callbacks.onPresenceChange(true);
        const room = loadHotspotRoom(hostAvatar);
        const match = loadHotspotMatch();
        this.sendPacket({ kind: 'full_sync', room, match });
      })
    );

    this.listeners.push(
      await HotspotSync.addListener('clientDisconnected', () => {
        if (this.destroyed) return;
        this.connected = false;
        this.callbacks.onPresenceChange(false);
      })
    );

    this.listeners.push(
      await HotspotSync.addListener('message', ({ payload }) => {
        if (this.destroyed) return;
        this.handleIncomingPayload(payload);
      })
    );

    await HotspotSync.startHost();
  }

  public async joinHost(guestAvatar: CatAvatarConfig): Promise<boolean> {
    if (this.destroyed) return false;
    const discovery = await HotspotSync.discoverHost();
    if (!discovery.found || !discovery.hostIp) {
      this.callbacks.onError?.(
        'Could not find Host phone. Make sure Wi-Fi is connected to the Host Hotspot and Host tapped "Host Hotspot".'
      );
      return false;
    }

    const port = discovery.port || 45456;
    return await new Promise<boolean>((resolve) => {
      let settled = false;
      const ws = new WebSocket(`ws://${discovery.hostIp}:${port}`);
      this.ws = ws;

      const timeout = window.setTimeout(() => {
        if (!settled) {
          settled = true;
          try {
            ws.close();
          } catch {}
          this.callbacks.onError?.('Hotspot connection timed out. Tap Join Hotspot to retry.');
          resolve(false);
        }
      }, 4000);

      ws.onopen = () => {
        if (settled || this.destroyed) return;
        settled = true;
        window.clearTimeout(timeout);
        this.connected = true;
        this.callbacks.onPresenceChange(true);
        this.sendPacket({ kind: 'hello', avatar: guestAvatar });
        resolve(true);
      };

      ws.onmessage = (msg) => {
        if (typeof msg.data === 'string') {
          this.handleIncomingPayload(msg.data);
        }
      };

      ws.onclose = () => {
        window.clearTimeout(timeout);
        this.connected = false;
        this.callbacks.onPresenceChange(false);
        if (!settled) {
          settled = true;
          this.callbacks.onError?.('Host closed the hotspot room.');
          resolve(false);
        }
      };

      ws.onerror = () => {
        window.clearTimeout(timeout);
        if (!settled) {
          settled = true;
          this.callbacks.onError?.('Failed to connect to Host Hotspot.');
          resolve(false);
        }
      };
    });
  }

  private handleIncomingPayload(raw: string): void {
    try {
      const pkt = JSON.parse(raw) as HotspotPacket;
      if (pkt.kind === 'hello') {
        if (this.role === 'host') {
          const room = loadHotspotRoom();
          const updated: CoupleRoomRow = {
            ...room,
            p2_avatar: pkt.avatar,
            updated_at: new Date().toISOString(),
          };
          saveHotspotRoom(updated);
          this.callbacks.onRoomUpdate(updated);
          this.sendPacket({ kind: 'full_sync', room: updated, match: loadHotspotMatch() });
        }
      } else if (pkt.kind === 'full_sync') {
        this.callbacks.onRoomUpdate(pkt.room);
        if (pkt.match) {
          this.callbacks.onMatchUpdate(pkt.match);
        }
      } else if (pkt.kind === 'room_sync') {
        if (this.role === 'host') {
          saveHotspotRoom(pkt.room);
        }
        this.callbacks.onRoomUpdate(pkt.room);
      } else if (pkt.kind === 'match_sync') {
        if (this.role === 'host') {
          saveHotspotMatch(pkt.match);
        }
        this.callbacks.onMatchUpdate(pkt.match);
      } else if (pkt.kind === 'avatar_update') {
        if (this.role === 'host') {
          const room = loadHotspotRoom();
          const updated: CoupleRoomRow = {
            ...room,
            [pkt.slot === 'p1' ? 'p1_avatar' : 'p2_avatar']: pkt.avatar,
            updated_at: new Date().toISOString(),
          };
          saveHotspotRoom(updated);
          this.callbacks.onRoomUpdate(updated);
          this.sendPacket({ kind: 'room_sync', room: updated });
        }
      } else if (pkt.kind === 'broadcast') {
        this.callbacks.onBroadcast(pkt.event);
      }
    } catch {
      // ignore malformed packet
    }
  }

  public sendPacket(pkt: HotspotPacket): void {
    const payload = JSON.stringify(pkt);
    if (this.role === 'host') {
      if (this.connected) {
        void HotspotSync.sendToClient({ payload }).catch(() => {});
      }
    } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    }
  }

  public sendBroadcast(event: RealtimeBroadcastEvent): void {
    this.sendPacket({ kind: 'broadcast', event });
  }

  public syncMatch(match: ActiveMatchRow): void {
    if (this.role === 'host') {
      saveHotspotMatch(match);
    }
    this.sendPacket({ kind: 'match_sync', match });
  }

  public syncRoom(room: CoupleRoomRow): void {
    if (this.role === 'host') {
      saveHotspotRoom(room);
    }
    this.sendPacket({ kind: 'room_sync', room });
  }

  public sendAvatarUpdate(slot: PlayerSlot, avatar: CatAvatarConfig): void {
    if (this.role === 'host') {
      const room = loadHotspotRoom();
      const updated: CoupleRoomRow = {
        ...room,
        [slot === 'p1' ? 'p1_avatar' : 'p2_avatar']: avatar,
        updated_at: new Date().toISOString(),
      };
      saveHotspotRoom(updated);
      this.callbacks.onRoomUpdate(updated);
      this.sendPacket({ kind: 'room_sync', room: updated });
    } else {
      this.sendPacket({ kind: 'avatar_update', slot, avatar });
    }
  }

  public disconnect(): void {
    this.destroyed = true;
    this.connected = false;
    for (const h of this.listeners) {
      void h.remove();
    }
    this.listeners = [];
    if (this.role === 'host') {
      void HotspotSync.stopHost().catch(() => {});
    }
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
  }
}

export interface HotspotSessionHandlers {
  role: 'host' | 'guest';
  myAvatar: CatAvatarConfig;
  onBroadcast: (ev: RealtimeBroadcastEvent) => void;
  onRoomUpdate: (room: CoupleRoomRow) => void;
  onMatchUpdate: (match: ActiveMatchRow) => void;
  onPresenceChange: (online: boolean) => void;
  onError: (msg: string) => void;
}

export async function startHotspotSession(
  handlers: HotspotSessionHandlers
): Promise<HotspotChannel | null> {
  if (handlers.role === 'host') {
    handlers.onRoomUpdate(loadHotspotRoom(handlers.myAvatar));
    const savedMatch = loadHotspotMatch();
    if (savedMatch) handlers.onMatchUpdate(savedMatch);
  }
  const ch = new HotspotChannel(handlers.role, {
    onBroadcast: handlers.onBroadcast,
    onRoomUpdate: handlers.onRoomUpdate,
    onMatchUpdate: handlers.onMatchUpdate,
    onPresenceChange: handlers.onPresenceChange,
    onError: handlers.onError,
  });
  if (handlers.role === 'host') {
    await ch.startHost(handlers.myAvatar);
    return ch;
  }
  const ok = await ch.joinHost(handlers.myAvatar);
  return ok ? ch : null;
}
