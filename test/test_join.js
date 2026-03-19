const { createClient } = require('./node_modules/@insforge/sdk/dist/index.js');
const insforge = createClient({
  baseUrl: 'https://tf4y4rpe.us-east.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQ2NjV9.WE-qL1Z2cdrtAeVg27q_IUFzazg6JzkwKYG4AzVGAdE'
});

async function test() {
  const { data: groups } = await insforge.database.from('chat_groups').select('id').limit(1);
  if (!groups || groups.length === 0) {
    console.log('No groups found');
    return;
  }
  const groupId = groups[0].id;
  console.log('Testing group:', groupId);
  
  const { data, error } = await insforge.database
    .from('chat_group_messages')
    .select('*, profiles(name, username, avatar_url)')
    .eq('group_id', groupId)
    .limit(5);
    
  if (error) {
    console.error('Error fetching with profiles:', error);
  } else {
    console.log('Fetched with profiles:', JSON.stringify(data?.[0]?.profiles, null, 2));
  }

  const { data: data2, error: error2 } = await insforge.database
    .from('chat_group_messages')
    .select('*, profiles:profiles!sender_id(name, username, avatar_url)')
    .eq('group_id', groupId)
    .limit(5);

  if (error2) {
    console.error('Error fetching with profiles!sender_id:', error2);
  } else {
    console.log('Fetched with profiles!sender_id:', JSON.stringify(data2?.[0]?.profiles, null, 2));
  }
}

test();
