const { createClient } = require('@insforge/sdk');
const insforge = createClient({
  baseUrl: 'https://tf4y4rpe.us-east.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQ2NjV9.WE-qL1Z2cdrtAeVg27q_IUFzazg6JzkwKYG4AzVGAdE'
});

async function run() {
  const { data: mData, error: mError } = await insforge.database
    .from('chat_group_messages')
    .select('*, sender_profiles:profiles!sender_id(name, email)')
    .limit(1);
  console.log('Messages check:', mError ? mError : 'OK', mData);
}
run();
