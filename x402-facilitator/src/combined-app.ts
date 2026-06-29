import express from 'express'
import { buildFacilitatorFromEnv } from './facilitator-app.js'
import { createResourceApp } from './resource-app.js'

/** Single-process x402 stack: facilitator + paid resource loops on one port. */
export function createCombinedApp(): express.Application {
  const facilitator = buildFacilitatorFromEnv()
  const resource = createResourceApp()

  const app = express()
  app.use(facilitator)
  app.use(resource)

  return app
}

export function buildCombinedFromEnv(): express.Application {
  return createCombinedApp()
}
