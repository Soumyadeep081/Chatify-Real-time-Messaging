const fetch = require('node-fetch');
fetch('http://localhost:3000/api/trending/chatbot', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello', content: { title: 'Test', category: 'Test', source_name: 'Test', source_url: 'Test', description: 'Test' } })
}).then(res => res.json()).then(console.log).catch(console.error);
