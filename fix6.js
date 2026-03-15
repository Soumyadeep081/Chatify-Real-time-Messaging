const fs = require('fs');
let code = fs.readFileSync('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'utf8');
const lines = code.split('\n');
console.log(lines[888].split('').map(c => c.charCodeAt(0)));
