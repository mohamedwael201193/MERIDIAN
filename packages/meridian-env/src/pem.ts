/**
 * Resolve PEM material from environment variables.
 * Production: inline PEM only (BEGIN marker). File paths are rejected.
 */
export function resolveInlinePemFromEnv(value: string | undefined, label: string): string {
  const trimmed = value?.trim()
  if (!trimmed) {
    throw new Error(`${label}_pem_not_configured`)
  }
  if (trimmed.includes('BEGIN')) {
    return trimmed.replace(/\\n/g, '\n')
  }
  throw new Error(`${label}_pem_must_be_inline_in_env`)
}

export function isInlinePem(value: string | undefined): boolean {
  return Boolean(value?.includes('BEGIN'))
}
