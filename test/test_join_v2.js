const { createClient } = require('@insforge/sdk');
const fs = require('fs');

const insforge = createClient({
  baseUrl: 'https://tf4y4rpe.us-east.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQ2NjV9.WE-qL1Z2cdrtAeVg27q_IUFzazg6JzkwKYG4AzVGAdE'
});

async function run() {
  try {
    const { data: mData, error: mError } = await insforge.database
      .from('chat_group_messages')
      .select('*, profiles:profiles!sender_id(name, email)')
      .limit(1);
    
    const output = {
        error: mError,
        data: mData
    };
    fs.writeFileSync('test_output.json', JSON.stringify(output, null, 2));
    console.log('Done');
  } catch (e) {
    fs.writeFileSync('test_error.txt', e.stack);
  }
}
run();
