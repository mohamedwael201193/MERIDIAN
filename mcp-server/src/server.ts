import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { McpConfig, DeployedAddresses } from './config.js'
import { BackendClient } from './clients/backend-client.js'
import { RpcClient } from './clients/rpc-client.js'
import { TransactionBuilder } from './casper/tx-builder.js'
import { registerReadTools } from './tools/read-tools.js'
import { registerWriteTools, ALL_TOOL_NAMES } from './tools/write-tools.js'

export function createMcpServer(config: McpConfig, addresses: DeployedAddresses): McpServer {
  const server = new McpServer(
    { name: 'meridian-mcp', version: '0.1.0' },
    { capabilities: { tools: {} } },
  )

  const backend = new BackendClient(config.BACKEND_URL, config.MERIDIAN_API_KEY)
  const rpc = new RpcClient(config.CASPER_RPC_URL, config.CASPER_API_KEY)
  const txBuilder = new TransactionBuilder(config.CASPER_CHAIN_NAME, addresses)

  registerReadTools(server, backend, rpc, addresses)
  registerWriteTools(server, txBuilder)

  return server
}

export { ALL_TOOL_NAMES }
