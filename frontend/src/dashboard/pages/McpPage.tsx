'use client'

import { useMemo, useState, ReactElement } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useWalletActions } from '@lib/hooks/useWalletActions'
import { useWalletSession } from '@lib/hooks/useWalletSession'
import { meridianApi } from '@lib/api'
import type { UnsignedTransaction } from '@lib/types'
import { validatePublicKey } from '@lib/schemas'
import { parseUnsignedTransaction } from '@lib/transactions'
import { MCP_TOOLS, type McpToolKind, type McpToolMeta } from '@lib/mcp-catalog'
import TransactionStatus from '@/components/TransactionStatus'
import TransactionReviewCard from '@/components/TransactionReviewCard'
import StructuredDataCard from '@/components/StructuredDataCard'
import PageHeader from '@/components/PageHeader'
import McpConnectionPanel from '@/components/McpConnectionPanel'
import GlassCard from '@/design/components/GlassCard'
import PremiumButton from '@/design/components/PremiumButton'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { revalidateMeridianData } from '@lib/hooks/useMeridianData'
import { meridianTokens } from '@/design/tokens'

type ToolFilter = 'all' | McpToolKind

function formatToolName(name: string): string {
  return name
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function ToolListRow({
  tool,
  selected,
  onSelect,
}: {
  tool: McpToolMeta
  selected: boolean
  onSelect: () => void
}): ReactElement {
  const isWrite = tool.kind === 'write'

  return (
    <Box
      onClick={onSelect}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        px: 1.75,
        py: 1.35,
        borderRadius: `${meridianTokens.radius.md}px`,
        cursor: 'pointer',
        border: '1px solid',
        borderColor: selected ? 'rgba(255,255,255,0.22)' : 'transparent',
        bgcolor: selected ? 'rgba(255,255,255,0.06)' : 'transparent',
        transition: 'background-color 0.2s, border-color 0.2s',
        '&:hover': {
          bgcolor: selected ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
          borderColor: selected ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)',
        },
      }}
    >
      <Stack direction="row" alignItems="center" gap={1.25} minWidth={0} flex={1}>
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            flexShrink: 0,
            bgcolor: isWrite ? meridianTokens.color.error : meridianTokens.color.success,
            opacity: selected ? 1 : 0.65,
          }}
        />
        <Typography
          variant="body2"
          color={selected ? 'common.white' : 'text.secondary'}
          fontWeight={selected ? 600 : 500}
          noWrap
        >
          {formatToolName(tool.name)}
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="center" gap={0.75} flexShrink={0}>
        {tool.walletRequired ? (
          <IconifyIcon icon="mdi:wallet-outline" width={14} color={meridianTokens.color.textMuted} />
        ) : null}
        <Chip
          size="small"
          label={isWrite ? 'Write' : 'Read'}
          color={isWrite ? 'error' : 'success'}
          variant="outlined"
          sx={{ height: 22, '& .MuiChip-label': { px: 1, fontSize: 11 } }}
        />
      </Stack>
    </Box>
  )
}

function ToolListSection({
  title,
  tools,
  selectedTool,
  onSelect,
}: {
  title: string
  tools: McpToolMeta[]
  selectedTool: string
  onSelect: (tool: McpToolMeta) => void
}): ReactElement | null {
  if (tools.length === 0) return null

  return (
    <Box>
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{
          ...meridianTokens.typography.label,
          display: 'block',
          px: 1.75,
          pt: 1.5,
          pb: 0.75,
        }}
      >
        {title}
      </Typography>
      <Stack gap={0.5}>
        {tools.map((tool) => (
          <ToolListRow
            key={tool.name}
            tool={tool}
            selected={selectedTool === tool.name}
            onSelect={() => onSelect(tool)}
          />
        ))}
      </Stack>
    </Box>
  )
}

