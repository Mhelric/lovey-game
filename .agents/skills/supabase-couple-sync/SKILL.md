---
name: supabase-couple-sync
description: >-
  Architecture and runbook for Supabase Realtime Broadcast, Presence, and PostgreSQL
  persistence (couple_rooms, active_matches, match_history) in Cartoon Cat Couple's Arcade.
  Activate when configuring Supabase, syncing multiplayer turns, or debugging reconnect logic.
---

# Supabase Couple Sync Skill

## 1. Dual-Channel Synchronization Pattern

1. **Realtime Broadcast (`< 50ms`, Ephemeral):**
   - Channel name: `room:${roomCode}`
   - Events:
     - `reaction`: Floating emoji or quick chat bubble (`{ id, sender, content, kind }`)
     - `dice_shake`: Live dice box shake preview before roll completes
     - `move_step`: Immediate optimistic move broadcast alongside DB upsert
2. **Realtime Presence:**
   - Tracks `{ slot: 'p1' | 'p2', onlineAt }` so both phones display a live green online indicator when the partner is connected.
3. **PostgreSQL Authoritative Persistence (`supabase/schema.sql`):**
   - `couple_rooms`: Stores `p1_avatar`, `p2_avatar`, lifetime win counters (`p1_dama_wins`, `p2_dama_wins`, `p1_snakes_wins`, `p2_snakes_wins`), and `current_mode`.
   - `active_matches`: Stores authoritative `state_json`, `turn`, and `board_seed`. When either phone wakes from sleep or reconnects to mobile data, it fetches `active_matches` to restore the exact board state.
   - `match_history`: Logs finished games for the Couple Scoreboard modal.
