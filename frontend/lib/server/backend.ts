import 'server-only';

export function getBackendUrl(): string {
  const production =
    process.env.BACKEND_URL_PRODUCTION ?? 'https://meridian-backend-cu88.onrender.com';
  const configured = process.env.BACKEND_URL ?? production;

  if (
    process.env.NODE_ENV === 'production' &&
    /localhost|127\.0\.0\.1/.test(configured)
  ) {
    return production;
  }

  return configured;
}

export function getApiKey(): string {
  const key = process.env.MERIDIAN_API_KEY;
  if (!key) {
    throw new Error('MERIDIAN_API_KEY is not configured');
  }
  return key;
}

export async function backendFetch<T>(
  path: string,
  init?: RequestInit & { revalidate?: number },
): Promise<T> {
  const { revalidate = 30, ...fetchInit } = init ?? {};
  const res = await fetch(`${getBackendUrl()}${path}`, {
    ...fetchInit,
    headers: {
      'X-API-Key': getApiKey(),
      'Content-Type': 'application/json',
      ...fetchInit.headers,
    },
    next: { revalidate },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body
        ? (body as { error: { message?: string } }).error.message
        : res.statusText;
    throw new Error(message ?? `Backend request failed (${res.status})`);
  }

  return body as T;
}
