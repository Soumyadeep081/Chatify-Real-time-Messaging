import codecs

with codecs.open('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'r', 'utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '{senderName?.[0]?.toUpperCase()}' in line:
        print(f"Match found at line {i+1}")
        
        indent = line[:len(line) - len(line.lstrip())]
        lines[i] = indent + '{isMe ? currentUserAvatar : (selectedTarget.type === "group" && msg.sender_profiles?.avatar_url ? <img src={msg.sender_profiles.avatar_url} className="w-full h-full object-cover" /> : (selectedTarget.type === "user" && selectedTarget.data?.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" /> : senderName?.[0]?.toUpperCase()))}\r\n'

with codecs.open('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'w', 'utf-8') as f:
    f.writelines(lines)
