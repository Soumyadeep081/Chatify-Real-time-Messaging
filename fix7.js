const fs = require('fs');
let code = fs.readFileSync('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'utf8');
const target = '                                   {senderName?.[0]?.toUpperCase()}';
const replacement = '                                   {isMe ? currentUserAvatar : (selectedTarget.type === "group" && msg.sender_profiles?.avatar_url ? <img src={msg.sender_profiles.avatar_url} className="w-full h-full object-cover" /> : (selectedTarget.type === "user" && selectedTarget.data?.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" /> : senderName?.[0]?.toUpperCase()))}';
code = code.split(target).join(replacement);
fs.writeFileSync('c:/Users/91620/chatapp/components/ChatRoom.tsx', code);
console.log('Fixed');
