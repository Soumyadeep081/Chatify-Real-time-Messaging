$anon = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQ2NjV9.WE-qL1Z2cdrtAeVg27q_IUFzazg6JzkwKYG4AzVGAdE"
$headers = @{ "apiKey" = $anon }
try {
  $response = Invoke-RestMethod -Method Get -Uri "https://tf4y4rpe.us-east.insforge.app/api/database/records/chat_groups?select=*,chat_group_members(user_id,profiles(name,avatar_url))" -Headers $headers
  $response | ConvertTo-Json -Depth 10
} catch {
  Write-Output "Error:"
  Write-Output $_.Exception.Response
  $reader = new-object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
  $reader.ReadToEnd()
}
