"""
COMBINED SCRIPTS: fetch_py.py
"""

# ==========================================
# START OF: fetch5.py
# ==========================================

import urllib.request
import urllib.error

url = "https://tf4y4rpe.us-east.insforge.app/api/database/records/chat_groups?select=*,chat_group_members(user_id,profiles(name,avatar_url))"
req = urllib.request.Request(url, headers={'apiKey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NTQ2NjV9.WE-qL1Z2cdrtAeVg27q_IUFzazg6JzkwKYG4AzVGAdE'})

try:
    with urllib.request.urlopen(req) as response:
        print(response.read().decode())
except urllib.error.HTTPError as e:
    print(f"Error {e.code}:\n{e.read().decode()}")
except Exception as e:
    print(str(e))

# ==========================================
# END OF: fetch5.py
# ==========================================
