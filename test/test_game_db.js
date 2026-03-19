const { createClient } = require('@insforge/sdk');
const insforge = createClient({
  baseUrl: 'https://tf4y4rpe.us-east.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQ2NjV9.WE-qL1Z2cdrtAeVg27q_IUFzazg6JzkwKYG4AzVGAdE'
});

async function main() {
  console.log('=== Testing game DB state ===\n');

  // 1. Test game_sessions table with new columns
  console.log('1. Checking game_sessions table...');
  const { data: sessions, error: sessErr } = await insforge.database
    .from('game_sessions')
    .select('id, status, game_state_json, last_writer_id')
    .limit(3);
  console.log('   error:', sessErr ? JSON.stringify(sessErr) : 'none');
  console.log('   data:', sessions ? JSON.stringify(sessions).substring(0, 200) : 'null');
  console.log();

  // 2. Test game_session_players table
  console.log('2. Checking game_session_players table...');
  const { data: players, error: playErr } = await insforge.database
    .from('game_session_players')
    .select('*')
    .limit(3);
  console.log('   error:', playErr ? JSON.stringify(playErr) : 'none');
  console.log('   data:', players ? JSON.stringify(players).substring(0, 200) : 'null');
  console.log();

  // 3. Test upsert_game_session RPC
  console.log('3. Testing upsert_game_session RPC...');
  const testRoomId = `test_${Date.now()}`;
  const { error: ugsErr } = await insforge.database.rpc('upsert_game_session', {
    p_room_id: testRoomId,
    p_game_type: 'tic_tac_toe',
    p_host_id: '00000000-0000-0000-0000-000000000001'
  });
  console.log('   error:', ugsErr ? JSON.stringify(ugsErr) : 'none ✓');
  console.log();

  // 4. Test upsert_game_player RPC
  console.log('4. Testing upsert_game_player RPC...');
  const { error: ugpErr } = await insforge.database.rpc('upsert_game_player', {
    p_room_id: testRoomId,
    p_user_id: '00000000-0000-0000-0000-000000000001',
    p_player_name: 'TestPlayer',
    p_is_host: true
  });
  console.log('   error:', ugpErr ? JSON.stringify(ugpErr) : 'none ✓');
  console.log();

  // 5. Test sync_game_state RPC (the likely missing one)
  console.log('5. Testing sync_game_state RPC...');
  const { error: sgsErr } = await insforge.database.rpc('sync_game_state', {
    p_room_id: testRoomId,
    p_status: 'playing',
    p_game_state_json: JSON.stringify({ status: 'playing', test: true }),
    p_writer_id: '00000000-0000-0000-0000-000000000001'
  });
  console.log('   error:', sgsErr ? JSON.stringify(sgsErr) : 'none ✓');
  console.log();

  // 6. Check if game_state_json was written
  console.log('6. Verifying sync_game_state wrote data...');
  const { data: verify, error: verErr } = await insforge.database
    .from('game_sessions')
    .select('id, status, game_state_json, last_writer_id')
    .eq('id', testRoomId)
    .maybeSingle();
  console.log('   error:', verErr ? JSON.stringify(verErr) : 'none');
  console.log('   data:', verify ? JSON.stringify(verify) : 'null');
  console.log();

  // Clean up
  await insforge.database.from('game_session_players').delete().eq('room_id', testRoomId);
  await insforge.database.from('game_sessions').delete().eq('id', testRoomId);
  console.log('7. Cleanup done.\n');
  console.log('=== Summary ===');
  if (!sessErr) console.log('✓ game_sessions table (with game_state_json, last_writer_id) - OK');
  else console.log('✗ game_sessions - MISSING or columns missing:', JSON.stringify(sessErr));
  if (!playErr) console.log('✓ game_session_players table - OK');
  else console.log('✗ game_session_players - MISSING:', JSON.stringify(playErr));
  if (!ugsErr) console.log('✓ upsert_game_session RPC - OK');
  else console.log('✗ upsert_game_session RPC - MISSING:', JSON.stringify(ugsErr));
  if (!ugpErr) console.log('✓ upsert_game_player RPC - OK');
  else console.log('✗ upsert_game_player RPC - MISSING:', JSON.stringify(ugpErr));
  if (!sgsErr) console.log('✓ sync_game_state RPC - OK');
  else console.log('✗ sync_game_state RPC - MISSING:', JSON.stringify(sgsErr));
}

main().catch(e => console.error('Fatal:', e));
