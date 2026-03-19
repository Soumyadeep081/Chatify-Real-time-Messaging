/**
 * Apply missing game SQL to Insforge database.
 * This adds:
 *  1. game_state_json and last_writer_id columns to game_sessions (if missing)
 *  2. sync_game_state RPC function
 *  3. upsert_game_session and upsert_game_player RPCs (idempotent re-create)
 */

const INSFORGE_URL = 'https://tf4y4rpe.us-east.insforge.app';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQ2NjV9.WE-qL1Z2cdrtAeVg27q_IUFzazg6JzkwKYG4AzVGAdE';

const SQL_STATEMENTS = [
  // 1. Add missing columns to game_sessions (idempotent)
  `ALTER TABLE game_sessions 
   ADD COLUMN IF NOT EXISTS game_state_json TEXT,
   ADD COLUMN IF NOT EXISTS last_writer_id UUID,
   ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'waiting';`,

  // 2. Create/replace upsert_game_session RPC
  `CREATE OR REPLACE FUNCTION upsert_game_session(
    p_room_id TEXT, p_game_type TEXT, p_host_id UUID
  ) RETURNS VOID LANGUAGE plpgsql AS $$
  BEGIN
    INSERT INTO game_sessions (id, game_type, host_id, status, created_at)
    VALUES (p_room_id, p_game_type, p_host_id, 'waiting', NOW())
    ON CONFLICT (id) DO UPDATE SET
      host_id = EXCLUDED.host_id,
      game_type = EXCLUDED.game_type;
  END;
  $$;`,

  // 3. Create/replace upsert_game_player RPC
  `CREATE OR REPLACE FUNCTION upsert_game_player(
    p_room_id TEXT, p_user_id UUID, p_player_name TEXT, p_is_host BOOLEAN
  ) RETURNS VOID LANGUAGE plpgsql AS $$
  BEGIN
    INSERT INTO game_session_players (room_id, user_id, player_name, is_host, last_seen)
    VALUES (p_room_id, p_user_id, p_player_name, p_is_host, NOW())
    ON CONFLICT (room_id, user_id) DO UPDATE SET
      player_name = EXCLUDED.player_name,
      is_host = EXCLUDED.is_host,
      last_seen = NOW();
  END;
  $$;`,

  // 4. Create/replace sync_game_state RPC (THE MISSING ONE)
  `CREATE OR REPLACE FUNCTION sync_game_state(
    p_room_id TEXT, p_status TEXT, p_game_state_json TEXT, p_writer_id UUID
  ) RETURNS VOID LANGUAGE plpgsql AS $$
  BEGIN
    UPDATE game_sessions SET
      status = p_status,
      game_state_json = p_game_state_json,
      last_writer_id = p_writer_id
    WHERE id = p_room_id;
  END;
  $$;`,
];

async function runSQL(sql) {
  const resp = await fetch(`${INSFORGE_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await resp.text();
  return { status: resp.status, body: text };
}

async function main() {
  console.log('Applying game SQL to Insforge...\n');
  
  for (let i = 0; i < SQL_STATEMENTS.length; i++) {
    const sql = SQL_STATEMENTS[i];
    const preview = sql.trim().split('\n')[0].substring(0, 60);
    process.stdout.write(`[${i+1}/${SQL_STATEMENTS.length}] ${preview}... `);
    
    try {
      const result = await runSQL(sql);
      if (result.status >= 200 && result.status < 300) {
        console.log(`✓ (${result.status})`);
      } else {
        console.log(`✗ (${result.status}): ${result.body.substring(0, 200)}`);
      }
    } catch (e) {
      console.log(`✗ ERROR: ${e.message}`);
    }
  }
  
  console.log('\nDone!');
}

main();
