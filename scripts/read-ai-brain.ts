import { readFileSync } from 'fs'

const content = readFileSync('/vercel/share/v0-project/lib/ai-brain.ts', 'utf8')
const lines = content.split('\n')
console.log(`Total lines: ${lines.length}`)
console.log('--- Full file ---')
lines.forEach((line, i) => console.log(`${i + 1}: ${line}`))
