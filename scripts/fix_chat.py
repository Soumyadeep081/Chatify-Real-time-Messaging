import sys
import os

filepath = r'c:\Users\91620\chatapp\components\ChatRoom.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

target = 'm.content.split(/(@\\w+)/g);\n                                      return (\n                                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">'
replacement = 'm.content.split(/(@\\w+)/g);\n                                      return (\n                                        <p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${isMe ? "text-black" : (isDark ? "text-white" : "text-gray-900")}`}>\n'

# Try a simpler match if that fails
if target not in content:
    print("Exact target not found, trying partial match...")
    content = content.replace('<p className="text-[15px] leading-relaxed whitespace-pre-wrap">', '<p className={`text-[15px] leading-relaxed whitespace-pre-wrap ${isMe ? "text-black" : (isDark ? "text-white" : "text-gray-900")}`}>\n')
else:
    content = content.replace(target, replacement)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done")
