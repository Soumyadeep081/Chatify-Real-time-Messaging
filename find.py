import codecs

with codecs.open('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'r', 'utf-8') as f:
    for i, line in enumerate(f):
        if 'senderName' in line:
            print(f"{i}: {repr(line)}")
