import sys

path = "/vercel/share/v0-project/lib/ai-brain.ts"

with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
for i, line in enumerate(lines, 1):
    print(f"{i:3}: {line}", end="")
