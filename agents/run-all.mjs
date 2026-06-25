#!/usr/bin/env node
/** Start all MERIDIAN agents sequentially (Render worker entrypoint). */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))

function run(label: string, script: string): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn('node', [script], { stdio: 'inherit', env: process.env })
    child.on('close', (code) => resolve(code ?? 1))
  })
}

const agents = [
  ['yield', join(root, 'yield-agent/dist/main.js')],
  ['compliance', join(root, 'compliance-agent/dist/main.js')],
  ['audit', join(root, 'audit-agent/dist/main.js')],
]

for (const [label, script] of agents) {
  console.log(`starting ${label} agent`)
  const code = await run(label, script)
  if (code !== 0) {
    console.error(`${label} agent exited ${code}`)
    process.exit(code)
  }
}
