const { createClient } = require('c:/Users/91620/chatapp/node_modules/@insforge/sdk/dist/index.js');
const insforge = createClient({
  baseUrl: 'https://tf4y4rpe.us-east.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQ2NjV9.WE-qL1Z2cdrtAeVg27q_IUFzazg6JzkwKYG4AzVGAdE'
});

async function test() {
  await insforge.realtime.connect();
  console.log('Connected');
  
  // Notice we DON'T subscribe here
  try {
    const res = await insforge.realtime.publish('random_channel_123', 'test_event', { hello: 'world' });
    console.log('Publish result:', res);
  } catch (e) {
    console.log('Publish threw error:', e.message);
  }
  process.exit(0);
}

test();
