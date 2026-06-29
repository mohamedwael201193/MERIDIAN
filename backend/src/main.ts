import { buildApp } from './app.js'
import { startEmbeddedAgents } from './agents-runner.js'

async function main(): Promise<void> {
  const { app, env, log } = await buildApp()
  await app.listen({ port: env.PORT, host: env.HOST })
  log.info({ port: env.PORT, host: env.HOST }, 'meridian_backend_started')
  startEmbeddedAgents(log)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
