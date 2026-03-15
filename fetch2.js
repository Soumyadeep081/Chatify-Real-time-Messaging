const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'apiKey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQ2NjV9.WE-qL1Z2cdrtAeVg27q_IUFzazg6JzkwKYG4AzVGAdE' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({status: res.statusCode, body: data}));
    }).on('error', reject);
  })
}

async function run() {
  const url = 'https://tf4y4rpe.us-east.insforge.app/api/database/records/chat_groups?select=*,chat_group_members(user_id,profiles!chat_group_members_user_id_fkey(name,avatar_url))';
  try {
    const res = await get(url);
    console.log("STATUS:", res.status);
    console.log("BODY:", res.body);
    require('fs').writeFileSync('req_out.txt', res.body);
  } catch(e) {
    console.error(e);
  }
}
run();