export default function McpPage(): ReactElement {
  const wallet = useWalletActions()
  const session = useWalletSession()
  const [filter, setFilter] = useState<ToolFilter>('all')
  const [search, setSearch] = useState('')
  const [selectedTool, setSelectedTool] = useState<string>(MCP_TOOLS[0]?.name ?? 'get_token_info')
  const [argsJson, setArgsJson] = useState(() => JSON.stringify(MCP_TOOLS[0]?.exampleArgs ?? {}, null, 2))
  const [result, setResult] = useState<unknown>(null)
  const [unsignedTx, setUnsignedTx] = useState<UnsignedTransaction | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const activeTool = MCP_TOOLS.find((t) => t.name === selectedTool) ?? MCP_TOOLS[0]
  const isWrite = activeTool?.kind === 'write'

  const filteredTools = useMemo(() => {
    const q = search.trim().toLowerCase()
    return MCP_TOOLS.filter((tool) => {
      if (filter !== 'all' && tool.kind !== filter) return false
      if (!q) return true
      return (
        tool.name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        formatToolName(tool.name).toLowerCase().includes(q)
      )
    })
  }, [filter, search])

  const readTools = useMemo(() => filteredTools.filter((t) => t.kind === 'read'), [filteredTools])
  const writeTools = useMemo(() => filteredTools.filter((t) => t.kind === 'write'), [filteredTools])

  const readCount = MCP_TOOLS.filter((t) => t.kind === 'read').length
  const writeCount = MCP_TOOLS.filter((t) => t.kind === 'write').length

  const selectTool = (tool: McpToolMeta) => {
    setSelectedTool(tool.name)
    setArgsJson(JSON.stringify(tool.exampleArgs, null, 2))
    setResult(null)
    setUnsignedTx(null)
    setTxHash(null)
    setError(null)
  }

  const loadExample = () => {
    if (!activeTool) return
    setArgsJson(JSON.stringify(activeTool.exampleArgs, null, 2))
    setError(null)
  }

  const formatArgs = () => {
    try {
      setArgsJson(JSON.stringify(JSON.parse(argsJson) as unknown, null, 2))
      setError(null)
    } catch {
      setError('Arguments must be valid JSON before formatting.')
    }
  }

  const invokeTool = async () => {
    setLoading(true)
    setError(null)
    setUnsignedTx(null)
    setTxHash(null)
    try {
      const args = JSON.parse(argsJson) as Record<string, unknown>
      const publicKey = await wallet.getPublicKey()
      if (isWrite) {
        if (!publicKey) throw new Error('Connect your wallet to invoke write tools.')
        validatePublicKey(publicKey)
        if (!args.callerPublicKey) args.callerPublicKey = publicKey
      }
      const response = await meridianApi.mcpTool(selectedTool, args)
      const payload = response.result
      if (payload && typeof payload === 'object' && 'transaction' in (payload as object)) {
        setUnsignedTx(parseUnsignedTransaction(payload, `${selectedTool} response`))
        setResult(null)
      } else {
        setResult(payload)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MCP call failed')
    } finally {
      setLoading(false)
    }
  }

  const signAndSubmit = async () => {
    if (!unsignedTx) return
    setLoading(true)
    setError(null)
    try {
      const hash = await wallet.signAndSubmit(unsignedTx)
      setTxHash(hash)
      setResult({ submitted: hash, explorer: `https://testnet.cspr.live/deploy/${hash}` })
      setUnsignedTx(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign/submit failed')
    } finally {
      setLoading(false)
    }
  }

  if (!activeTool) {
    return (
      <Alert severity="warning">No MCP tools are configured.</Alert>
    )
  }

  return (
    <Box>
      <PageHeader
        icon="mdi:api"
        eyebrow="Integrations"
        title="MCP Tool Explorer"
        stepLabel="Step 6 of 8"
        description="Browse MERIDIAN tools, run read calls instantly, and build unsigned transactions for wallet-signed writes."
        actions={
          <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="flex-end">
            <Chip size="small" variant="outlined" label={`${String(readCount)} read`} color="success" />
            <Chip size="small" variant="outlined" label={`${String(writeCount)} write`} color="error" />
            <Chip
              size="small"
              variant="outlined"
              icon={<IconifyIcon icon={session.connected ? 'mdi:wallet-outline' : 'mdi:wallet-off-outline'} width={14} />}
              label={session.connected ? 'Wallet ready' : 'Wallet not connected'}
              color={session.connected ? 'success' : 'warning'}
            />
          </Stack>
        }
      />

      <Accordion
        disableGutters
        elevation={0}
        sx={{
          mb: 3,
          bgcolor: 'transparent',
          '&::before': { display: 'none' },
          border: '1px solid',
          borderColor: meridianTokens.surface.panelBorder,
          borderRadius: `${meridianTokens.radius.lg}px`,
          overflow: 'hidden',
        }}
      >
        <AccordionSummary expandIcon={<IconifyIcon icon="mdi:chevron-down" width={20} />}>
          <Stack direction="row" alignItems="center" gap={1}>
            <IconifyIcon icon="mdi:connection" width={18} color={meridianTokens.color.textSecondary} />
            <Typography variant="subtitle2" color="common.white">
              MCP connection & agent config
            </Typography>
          </Stack>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <McpConnectionPanel />
        </AccordionDetails>
      </Accordion>

      <Box
        display="grid"
        gridTemplateColumns={{ xs: '1fr', lg: 'minmax(300px, 380px) 1fr' }}
        gap={meridianTokens.spacing.sectionGap}
        alignItems="start"
      >
        <Stack gap={meridianTokens.spacing.panelGap}>
          <GlassCard padding={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search tools…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconifyIcon icon="mdi:magnify" width={18} color={meridianTokens.color.textMuted} />
                  </InputAdornment>
                ),
              }}
            />
            <ToggleButtonGroup
              exclusive
              size="small"
              value={filter}
              onChange={(_, value: ToolFilter | null) => value && setFilter(value)}
              sx={{
                mt: 1.5,
                width: '100%',
                gap: 0.75,
                '& .MuiToggleButtonGroup-grouped': {
                  border: '1px solid',
                  borderColor: meridianTokens.surface.panelBorder,
                  borderRadius: `${meridianTokens.radius.sm}px !important`,
                  flex: 1,
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: 13,
                  color: meridianTokens.color.textSecondary,
                  bgcolor: 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                    color: 'common.white',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                    color: 'common.white',
                    fontWeight: 600,
                    borderColor: 'rgba(255,255,255,0.22)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.12)',
                    },
                  },
                },
              }}
            >
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="read">Read</ToggleButton>
              <ToggleButton value="write">Write</ToggleButton>
            </ToggleButtonGroup>
          </GlassCard>

          <GlassCard
            sx={{
              p: 0.75,
              maxHeight: { lg: 'calc(100vh - 280px)' },
              overflowY: 'auto',
            }}
          >
            {filteredTools.length > 0 ? (
              <Stack gap={0.5} pb={1}>
                {filter === 'all' ? (
                  <>
                    <ToolListSection
                      title={`Read tools · ${String(readTools.length)}`}
                      tools={readTools}
                      selectedTool={selectedTool}
                      onSelect={selectTool}
                    />
                    <ToolListSection
                      title={`Write tools · ${String(writeTools.length)}`}
                      tools={writeTools}
                      selectedTool={selectedTool}
                      onSelect={selectTool}
                    />
                  </>
                ) : (
                  <ToolListSection
                    title={filter === 'read' ? `Read tools · ${String(readTools.length)}` : `Write tools · ${String(writeTools.length)}`}
                    tools={filteredTools}
                    selectedTool={selectedTool}
                    onSelect={selectTool}
                  />
                )}
              </Stack>
            ) : (
              <Box py={4} px={2}>
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  No tools match your search.
                </Typography>
              </Box>
            )}
          </GlassCard>
        </Stack>

        <GlassCard sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Stack gap={2.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap">
              <Box>
                <Typography sx={{ ...meridianTokens.typography.title, color: 'common.white' }}>
                  {formatToolName(activeTool.name)}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.disabled"
                  sx={{ fontFamily: meridianTokens.typography.mono.fontFamily }}
                >
                  {activeTool.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={1} maxWidth={560}>
                  {activeTool.description}
                </Typography>
              </Box>
              <Stack direction="row" gap={0.75} flexWrap="wrap">
                <Chip
                  size="small"
                  label={isWrite ? 'Write · wallet required' : 'Read · instant'}
                  color={isWrite ? 'error' : 'success'}
                />
                {activeTool.requiredRole ? (
                  <Chip size="small" variant="outlined" label={activeTool.requiredRole} />
                ) : null}
              </Stack>
            </Stack>

            <Box
              sx={{
                p: 1.5,
                borderRadius: `${meridianTokens.radius.md}px`,
                border: '1px solid',
                borderColor: meridianTokens.surface.panelBorder,
                bgcolor: '#0a0a0e',
              }}
            >
              <Typography variant="caption" color="text.disabled" display="block" mb={0.5}>
                Expected result
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {activeTool.expectedResult}
              </Typography>
            </Box>

            {isWrite && !session.connected ? (
              <Alert severity="warning" icon={<IconifyIcon icon="mdi:wallet-outline" width={20} />}>
                Connect your Casper wallet before invoking this write tool.
              </Alert>
            ) : null}

            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" color="common.white">
                  Arguments
                </Typography>
                <Stack direction="row" gap={1}>
                  <PremiumButton size="small" variant="outlined" icon="mdi:code-json" onClick={formatArgs}>
                    Format
                  </PremiumButton>
                  <PremiumButton size="small" variant="outlined" icon="mdi:backup-restore" onClick={loadExample}>
                    Example
                  </PremiumButton>
                </Stack>
              </Stack>
              <TextField
                fullWidth
                multiline
                minRows={6}
                maxRows={14}
                value={argsJson}
                onChange={(e) => setArgsJson(e.target.value)}
                placeholder="{}"
                sx={{
                  '& textarea': {
                    fontFamily: meridianTokens.typography.mono.fontFamily,
                    fontSize: 13,
                    lineHeight: 1.6,
                  },
                }}
              />
            </Box>

            <Stack direction="row" gap={1.25} flexWrap="wrap" alignItems="center">
              <PremiumButton
                icon="mdi:play"
                loading={loading}
                disabled={isWrite && !session.connected}
                onClick={() => void invokeTool()}
              >
                {loading ? 'Invoking…' : isWrite ? 'Build transaction' : 'Run read tool'}
              </PremiumButton>
              <Typography variant="caption" color="text.disabled">
                {isWrite
                  ? 'Returns an unsigned TransactionV1 for wallet review.'
                  : 'Returns live data from the MCP server.'}
              </Typography>
            </Stack>

            {error ? (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            ) : null}

            {txHash ? (
              <TransactionStatus
                transactionHash={txHash}
                onFinalized={() => void revalidateMeridianData()}
              />
            ) : null}

            {unsignedTx ? (
              <TransactionReviewCard
                transaction={unsignedTx}
                title={`${formatToolName(selectedTool)} transaction`}
                description="Review the transaction details, then sign and submit with your Casper wallet."
                loading={loading}
                onSignAndSubmit={() => void signAndSubmit()}
              />
            ) : null}

            {result && !unsignedTx && !txHash ? (
              <StructuredDataCard
                title="Tool result"
                subtitle={activeTool.name}
                data={result}
              />
            ) : null}

            {!result && !unsignedTx && !txHash && !error && !loading ? (
              <Box
                sx={{
                  py: 4,
                  textAlign: 'center',
                  borderRadius: `${meridianTokens.radius.md}px`,
                  border: '1px dashed',
                  borderColor: meridianTokens.surface.panelBorder,
                }}
              >
                <IconifyIcon icon="mdi:play-circle-outline" width={36} color={meridianTokens.color.textMuted} />
                <Typography variant="body2" color="text.secondary" mt={1.5}>
                  Select a tool, adjust arguments if needed, then invoke to see results here.
                </Typography>
              </Box>
            ) : null}
          </Stack>
        </GlassCard>
      </Box>
    </Box>
  )
}
