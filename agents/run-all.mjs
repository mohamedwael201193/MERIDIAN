#!/usr/bin/env node
/** Long-running MERIDIAN agents worker — runs all agents on a schedule. */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))
const intervalMs = Number(process.env.AGENT_INTERVAL_MS ?? 300_000)

const agents = [
  ['yield', join(root, 'yield-agent/dist/main.js')],
  ['compliance', join(root, 'compliance-agent/dist/main.js')],
  ['audit', join(root, 'audit-agent/dist/main.js')],
]

function runOnce(label, script) {
  return new Promise((resolve) => {
    const child = spawn('node', [script], { stdio: 'inherit', env: process.env })
    child.on('close', (code) => resolve(code ?? 1))
    child.on('error', () => resolve(1))
  })
}

async function loopAgent(label, script) {
  while (true) {
    console.log(JSON.stringify({ event: 'agent_tick_start', agent: label, at: new Date().toISOString() }))
    const code = await runOnce(label, script)
    console.log(JSON.stringify({ event: 'agent_tick_end', agent: label, code, at: new Date().toISOString() }))
    if (code !== 0) {
      console.error(`${label} agent exited ${code}; retrying in 60s`)
      await new Promise((r) => setTimeout(r, 60_000))
    } else {
      await new Promise((r) => setTimeout(r, intervalMs))
    }
  }
}

console.log(JSON.stringify({ event: 'agents_worker_started', agents: agents.map(([l]) => l), intervalMs }))
await Promise.all(agents.map(([label, script]) => loopAgent(label, script)))
