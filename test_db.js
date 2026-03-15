const { createClient } = require('@insforge/sdk');
const insforge = createClient({
  baseUrl: 'https://tf4y4rpe.us-east.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQ2NjV9.WE-qL1Z2cdrtAeVg27q_IUFzazg6JzkwKYG4AzVGAdE'
});

async function run() {
  const { data: gData, error: gError } = await insforge.database.from('chat_groups').select('*, chat_group_members(user_id, profiles(name, avatar_url))').limit(1);
  console.log('Groups check:', gError ? gError : 'OK');

  const { data: sData, error: sError } = await insforge.database.from('user_stories').select('*, profiles!inner(name, email, avatar_url)').limit(1);
  console.log('Stories check:', sError ? sError : 'OK');

  const { data: rpcData, error: rpcError } = await insforge.database.rpc('get_call_history', { user_uuid: '00000000-0000-0000-0000-000000000000' });
  console.log('RPC check:', rpcError ? rpcError : 'OK');
}
run();
