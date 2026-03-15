const { createClient } = require('@insforge/sdk');

const insforge = createClient({
  baseUrl: 'https://tf4y4rpe.us-east.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQ2NjV9.WE-qL1Z2cdrtAeVg27q_IUFzazg6JzkwKYG4AzVGAdE'
});

async function test() {
  const { data, error } = await insforge.database
    .from('chat_group_messages')
    .select('*, profiles(name, username)')
    .eq('group_id', '1e2e193f-d0f3-4c8d-bc27-df3b24cfe729')
    .limit(100);

  console.log("Data:", data);
  console.log("Error:", error);
}

test();
