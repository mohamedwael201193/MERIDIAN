import type {
  AgentDecisionRow,
  ApiEnvelope,
  AuditSummaryRow,
  ComplianceStatus,
  HolderRow,
  MeridianEventRow,
  TokenRow,
  YieldHistoryItem,
  YieldInfo,
} from './types';

function extractErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') {
    return fallback;
  }

  const record = body as Record<string, unknown>;
  const error = record.error;

  if (typeof error === 'string') {
    const detail = typeof record.detail === 'string' ? `: ${record.detail}` : '';
    return `${error}${detail}`;
  }

  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }

  if (typeof record.reason === 'string') return record.reason;
  if (typeof record.detail === 'string') return record.detail;

  return fallback;
}

async function clientFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(extractErrorMessage(body, res.statusText || `Request failed (${res.status})`));
  }

  return body as T;
}

export const meridianApi = {
  health: () => clientFetch<{ status: string; events_indexed?: number }>('/api/health'),

  ready: () => clientFetch<Record<string, unknown>>('/api/ready'),

  tokens: () => clientFetch<ApiEnvelope<TokenRow[]>>('/api/tokens'),

  token: (packageHash: string) =>
    clientFetch<ApiEnvelope<TokenRow>>(`/api/tokens/${encodeURIComponent(packageHash)}`),

  tokenYield: (packageHash: string) =>
    clientFetch<ApiEnvelope<YieldInfo>>(`/api/tokens/${encodeURIComponent(packageHash)}/yield`),

  yieldHistory: (limit = 50) =>
    clientFetch<ApiEnvelope<YieldHistoryItem[]>>(`/api/yields/history?limit=${limit}`),

  holders: (limit = 100) =>
    clientFetch<ApiEnvelope<HolderRow[]>>(`/api/holders?limit=${limit}`),

  holderCompliance: (accountHash: string) =>
    clientFetch<ApiEnvelope<ComplianceStatus>>(
      `/api/holders/${encodeURIComponent(accountHash)}/compliance`,
    ),

  events: (limit = 50) =>
    clientFetch<ApiEnvelope<MeridianEventRow[]>>(`/api/events?limit=${limit}`),

  auditSummaries: (limit = 20) =>
    clientFetch<ApiEnvelope<AuditSummaryRow[]>>(`/api/audit/summaries?limit=${limit}`),

  decisions: (limit = 50) =>
    clientFetch<ApiEnvelope<AgentDecisionRow[]>>(`/api/decisions?limit=${limit}`),

  mcpTool: (tool: string, args: Record<string, unknown> = {}) =>
    clientFetch<{ result: unknown }>('/api/mcp', {
      method: 'POST',
      body: JSON.stringify({ tool, arguments: args }),
    }),

  x402Resource: (resource: string, paymentHeader?: string) =>
    clientFetch<{ data: unknown; settlement?: string }>(
      `/api/x402/resource/${resource}${paymentHeader ? '' : ''}`,
      {
        headers: paymentHeader ? { 'X-Payment': paymentHeader } : undefined,
      },
    ),

  x402Verify: (payment: unknown, network: string) =>
    clientFetch<{ valid: boolean; reason?: string }>('/api/x402/verify', {
      method: 'POST',
      body: JSON.stringify({ payment, network }),
    }),

  x402Settle: (payment: unknown, network: string) =>
    clientFetch<{ success: boolean; transactionHash?: string; reason?: string }>(
      '/api/x402/settle',
      {
        method: 'POST',
        body: JSON.stringify({ payment, network }),
      },
    ),
};
