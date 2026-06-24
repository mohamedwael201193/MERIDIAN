import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

const PUBLIC_PATHS = new Set(['/health', '/ready', '/metrics', '/docs', '/docs/json', '/docs/yaml'])

export function createApiKeyHook(expectedKey: string) {
  return async function apiKeyHook(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const path = request.url.split('?')[0] ?? request.url
    if (PUBLIC_PATHS.has(path) || path.startsWith('/docs/')) {
      return
    }
    const header = request.headers['x-api-key']
    const key = Array.isArray(header) ? header[0] : header
    if (!key || key !== expectedKey) {
      await reply.code(401).send({
        error: { code: 'UNAUTHORIZED', message: 'Invalid or missing X-API-Key' },
      })
    }
  }
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, _request, reply) => {
    const statusCode = error.statusCode ?? 500
    reply.code(statusCode).send({
      error: {
        code: error.code ?? 'INTERNAL_ERROR',
        message: error.message,
      },
    })
  })
}
