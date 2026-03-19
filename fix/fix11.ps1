$content = Get-Content -Raw "c:\Users\91620\chatapp\components\ChatRoom.tsx"
$replacement = '{isMe ? currentUserAvatar : (selectedTarget.type === "group" && msg.sender_profiles?.avatar_url ? <img src={msg.sender_profiles.avatar_url} className="w-full h-full object-cover" /> : (selectedTarget.type === "user" && selectedTarget.data?.avatar_url ? <img src={selectedTarget.data.avatar_url} className="w-full h-full object-cover" /> : senderName?.[0]?.toUpperCase()))}'
$content = $content.Replace('{senderName?.[0]?.toUpperCase()}', $replacement)
[IO.File]::WriteAllText("c:\Users\91620\chatapp\components\ChatRoom.tsx", $content)
