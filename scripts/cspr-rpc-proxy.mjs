#!/usr/bin/env node
/**
 * CSPR.cloud proxy: injects Authorization on RPC and emulates SSE TransactionProcessed
 * events by polling info_get_transaction (Odra livenet requires SSE; CSPR.cloud /events 404).
 */
import http from 'node:http'
import https from 'node:https'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEnvFile } from './load-env.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const env = loadEnvFile(resolve(root, '.env'))
const TOKEN = process.env.CSPR_CLOUD_AUTH_TOKEN || env.CSPR_CLOUD_AUTH_TOKEN || env.CASPER_API_KEY
const RPC_UPSTREAM = (
  process.env.CSPR_RPC_UPSTREAM ||
  process.env.CASPER_RPC_URL?.replace(/\/rpc\/?$/, '') ||
  'https://node.testnet.casper.network'
).replace(/\/$/, '')
const RPC_PORT = Number(process.env.CSPR_RPC_PROXY_PORT || 18777)
const EVENTS_PORT = Number(process.env.CSPR_EVENTS_PROXY_PORT || 18778)

if (!TOKEN && RPC_UPSTREAM.includes('cspr.cloud')) {
  console.error('Missing CSPR_CLOUD_AUTH_TOKEN or CASPER_API_KEY for CSPR.cloud upstream')
  process.exit(1)
}

/** @type {Set<import('node:http').ServerResponse>} */
const sseClients = new Set()
/** @type {Map<string, ReturnType<typeof setInterval>>} */
const pollers = new Map()

function rpcCall(method, params) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ id: 1, jsonrpc: '2.0', method, params })
    const req = https.request(
      `${RPC_UPSTREAM}/rpc`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(TOKEN ? { Authorization: TOKEN } : {}),
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          try {
            resolve(JSON.parse(data))
          } catch (e) {
            reject(e)
          }
        })
      },
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function emitSse(payload) {
  const msg = `data: ${JSON.stringify(payload)}\n\n`
  for (const client of sseClients) {
    client.write(msg)
  }
}

function txHashFromPutResponse(json) {
  const hash = json?.result?.transaction_hash
  if (!hash) return null
  if (typeof hash === 'string') return hash
  if (hash.Version1) return hash.Version1
  if (hash.Deploy) return hash.Deploy
  return null
}

function startPolling(hash) {
  if (pollers.has(hash)) return
  let attempts = 0
  const timer = setInterval(async () => {
    attempts += 1
    if (attempts > 180) {
      clearInterval(timer)
      pollers.delete(hash)
      return
    }
    try {
      const resp = await rpcCall('info_get_transaction', {
        transaction_hash: { Version1: hash },
        finalized_approvals: true,
      })
      if (attempts <= 3 || attempts % 10 === 0) {
        console.log(`[poll] ${hash.slice(0, 16)} attempt ${attempts}`, JSON.stringify(resp?.result ?? resp?.error)?.slice(0, 200))
      }
      const executionInfo = resp?.result?.execution_info
      const executionResult = executionInfo?.execution_result
      if (!executionResult) return
      const er = executionResult.Version2 ?? executionResult
      const isFailure = er?.error_message != null
      const isSuccess = !isFailure && (er?.limit != null || er?.Success != null)
      if (!isSuccess && !isFailure) return
      // Brief delay so state queries succeed after successful writes
      if (!isFailure) {
        await new Promise((r) => setTimeout(r, 1500))
      }
      emitSse({
        TransactionProcessed: {
          transaction_hash: { Version1: hash },
          execution_result: executionResult,
        },
      })
      clearInterval(timer)
      pollers.delete(hash)
      console.log(`[sse] TransactionProcessed ${hash}`)
    } catch {
      /* retry */
    }
  }, 2000)
  pollers.set(hash, timer)
}

function handleRpcProxy(req, res) {
  const chunks = []
  req.on('data', (c) => chunks.push(c))
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8')
    let parsed
    try {
      parsed = JSON.parse(body)
    } catch {
      res.writeHead(400)
      res.end('bad json')
      return
    }

    const upstreamReq = https.request(
      `${RPC_UPSTREAM}/rpc`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(TOKEN ? { Authorization: TOKEN } : {}),
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (upRes) => {
        const upChunks = []
        upRes.on('data', (c) => upChunks.push(c))
        upRes.on('end', () => {
          const upBody = Buffer.concat(upChunks)
          res.writeHead(upRes.statusCode || 502, upRes.headers)
          res.end(upBody)
          if (parsed?.method === 'account_put_transaction') {
            try {
              const hash = txHashFromPutResponse(JSON.parse(upBody.toString('utf8')))
              if (hash) {
                console.log(`[rpc] account_put_transaction -> ${hash}`)
                startPolling(hash)
              }
            } catch {
              /* ignore */
            }
          }
        })
      },
    )
    upstreamReq.on('error', (err) => {
      res.writeHead(502)
      res.end(`Proxy error: ${err.message}`)
    })
    upstreamReq.write(body)
    upstreamReq.end()
  })
}

const rpcServer = http.createServer((req, res) => {
  const path = req.url?.startsWith('/rpc') ? req.url : `/rpc${req.url === '/' ? '' : req.url}`
  if (req.method === 'POST' && path.startsWith('/rpc')) {
    handleRpcProxy(req, res)
    return
  }
  res.writeHead(404)
  res.end('not found')
})

const eventsServer = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })
  res.write(': connected\n\n')
  sseClients.add(res)
  req.on('close', () => sseClients.delete(res))
})

rpcServer.listen(RPC_PORT, '127.0.0.1', () => {
  console.log(`CSPR RPC proxy  http://127.0.0.1:${RPC_PORT}/rpc -> ${RPC_UPSTREAM}/rpc`)
})
eventsServer.listen(EVENTS_PORT, '127.0.0.1', () => {
  console.log(`CSPR SSE emulator http://127.0.0.1:${EVENTS_PORT}/ (polls info_get_transaction)`)
})
