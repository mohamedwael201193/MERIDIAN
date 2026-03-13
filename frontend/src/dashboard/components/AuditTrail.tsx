'use client';

import { ReactElement } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Link as MuiLink,
} from '@mui/material';
import { useAuditSummaries, useEvents } from '@lib/hooks/useMeridianData';
import { explorerTxUrl, truncateHash } from '@lib/contracts';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function eventSource(eventData: Record<string, unknown>): string | null {
  const source = eventData.source;
  return typeof source === 'string' ? source : null;
}

export default function AuditTrail(): ReactElement {
  const summaries = useAuditSummaries(20);
  const events = useEvents(20);
  const summaryRows = summaries.data ?? [];
  const eventRows = events.data ?? [];

  if (summaries.isLoading || events.isLoading) {
    return (
      <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (summaries.error || events.error) {
    return (
      <Paper sx={{ p: 4 }}>
        <Alert severity="error">Failed to load audit data from backend.</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: { xs: 3, sm: 4 }, height: 1, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography variant="h4" color="common.white">
            Audit Trail
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.75}>
            Live audit summaries and indexed contract events from the backend.
          </Typography>
        </Box>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Chip size="small" color="primary" label={`${summaryRows.length} summaries`} />
          <Chip size="small" color="success" label={`${eventRows.length} events`} />
        </Stack>
      </Stack>

      <Stack gap={3}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            Agent Summaries
          </Typography>
          {summaryRows.length === 0 ? (
            <Alert severity="info" sx={{ mt: 1.5 }}>
              No audit summaries indexed yet. Recent on-chain events are shown below.
            </Alert>
          ) : (
            <Stack gap={1.5} mt={1.5}>
              {summaryRows.map(row => (
                <Paper
                  key={row.id}
                  variant="outlined"
                  sx={{ p: 2, bgcolor: 'background.default', borderColor: 'divider' }}
                >
                  <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" mb={1}>
                    <Chip size="small" color="primary" label={`${row.event_count} events`} />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(row.created_at)}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="common.white" sx={{ lineHeight: 1.7 }}>
                  {row.summary}
                  </Typography>
                  {row.transaction_hash ? (
                    <MuiLink href={explorerTxUrl(row.transaction_hash)} target="_blank" rel="noreferrer" variant="caption">
                      View tx {truncateHash(row.transaction_hash)}
                    </MuiLink>
                  ) : null}
                </Paper>
              ))}
            </Stack>
          )}
        </Box>

        <Divider />

        <Box>
          <Typography variant="overline" color="text.secondary">
            Recent On-chain Events
          </Typography>
          {eventRows.length === 0 ? (
            <Alert severity="info" sx={{ mt: 1.5 }}>No indexed events yet.</Alert>
          ) : (
            <Stack gap={0} mt={1.5}>
              {eventRows.slice(0, 10).map((row, index) => (
                <Box
                  key={row.id}
                  sx={{
                    py: 1.5,
                    borderTop: index === 0 ? 0 : '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" gap={2} alignItems="flex-start">
                    <Box>
                      <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="body2" color="common.white" fontWeight={700}>
                          {row.contract_name}
                        </Typography>
                        <Chip size="small" variant="outlined" label={row.event_name} />
                        {eventSource(row.event_data) ? (
                          <Chip size="small" color="secondary" label={eventSource(row.event_data)!} />
                        ) : null}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        Block {row.block_height} · Indexed {formatDate(row.indexed_at)}
                      </Typography>
                    </Box>
                    <MuiLink href={explorerTxUrl(row.transaction_hash)} target="_blank" rel="noreferrer" variant="caption">
                      {truncateHash(row.transaction_hash)}
                    </MuiLink>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </Stack>
    </Paper>
  );
}
