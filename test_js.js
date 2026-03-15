/**
 * COMBINED SCRIPTS: test_js.js
 */

// ==========================================
// START OF: test_chatbot.js
// ==========================================
(function() {
const fetch = require('node-fetch');
fetch('http://localhost:3000/api/trending/chatbot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello', content: { title: 'Test', category: 'Test', source_name: 'Test', source_url: 'Test', description: 'Test' } })
}).then(res => res.json()).then(console.log).catch(console.error);
})();
// ==========================================
// END OF: test_chatbot.js
// ==========================================


// ==========================================
// START OF: test_db.js
// ==========================================
(function() {
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
})();
// ==========================================
// END OF: test_db.js
// ==========================================


// ==========================================
// START OF: test_err.js
// ==========================================
(function() {
const { createClient } = require('@insforge/sdk'); 
const db = createClient({baseUrl: 'https://tf4y4rpe.us-east.insforge.app', anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQ2NjV9.WE-qL1Z2cdrtAeVg27q_IUFzazg6JzkwKYG4AzVGAdE'}).database; 
async function run() { 
    const { error } = await db.from('chat_groups').select('*, chat_group_members(user_id, profiles(name, avatar_url))').limit(1); 
    require('fs').writeFileSync('err.json', JSON.stringify(error, null, 2)); 
    // process.exit(0); // Disabled in combined
} 
run();
})();
// ==========================================
// END OF: test_err.js
// ==========================================


// ==========================================
// START OF: test_groups.js
// ==========================================
(function() {
const { createClient } = require('@insforge/sdk'); 
const db = createClient({baseUrl: 'https://tf4y4rpe.us-east.insforge.app', anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQ2NjV9.WE-qL1Z2cdrtAeVg27q_IUFzazg6JzkwKYG4AzVGAdE'}).database; 
async function main() { 
    const res = await db.from('chat_groups').select('*, chat_group_members(user_id, profiles(name, avatar_url))'); 
    console.log(JSON.stringify(res, null, 2)); 
} 
main();
})();
// ==========================================
// END OF: test_groups.js
// ==========================================


// ==========================================
// START OF: test_groups_fetch.js
// ==========================================
(function() {
const { createClient } = require('@insforge/sdk'); 
const db = createClient({baseUrl: 'https://tf4y4rpe.us-east.insforge.app', anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQ2NjV9.WE-qL1Z2cdrtAeVg27q_IUFzazg6JzkwKYG4AzVGAdE'}).database; 
async function main() { 
    const res = await db.from('chat_group_messages').select('*, sender_profiles:profiles(name, email)').limit(1); 
    console.log(JSON.stringify(res, null, 2)); 
} 
main();
})();
// ==========================================
// END OF: test_groups_fetch.js
// ==========================================


// ==========================================
// START OF: test_groups_fetch2.js
// ==========================================
(function() {
const { createClient } = require('@insforge/sdk'); 
const db = createClient({baseUrl: 'https://tf4y4rpe.us-east.insforge.app', anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQ2NjV9.WE-qL1Z2cdrtAeVg27q_IUFzazg6JzkwKYG4AzVGAdE'}).database; 
async function main() { 
    const res = await db.from('chat_group_messages').select('*, sender_profiles:profiles(name, email)').limit(1); 
    require('fs').writeFileSync('c:\\Users\\91620\\chatapp\\res.json', JSON.stringify(res, null, 2)); 
} 
main();
})();
// ==========================================
// END OF: test_groups_fetch2.js
// ==========================================


// ==========================================
// START OF: test_msgs.js
// ==========================================
(function() {
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
})();
// ==========================================
// END OF: test_msgs.js
// ==========================================
