import re

with open('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

replacement = """{isMe ? currentUserAvatar : 
                                    (selectedTarget.type === 'group' && msg.sender_profiles?.avatar_url ? <img src={msg.sender_profiles.avatar_url} className="w-full h-full object-cover" /> : 
                                     (selectedTarget.type === 'user' && selectedTarget.data?.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" /> : senderName?.[0]?.toUpperCase()))}"""

pattern = r"\{senderName\?\.\[0\]\?\.toUpperCase\(\)\}"

new_text = re.sub(pattern, replacement, text, count=1)

with open('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'w', encoding='utf-8') as f:
    f.write(new_text)
