'use client'

import { useEffect, useState } from 'react'
import type { AgentTraceRow } from '@lib/types'

export function useAgentTraceStream(onTrace?: (trace: AgentTraceRow) => void) {
  const [traces, setTraces] = useState<AgentTraceRow[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const source = new EventSource('/api/traces/stream')

    source.addEventListener('open', () => {
      setConnected(true)
    })
    source.addEventListener('error', () => {
      setConnected(false)
    })

    source.addEventListener('snapshot', (event: MessageEvent<string>) => {
      try {
        const body = JSON.parse(event.data) as { traces?: AgentTraceRow[] }
        setTraces(body.traces ?? [])
      } catch {
        // ignore malformed snapshot
      }
    })

    source.addEventListener('trace', (event: MessageEvent<string>) => {
      try {
        const trace = JSON.parse(event.data) as AgentTraceRow
        setTraces((prev) => [...prev, trace].slice(-200))
        onTrace?.(trace)
      } catch {
        // ignore malformed trace
      }
    })

    return () => {
      source.close()
      setConnected(false)
    }
  }, [onTrace])

  return { traces, connected }
}
