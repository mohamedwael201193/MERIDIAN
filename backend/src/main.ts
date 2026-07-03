import { buildApp } from './app.js'
import { startEmbeddedAgents } from './agents-runner.js'

async function main(): Promise<void> {
  const { app, env, log, sync } = await buildApp()
  await app.listen({ port: env.PORT, host: env.HOST })
  log.info({ port: env.PORT, host: env.HOST }, 'meridian_backend_started')

  if (sync) {
    void sync.start().catch((error: unknown) => {
      log.error({ err: error }, 'indexer_start_failed')
    })
  }

  startEmbeddedAgents(log)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
