const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'ChatRoom.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const replacement = '{isMe ? currentUserAvatar : (selectedTarget.type === "group" && msg.sender_profiles?.avatar_url ? <img src={msg.sender_profiles.avatar_url} className="w-full h-full object-cover" /> : (selectedTarget.type === "user" && selectedTarget.data?.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" /> : senderName?.[0]?.toUpperCase()))}';

// Try standard replacement
if (code.includes('{senderName?.[0]?.toUpperCase()}')) {
    code = code.replace('{senderName?.[0]?.toUpperCase()}', replacement);
    fs.writeFileSync(filePath, code);
    console.log("Success: Replaced using exact match.");
} else {
    code = code.replace(/\{senderName\?\.\[0\]\?\.toUpperCase\(\)\}/g, replacement);
    fs.writeFileSync(filePath, code);
    console.log("Fall back to regex replace.");
}
