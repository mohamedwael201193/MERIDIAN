'use client'

import { Chip, CircularProgress, Tooltip } from '@mui/material'
import { useHolderCompliance } from '@lib/hooks/useMeridianData'

interface ComplianceBadgeProps {
  accountHash: string
}

export default function ComplianceBadge({ accountHash }: ComplianceBadgeProps) {
  const { data, isLoading, error } = useHolderCompliance(accountHash)

  if (isLoading) return <CircularProgress size={16} />
  if (error || !data) {
    return <Chip size="small" label="Unknown" color="default" />
  }

  const label = data.compliant ? 'Compliant' : data.status
  const color = data.compliant ? 'success' : data.status === 'revoked' ? 'error' : 'warning'

  return (
    <Tooltip
      title={
        data.revokeReason
          ? `Revoked: ${data.revokeReason}`
          : data.registeredAt
            ? `Registered ${new Date(data.registeredAt).toLocaleString()}`
            : data.status
      }
    >
      <Chip size="small" label={label} color={color} />
    </Tooltip>
  )
}
