import { spawn, type ChildProcess } from 'node:child_process'
import { join } from 'node:path'
import type { FastifyBaseLogger } from 'fastify'

let child: ChildProcess | null = null

export function startEmbeddedAgents(log: FastifyBaseLogger): void {
  if (process.env.AGENTS_ENABLED !== 'true') return

  const script = join(process.cwd(), 'agents/run-all.mjs')
  const launch = () => {
    child = spawn('node', [script], {
      stdio: 'inherit',
      env: process.env,
      cwd: process.cwd(),
    })
    child.on('exit', (code) => {
      log.warn({ code }, 'embedded_agents_exited_restarting')
      setTimeout(launch, 10_000)
    })
    child.on('error', (error) => {
      log.error({ error }, 'embedded_agents_spawn_error')
      setTimeout(launch, 10_000)
    })
  }

  log.info('embedded_agents_starting')
  launch()
}

export function stopEmbeddedAgents(): void {
  child?.kill('SIGTERM')
  child = null
}
