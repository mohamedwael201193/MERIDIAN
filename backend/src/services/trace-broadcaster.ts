import { EventEmitter } from 'node:events'
import type { AgentTraceRow } from '../db/repositories/agent-trace-repo.js'

const emitter = new EventEmitter()
emitter.setMaxListeners(100)

export function publishTrace(trace: AgentTraceRow): void {
  emitter.emit('trace', trace)
}

export function subscribeTraces(listener: (trace: AgentTraceRow) => void): () => void {
  emitter.on('trace', listener)
  return () => emitter.off('trace', listener)
}
