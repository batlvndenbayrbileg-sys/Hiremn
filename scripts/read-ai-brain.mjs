import { execSync } from 'child_process'

const out = execSync('wc -l /vercel/share/v0-project/lib/ai-brain.ts && tail -40 /vercel/share/v0-project/lib/ai-brain.ts', { encoding: 'utf8' })
console.log(out)
