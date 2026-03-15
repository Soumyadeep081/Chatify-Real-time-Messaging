const https = require('https');
https.get('https://tf4y4rpe.us-east.insforge.app/api/database/records/chat_groups?select=*,chat_group_members(user_id,profiles(name,avatar_url))', { headers: { 'apiKey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQ2NjV9.WE-qL1Z2cdrtAeVg27q_IUFzazg6JzkwKYG4AzVGAdE' } }, res => { 
  let data = ''; 
  res.on('data', c => data += c); 
  res.on('end', () => require('fs').writeFileSync('req_out2.txt', data)); 
});
