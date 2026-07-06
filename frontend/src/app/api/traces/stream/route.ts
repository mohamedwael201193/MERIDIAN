import { getApiKey, getBackendUrl } from '@lib/server/backend'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<Response> {
  const backendRes = await fetch(`${getBackendUrl()}/api/v1/traces/stream`, {
    headers: {
      'X-API-Key': getApiKey(),
      Accept: 'text/event-stream',
    },
  })

  if (!backendRes.ok || !backendRes.body) {
    return new Response('Failed to connect trace stream', { status: 503 })
  }

  return new Response(backendRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
