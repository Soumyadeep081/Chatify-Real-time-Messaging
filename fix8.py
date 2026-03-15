import codecs
with codecs.open('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'r', 'utf-8') as f:
    lines = f.readlines()

replacement = '                                   {isMe ? currentUserAvatar : (selectedTarget.type === "group" && msg.sender_profiles?.avatar_url ? <img src={msg.sender_profiles.avatar_url} className="w-full h-full object-cover" /> : (selectedTarget.type === "user" && selectedTarget.data?.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" /> : senderName?.[0]?.toUpperCase()))}\r\n'

print("Original line:", repr(lines[888]))
lines[888] = replacement

with codecs.open('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'w', 'utf-8') as f:
    f.writelines(lines)
