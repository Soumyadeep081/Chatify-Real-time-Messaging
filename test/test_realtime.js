const { createClient } = require('./node_modules/@insforge/sdk/dist/index.js');
const insforge = createClient({
  baseUrl: 'https://tf4y4rpe.us-east.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQ2NjV9.WE-qL1Z2cdrtAeVg27q_IUFzazg6JzkwKYG4AzVGAdE'
});

async function test() {
  await insforge.realtime.connect();
  console.log('Connected');
  
  insforge.realtime.subscribe('test_channel');
  
  insforge.realtime.on('test_event', (msg) => {
    console.log('Received test_event:', JSON.stringify(msg, null, 2));
    process.exit(0);
  });
  
  setTimeout(() => {
    console.log('Publishing test_event...');
    insforge.realtime.publish('test_channel', 'test_event', { hello: 'world' });
  }, 1000);
  
  setTimeout(() => {
    console.log('Timeout');
    process.exit(1);
  }, 10000);
}

test();
