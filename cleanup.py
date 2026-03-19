import os
import glob
import shutil

# Trash files to delete
trash = [
    "console.log('DATA",
    "console.log(data))",
    "res.json()).then(console.log).catch(console.error)",
    "mkdir.js",
    "test.txt",
    "cleanup_scripts.js",
    "consolidate_scripts.js"
]

# Patterns for scripts to move to scripts folder
patterns = [
    "fetch*.js", "fetch*.py", "fetch*.ps1",
    "fix*.js", "fix*.py", "fix*.ps1",
    "test*.js", "test*.py", "test*.ps1",
    "scripts_ps1.ps1", "fetch_js.js", "fetch_py.py", "fix_js.js", "fix_py.py", "test_js.js"
]

scripts_dir = "scripts"
if not os.path.exists(scripts_dir):
    os.makedirs(scripts_dir)

# Delete trash
for t in trash:
    if os.path.exists(t):
        try:
            os.remove(t)
            print(f"Deleted {t}")
        except Exception as e:
            print(f"Error deleting {t}: {e}")

# Move scripts
for p in patterns:
    for f in glob.glob(p):
        if f == "cleanup.py":
            continue
        dest = os.path.join(scripts_dir, f)
        try:
            # Copy then remove to ensure it works across different mount points if any
            shutil.copy2(f, dest)
            os.remove(f)
            print(f"Moved {f} to {scripts_dir}/")
        except Exception as e:
            print(f"Error moving {f}: {e}")

print("Cleanup complete!")
