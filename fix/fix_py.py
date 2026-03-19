"""
COMBINED SCRIPTS: fix_py.py
"""

# ==========================================
# START OF: fix.py
# ==========================================
import re
def run_fix_py():
    try:
        with open('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'r', encoding='utf-8') as f:
            text = f.read()

        replacement = """{isMe ? currentUserAvatar : 
                                            (selectedTarget.type === 'group' && msg.sender_profiles?.avatar_url ? <img src={msg.sender_profiles.avatar_url} className="w-full h-full object-cover" /> : 
                                             (selectedTarget.type === 'user' && selectedTarget.data?.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" /> : senderName?.[0]?.toUpperCase()))}"""

        pattern = r"\{senderName\?\.\[0\]\?\.toUpperCase\(\)\}"
        new_text = re.sub(pattern, replacement, text, count=1)

        with open('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'w', encoding='utf-8') as f:
            f.write(new_text)
    except Exception as e:
        print(f"Error in fix.py: {e}")

# ==========================================
# END OF: fix.py
# ==========================================


# ==========================================
# START OF: fix8.py
# ==========================================
import codecs
def run_fix8_py():
    try:
        with codecs.open('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'r', 'utf-8') as f:
            lines = f.readlines()

        replacement = '                                   {isMe ? currentUserAvatar : (selectedTarget.type === "group" && msg.sender_profiles?.avatar_url ? <img src={msg.sender_profiles.avatar_url} className="w-full h-full object-cover" /> : (selectedTarget.type === "user" && selectedTarget.data?.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" /> : senderName?.[0]?.toUpperCase()))}\r\n'

        if len(lines) > 888:
            print("Original line:", repr(lines[888]))
            lines[888] = replacement
            with codecs.open('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'w', 'utf-8') as f:
                f.writelines(lines)
    except Exception as e:
        print(f"Error in fix8.py: {e}")

# ==========================================
# END OF: fix8.py
# ==========================================


# ==========================================
# START OF: fix9.py
# ==========================================
def run_fix9_py():
    try:
        import codecs
        with codecs.open('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'r', 'utf-8') as f:
            lines = f.readlines()

        # Replace the line that CONTAINS 'senderName?.[0]?.toUpperCase()'
        for i, line in enumerate(lines):
            if 'senderName?.[0]?.toUpperCase()' in line:
                print(f"Found it on line {i}")
                indent = line[:len(line) - len(line.lstrip())]
                lines[i] = indent + '{isMe ? currentUserAvatar : (selectedTarget.type === "group" && msg.sender_profiles?.avatar_url ? <img src={msg.sender_profiles.avatar_url} className="w-full h-full object-cover" /> : (selectedTarget.type === "user" && selectedTarget.data?.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" /> : senderName?.[0]?.toUpperCase()))}\r\n'
                break

        with codecs.open('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'w', 'utf-8') as f:
            f.writelines(lines)
    except Exception as e:
        print(f"Error in fix9.py: {e}")

# ==========================================
# END OF: fix9.py
# ==========================================


# ==========================================
# START OF: fix12.py
# ==========================================
def run_fix12_py():
    try:
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
    except Exception as e:
        print(f"Error in fix12.py: {e}")

# ==========================================
# END OF: fix12.py
# ==========================================


# ==========================================
# START OF: fix_avatar3.py
# ==========================================
def run_fix_avatar3_py():
    try:
        import codecs
        with codecs.open('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'r', 'utf-8') as f:
            text = f.read()

        replacement = '{isMe ? currentUserAvatar : (selectedTarget.type === "group" && msg.sender_profiles?.avatar_url ? <img src={msg.sender_profiles.avatar_url} className="w-full h-full object-cover" /> : (selectedTarget.type === "user" && selectedTarget.data?.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" /> : senderName?.[0]?.toUpperCase()))}'
        new_text = text.replace('{senderName?.[0]?.toUpperCase()}', replacement)

        with codecs.open('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'w', 'utf-8') as f:
            f.write(new_text)
    except Exception as e:
        print(f"Error in fix_avatar3.py: {e}")

# ==========================================
# END OF: fix_avatar3.py
# ==========================================


# ==========================================
# START OF: find.py
# ==========================================
def run_find_py():
    try:
        import codecs
        with codecs.open('c:/Users/91620/chatapp/components/ChatRoom.tsx', 'r', 'utf-8') as f:
            for i, line in enumerate(f):
                if 'senderName' in line:
                    print(f"{i}: {repr(line)}")
    except Exception as e:
        print(f"Error in find.py: {e}")

# ==========================================
# END OF: find.py
# ==========================================
