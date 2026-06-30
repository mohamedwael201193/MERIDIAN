type IconProps = { className?: string }

export function StakingIcon({ className = 'h-28 w-28' }: IconProps) {
  return (
    <svg viewBox="0 0 96 96" fill="none" className={className} aria-hidden="true">
      <path d="M48 12L72 28V52L48 68L24 52V28L48 12Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M48 32V56M36 44H60" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="48" cy="48" r="34" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function ComplianceIcon({ className = 'h-28 w-28' }: IconProps) {
  return (
    <svg viewBox="0 0 96 96" fill="none" className={className} aria-hidden="true">
      <rect x="22" y="18" width="52" height="60" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M34 38H62M34 50H62M34 62H50" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M58 58L64 64L74 50"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function AgentIcon({ className = 'h-28 w-28' }: IconProps) {
  return (
    <svg viewBox="0 0 96 96" fill="none" className={className} aria-hidden="true">
      <circle cx="48" cy="34" r="12" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M24 72C24 58.7452 34.7452 48 48 48C61.2548 48 72 58.7452 72 72"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="68" cy="28" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="28" cy="28" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M68 34V42M28 34V42" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function McpIcon({ className = 'h-28 w-28' }: IconProps) {
  return (
    <svg viewBox="0 0 96 96" fill="none" className={className} aria-hidden="true">
      <rect x="20" y="20" width="56" height="56" rx="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M32 48H64M48 32V64" stroke="currentColor" strokeWidth="1.5" />
      <circle
        cx="48"
        cy="48"
        r="34"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 6"
      />
    </svg>
  )
}
