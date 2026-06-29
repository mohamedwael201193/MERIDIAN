const mode = process.env.X402_MODE ?? 'facilitator'

function listenPort(defaultPort: number): number {
  return Number(process.env.PORT ?? defaultPort)
}

async function main(): Promise<void> {
  if (mode === 'combined') {
    const { buildCombinedFromEnv } = await import('./combined-app.js')
    const port = listenPort(Number(process.env.X402_FACILITATOR_PORT ?? 3001))
    buildCombinedFromEnv().listen(port, '0.0.0.0', () => {
      console.log(JSON.stringify({ event: 'x402_combined_started', port }))
    })
    return
  }

  if (mode === 'resource') {
    const { createResourceApp } = await import('./resource-app.js')
    const port = listenPort(Number(process.env.X402_RESOURCE_PORT ?? 3003))
    createResourceApp().listen(port, '0.0.0.0', () => {
      console.log(JSON.stringify({ event: 'x402_resource_started', port }))
    })
    return
  }

  const { buildFacilitatorFromEnv } = await import('./facilitator-app.js')
  const port = listenPort(Number(process.env.X402_FACILITATOR_PORT ?? 3001))
  buildFacilitatorFromEnv().listen(port, '0.0.0.0', () => {
    console.log(JSON.stringify({ event: 'x402_facilitator_started', port }))
  })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
