import os, glob

# Find the actual path to the project
search_paths = [
    "/vercel/share/v0-project/lib/ai-brain.ts",
    "/home/user/v0-project/lib/ai-brain.ts",
    os.path.expanduser("~/v0-project/lib/ai-brain.ts"),
]

# Also search broadly
found = glob.glob("/home/**/ai-brain.ts", recursive=True) + \
        glob.glob("/vercel/**/ai-brain.ts", recursive=True) + \
        glob.glob("/tmp/**/ai-brain.ts", recursive=True)

print("CWD:", os.getcwd())
print("Glob found:", found)
for p in search_paths:
    print(f"Exists {p}:", os.path.exists(p))

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split("\n")
print(f"Total lines: {len(lines)}")

# Find all occurrences of 'export function compressHistory'
hits = [i for i, l in enumerate(lines) if "export function compressHistory" in l]
print(f"compressHistory defined at lines: {[h+1 for h in hits]}")

if len(hits) > 1:
    # Keep everything up to (but not including) the second definition
    # Walk backwards from second hit to find the blank line before it
    cut = hits[1]
    while cut > 0 and lines[cut-1].strip() == "":
        cut -= 1
    kept = lines[:cut]
    new_content = "\n".join(kept) + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Fixed: removed second definition (was at line {hits[1]+1}). File now has {len(kept)} lines.")
else:
    print("No duplicate found — file is already clean.")

# Print full file for verification
with open(path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f.readlines(), 1):
        print(f"{i:3}: {line}", end="")
