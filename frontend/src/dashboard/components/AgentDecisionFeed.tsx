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
import { useDecisions } from '@lib/hooks/useMeridianData';
import { explorerAccountUrl, truncateHash } from '@lib/contracts';
import type { AgentDecisionRow } from '@lib/types';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function textPayload(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function numberPayload(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key];
  return typeof value === 'number' ? value : null;
}

function decisionSummary(row: AgentDecisionRow): { title: string; detail: string } {
  const action = textPayload(row.payload, 'action');
  const rationale = textPayload(row.payload, 'rationale');
  const summary = textPayload(row.payload, 'summary');
  const review = row.payload.review;

  if (summary) {
    return { title: row.decision_type, detail: summary };
  }

  if (review && typeof review === 'object' && 'summary' in review) {
    const reviewSummary = (review as { summary?: unknown }).summary;
    if (typeof reviewSummary === 'string') {
      return { title: row.decision_type, detail: reviewSummary };
    }
  }

  return {
    title: action ? `${row.decision_type}: ${action}` : row.decision_type,
    detail: rationale ?? 'No rationale was included with this decision.',
  };
}

function approvalColor(approved: boolean | null): 'success' | 'error' | 'warning' {
  if (approved === true) return 'success';
  if (approved === false) return 'error';
  return 'warning';
}

function approvalLabel(approved: boolean | null): string {
  if (approved === true) return 'approved';
  if (approved === false) return 'rejected';
  return 'pending';
}

export default function AgentDecisionFeed(): ReactElement {
  const { data, isLoading, error } = useDecisions(50);
  const decisions = data ?? [];

  if (isLoading) {
    return (
      <Paper sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 4 }}>
        <Alert severity="error">Failed to load agent decisions from backend.</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: { xs: 3, sm: 4 }, height: 1, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} mb={3}>
        <Box>
          <Typography variant="h4" color="common.white">
            Agent Decisions
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.75}>
            Live yield, compliance, and audit agent output from the backend.
          </Typography>
        </Box>
        <Chip size="small" color="primary" label={`${decisions.length} decisions`} />
      </Stack>

      {decisions.length === 0 ? (
        <Alert severity="info">No agent decisions indexed yet.</Alert>
      ) : (
        <Stack gap={0} divider={<Divider flexItem />}>
          {decisions.map(row => {
            const summary = decisionSummary(row);
            const confidence = numberPayload(row.payload, 'confidence');

            return (
              <Box key={row.id} sx={{ py: 2 }}>
                <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" mb={1}>
                  <Chip size="small" label={row.agent_name} color="primary" />
                  <Chip size="small" label={approvalLabel(row.approved)} color={approvalColor(row.approved)} />
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(row.created_at)}
                  </Typography>
                </Stack>

                <Typography variant="subtitle2" color="common.white" fontWeight={700}>
                  {summary.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mt: 0.5 }}>
                  {summary.detail}
                </Typography>

                <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap" mt={1.25}>
                  <Chip size="small" variant="outlined" label={`hash ${truncateHash(row.decision_hash)}`} />
                  {confidence !== null ? (
                    <Chip size="small" variant="outlined" label={`confidence ${(confidence * 100).toFixed(0)}%`} />
                  ) : null}
                  {row.reviewed_by ? (
                    <Chip size="small" variant="outlined" label={`reviewed by ${row.reviewed_by}`} />
                  ) : null}
                </Stack>

                {row.attestation?.accountHash ? (
                  <MuiLink
                    href={explorerAccountUrl(row.attestation.accountHash)}
                    target="_blank"
                    rel="noreferrer"
                    variant="caption"
                    sx={{ display: 'inline-block', mt: 1 }}
                  >
                    Attested by {row.attestation.agent} · {truncateHash(row.attestation.accountHash)}
                  </MuiLink>
                ) : null}
              </Box>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}
