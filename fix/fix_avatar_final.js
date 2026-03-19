const fs = require('fs');
const filePath = 'components/ChatRoom.tsx';
let code = fs.readFileSync(filePath, 'utf8');
const searchString = '{senderName?.[0]?.toUpperCase()}';
const replacementString = '{isMe ? currentUserAvatar : (selectedTarget.type === "group" && msg.sender_profiles?.avatar_url ? <img src={msg.sender_profiles.avatar_url} className="w-full h-full object-cover" /> : (selectedTarget.type === "user" && selectedTarget.data?.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" /> : senderName?.[0]?.toUpperCase()))}';

if (code.includes(searchString)) {
    code = code.replace(searchString, replacementString);
    fs.writeFileSync(filePath, code);
    console.log('Successfully replaced the avatar code!');
} else {
    console.log('Search string not found in the file.');
}
