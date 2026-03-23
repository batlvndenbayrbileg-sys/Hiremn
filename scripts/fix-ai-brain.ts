import { readFileSync, writeFileSync } from 'fs'

const path = '/vercel/share/v0-project/lib/ai-brain.ts'
const content = readFileSync(path, 'utf8')

console.log('[v0] Total chars:', content.length)
console.log('[v0] Total lines:', content.split('\n').length)

// Print lines 90-130 to see the duplicate
const lines = content.split('\n')
for (let i = 89; i < Math.min(130, lines.length); i++) {
  console.log(`[v0] Line ${i + 1}: ${lines[i]}`)
}

// Find all occurrences of 'export function compressHistory'
const indices: number[] = []
let idx = content.indexOf('export function compressHistory')
while (idx !== -1) {
  indices.push(idx)
  idx = content.indexOf('export function compressHistory', idx + 1)
}
console.log('[v0] compressHistory occurrences at char indices:', indices)
console.log('[v0] Count:', indices.length)

if (indices.length >= 2) {
  // Keep everything up to just before the second occurrence
  // Walk back to find the start of its preceding comment block
  let cutPoint = indices[1]
  // Walk back over whitespace and comment lines
  const before = content.slice(0, cutPoint)
  const trimmed = before.trimEnd()
  const fixed = trimmed + '\n'
  writeFileSync(path, fixed, 'utf8')
  console.log('[v0] Fixed! Removed second compressHistory starting at char', indices[1])
  console.log('[v0] New line count:', fixed.split('\n').length)
} else {
  console.log('[v0] Only one occurrence found - file may already be clean')
}
