/**
 * COMBINED SCRIPTS: fix_js.js
 */

// ==========================================
// START OF: fix4.js
// ==========================================
(function() {
const fs = require('fs');
let code = fs.readFileSync('components/ChatRoom.tsx', 'utf8');
code = code.replace(
  '{senderName?.[0]?.toUpperCase()}', 
  '{isMe ? currentUserAvatar : (selectedTarget.type === "group" && msg.sender_profiles?.avatar_url ? <img src={msg.sender_profiles.avatar_url} className="w-full h-full object-cover" /> : (selectedTarget.type === "user" && selectedTarget.data?.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" /> : senderName?.[0]?.toUpperCase()))}'
);
fs.writeFileSync('components/ChatRoom.tsx', code);
console.log('Done!');
})();
// ==========================================
// END OF: fix4.js
// ==========================================

// ==========================================
// START OF: fix5.js
// ==========================================
(function() {
const fs = require('fs');
let code = fs.readFileSync('components/ChatRoom.tsx', 'utf8');
code = code.replace(
  /\{\s*senderName\?\.\s*\[0\]\?\.\s*toUpperCase\(\)\s*\}/g, 
  '{isMe ? currentUserAvatar : (selectedTarget.type === "group" && msg.sender_profiles?.avatar_url ? <img src={msg.sender_profiles.avatar_url} className="w-full h-full object-cover" /> : (selectedTarget.type === "user" && selectedTarget.data?.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" /> : senderName?.[0]?.toUpperCase()))}'
);
fs.writeFileSync('components/ChatRoom.tsx', code);
console.log('Done!');
})();
// ==========================================
// END OF: fix5.js
// ==========================================

// ==========================================
// START OF: fix6.js
// ==========================================
(function() {
const fs = require('fs');
let code = fs.readFileSync('components/ChatRoom.tsx', 'utf8');
const lines = code.split('\n');
if(lines[888]) console.log(lines[888].split('').map(c => c.charCodeAt(0)));
})();
// ==========================================
// END OF: fix6.js
// ==========================================

// ==========================================
// START OF: fix7.js
// ==========================================
(function() {
const fs = require('fs');
let code = fs.readFileSync('components/ChatRoom.tsx', 'utf8');
const target = '                                   {senderName?.[0]?.toUpperCase()}';
const replacement = '                                   {isMe ? currentUserAvatar : (selectedTarget.type === "group" && msg.sender_profiles?.avatar_url ? <img src={msg.sender_profiles.avatar_url} className="w-full h-full object-cover" /> : (selectedTarget.type === "user" && selectedTarget.data?.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" /> : senderName?.[0]?.toUpperCase()))}';
code = code.split(target).join(replacement);
fs.writeFileSync('components/ChatRoom.tsx', code);
console.log('Fixed');
})();
// ==========================================
// END OF: fix7.js
// ==========================================

// ==========================================
// START OF: fix10.js
// ==========================================
(function() {
const fs = require('fs');
let code = fs.readFileSync('components/ChatRoom.tsx', 'utf8');
const lines = code.split('\n');
if(lines[888]) {
    lines[888] = '                                   {isMe ? currentUserAvatar : (selectedTarget.type === "group" && msg.sender_profiles?.avatar_url ? <img src={msg.sender_profiles.avatar_url} className="w-full h-full object-cover" /> : (selectedTarget.type === "user" && selectedTarget.data?.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" /> : senderName?.[0]?.toUpperCase()))}\r';
    code = lines.join('\n');
    fs.writeFileSync('components/ChatRoom.tsx', code);
    console.log('Fixed exactly at line 888');
}
})();
// ==========================================
// END OF: fix10.js
// ==========================================

// ==========================================
// START OF: fix_avatar.js
// ==========================================
(function() {
const fs = require('fs'); 
let c = fs.readFileSync('components/ChatRoom.tsx', 'utf8'); 
c = c.replace(/{senderName\?\.\[0\]\?\.toUpperCase\(\)}/, '{isMe ? currentUserAvatar : (selectedTarget.type === \'group\' && msg.sender_profiles?.avatar_url ? <img src={msg.sender_profiles.avatar_url} className="w-full h-full object-cover" /> : (selectedTarget.type === \'user\' && selectedTarget.data?.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" /> : senderName?.[0]?.toUpperCase()))}'); 
fs.writeFileSync('components/ChatRoom.tsx', c);
})();
// ==========================================
// END OF: fix_avatar.js
// ==========================================

// ==========================================
// START OF: fix_avatar2.js
// ==========================================
(function() {
const fs = require('fs');
let c = fs.readFileSync('components/ChatRoom.tsx', 'utf8');
c = c.replace('{senderName?.[0]?.toUpperCase()}', '{isMe ? currentUserAvatar : (selectedTarget.type === \'group\' && msg.sender_profiles?.avatar_url ? <img src={msg.sender_profiles.avatar_url} className="w-full h-full object-cover" /> : (selectedTarget.type === \'user\' && selectedTarget.data?.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" /> : senderName?.[0]?.toUpperCase()))}');
fs.writeFileSync('components/ChatRoom.tsx', c);
})();
// ==========================================
// END OF: fix_avatar2.js
// ==========================================

// ==========================================
// START OF: fix_avatar_final.js
// ==========================================
(function() {
const fs = require('fs');
const filePath = 'components/ChatRoom.tsx';
if (fs.existsSync(filePath)) {
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
}
})();
// ==========================================
// END OF: fix_avatar_final.js
// ==========================================

// ==========================================
// START OF: fix_final.js
// ==========================================
(function() {
const fs = require('fs');
const path = require('path');

const filePath = 'components/ChatRoom.tsx';
if(fs.existsSync(filePath)){
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
}
})();
// ==========================================
// END OF: fix_final.js
// ==========================================
